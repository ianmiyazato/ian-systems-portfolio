import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { DEFAULT_START, MINUTE, World, initialState } from './index';

const schemaDir = resolve(__dirname, '../../events/schemas');
const version = (file: string) => Number(file.replace(/^v/, '').replace(/\.json$/, ''));

/** The latest released JSON Schema per topic (proposed versions are not on the wire yet). */
const current = Object.fromEntries(
  readdirSync(schemaDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = readdirSync(resolve(schemaDir, entry.name)).filter((name) => !name.includes('proposed')).sort((a, b) => version(a) - version(b)).at(-1)!;
      return [entry.name, JSON.parse(readFileSync(resolve(schemaDir, entry.name, file), 'utf8'))];
    })
);

describe('JSON Schema contracts match what the world produces', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validators = Object.fromEntries(Object.entries(current).map(([topic, schema]) => [topic, ajv.compile(schema)]));
  const world = new World(initialState('', 0));

  it('validates an hour of generated events on the wire (JSON round-trip)', () => {
    const events = world.between(DEFAULT_START, DEFAULT_START + 60 * MINUTE);
    expect(events.length).toBeGreaterThan(1500);
    const failures: string[] = [];
    for (const event of events) {
      const validate = validators[event.topic];
      if (!validate) failures.push(`no schema for ${event.topic}`);
      else if (!validate(JSON.parse(JSON.stringify(event)))) failures.push(`${event.topic}: ${ajv.errorsText(validate.errors)}`);
    }
    expect([...new Set(failures)]).toEqual([]);
  });

  it('has a schema for every topic the world can emit', () => {
    const emitted = new Set(world.between(DEFAULT_START, DEFAULT_START + 60 * MINUTE).map((event) => event.topic));
    for (const topic of emitted) expect(Object.keys(current)).toContain(topic);
  });
});
