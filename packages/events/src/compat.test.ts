import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compatible, diff, report, type Consumer, type JsonSchema, type Mode } from './compat';

const root = resolve(__dirname, '../../..');
const schemaDir = resolve(__dirname, '../schemas');
const reportFile = resolve(__dirname, '../contracts-report.json');
const read = <T>(file: string) => JSON.parse(readFileSync(file, 'utf8')) as T;

export function loadSchemas() {
  const out: Record<string, Record<string, JsonSchema>> = {};
  for (const topic of readdirSync(schemaDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    out[topic.name] = Object.fromEntries(readdirSync(resolve(schemaDir, topic.name)).map((file) => [file.replace(/\.json$/, ''), read<JsonSchema>(resolve(schemaDir, topic.name, file))]));
  }
  return out;
}

/** Consumer contracts live next to the code that reads the fields. */
export function loadConsumers(): Consumer[] {
  const files = [
    ...['remotes', 'apps'].flatMap((dir) => readdirSync(resolve(root, dir)).map((name) => resolve(root, dir, name, 'contracts.json'))),
    ...readdirSync(resolve(__dirname, '../consumers')).map((file) => resolve(__dirname, '../consumers', file))
  ];
  return files.filter((file) => existsSync(file)).map((file) => read<Consumer>(file)).sort((a, b) => a.consumer.localeCompare(b.consumer));
}

const modes = read<{ modes: Record<string, Mode> }>(resolve(schemaDir, 'registry.json')).modes;

describe('schema compatibility (CI gate)', () => {
  const current = report(loadSchemas(), modes, loadConsumers());

  it('every released version is compatible with the one before it under the topic mode', () => {
    const breaking = current.flatMap((topic) => topic.transitions.filter((step) => !step.to.endsWith('.proposed') && !step.compatible).map((step) => `${topic.topic} ${step.from} → ${step.to}: ${step.changes.map((change) => `${change.kind} ${change.path}`).join(', ')}`));
    expect(breaking).toEqual([]);
  });

  it('every consumer contract reads fields that exist in the current version', () => {
    const schemas = loadSchemas();
    const missing: string[] = [];
    for (const consumer of loadConsumers()) {
      for (const [topic, paths] of Object.entries(consumer.reads)) {
        const topicReport = current.find((item) => item.topic === topic);
        expect(topicReport, `${consumer.consumer} reads unknown topic ${topic}`).toBeDefined();
        const available = JSON.stringify(schemas[topic]![topicReport!.current]);
        for (const path of paths.filter((item) => item !== '*')) if (!available.includes(`"${path.split('.').at(-1)!.replace('[]', '')}"`)) missing.push(`${consumer.consumer} → ${topic}.${path}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('blocks the proposed delivery.updated v3 and names exactly who it breaks', () => {
    const delivery = current.find((topic) => topic.topic === 'delivery.updated')!;
    expect(delivery.status).toBe('blocked');
    expect(delivery.transitions.at(-1)!.compatible).toBe(false);
    expect(delivery.consumers.filter((item) => item.breaks.length).map((item) => item.consumer).sort()).toEqual(['counter', 'notifications', 'shop-tracking']);
    expect(delivery.consumers.filter((item) => !item.breaks.length).map((item) => item.consumer).sort()).toEqual(['mesh', 'tidewatch']);
  });

  it('treats an added optional field as fully compatible and a new required one as backward-breaking', () => {
    const base: JsonSchema = { properties: { payload: { type: 'object', required: ['a'], properties: { a: { type: 'string' } } } } };
    const optional: JsonSchema = { properties: { payload: { type: 'object', required: ['a'], properties: { a: { type: 'string' }, b: { type: 'string' } } } } };
    const required: JsonSchema = { properties: { payload: { type: 'object', required: ['a', 'b'], properties: { a: { type: 'string' }, b: { type: 'string' } } } } };
    expect(compatible(diff(base, optional), 'FULL')).toBe(true);
    expect(compatible(diff(base, required), 'BACKWARD')).toBe(false);
    expect(compatible(diff(required, base), 'FORWARD')).toBe(false);
  });

  it('the report the Mesh Contracts view renders is up to date', () => {
    const rendered = `${JSON.stringify({ generatedBy: 'packages/events/src/compat.ts', topics: current }, null, 2)}\n`;
    if (process.env.WRITE_CONTRACTS) writeFileSync(reportFile, rendered);
    expect(readFileSync(reportFile, 'utf8')).toBe(rendered);
  });
});
