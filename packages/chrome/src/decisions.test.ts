import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateDecisions } from './decisions';
import { routes as screens } from './routes';

const dir = resolve(__dirname, '../../../decisions');
const load = (id: string) => JSON.parse(readFileSync(resolve(dir, `${id}.json`), 'utf8')) as unknown;

describe('Decision Lens content', () => {
  it.each(screens.map((screen) => [screen.id]))('%s has at least four valid decisions', (id) => {
    expect(validateDecisions(id, load(id))).toEqual([]);
  });

  it('every anchor is a data-anchor selector the browser test can resolve', () => {
    for (const screen of screens) {
      for (const decision of load(screen.id) as Array<{ anchor: string }>) expect(decision.anchor, screen.id).toMatch(/^\[data-anchor="[a-z0-9-]+"\]/);
    }
  });

  it('has no orphan decision files', () => {
    const ids = new Set(screens.map((screen) => screen.id));
    for (const file of readdirSync(dir)) expect(ids.has(file.replace(/\.json$/, '')), file).toBe(true);
  });

  it('rejects files with too few decisions', () => {
    expect(validateDecisions('x', [{ id: 'a', anchor: '[data-anchor="a"]', tag: 'Frontend', decision: 'd', why: 'w', alternative: 'a', value: 'v' }])).toContain('x: needs at least 4 decisions, has 1');
  });
});
