import { describe, expect, it } from 'vitest';
import { buildVsBuy, freeWithoutLimit, mapDots, quadrantOf, rowSchema, type Row } from '../src/build-vs-buy';

const tables = Object.entries(buildVsBuy);

describe('build vs buy tables', () => {
  it('has both problems, six components each', () => {
    expect(Object.keys(buildVsBuy)).toEqual(['metrics', 'personalization']);
    for (const [, table] of tables) expect(table.rows).toHaveLength(6);
  });

  for (const [name, table] of tables) {
    for (const row of table.rows) {
      it(`${name} · ${row.component}: decision, why, give-up, swap plan and cost at 10×`, () => {
        expect(rowSchema.safeParse(row).success).toBe(true);
        for (const field of ['decision', 'why', 'giveUp', 'swapPlan', 'costAt10x'] as const) expect(row[field].trim().length, field).toBeGreaterThan(10);
      });
    }
  }

  it('never says "free" without a limit attached', () => {
    expect(freeWithoutLimit('Free forever')).toBe(true);
    expect(freeWithoutLimit('Free up to 1M events a month')).toBe(false);
    expect(freeWithoutLimit('free tier limit: 10 GB')).toBe(false);
    for (const [, table] of tables) {
      for (const row of table.rows) {
        for (const text of [row.decision, row.why, row.giveUp, row.swapPlan, row.costAt10x]) expect(freeWithoutLimit(text), `${row.component}: ${text}`).toBe(false);
      }
    }
  });

  it('places every dot in the quadrant its decision names', () => {
    for (const [, table] of tables) {
      for (const row of table.rows) {
        const quadrant = quadrantOf(row);
        if (row.kind === 'buy') expect(quadrant, row.component).toBe('buy');
        if (row.kind === 'open-source') expect(quadrant, row.component).toBe('open-source');
        if (row.kind === 'build') expect(['build-now', 'build-later'], row.component).toContain(quadrant);
      }
    }
  });

  it('generates the map from the same rows, so the map cannot disagree with the cards', () => {
    const dots = mapDots();
    const rows: Row[] = tables.flatMap(([, table]) => table.rows);
    expect(dots.map((dot) => dot.id)).toEqual(rows.map((row) => row.id));
    for (const dot of dots) {
      expect(dot.x).toBeGreaterThanOrEqual(0);
      expect(dot.x).toBeLessThanOrEqual(100);
      expect(dot.y).toBeGreaterThanOrEqual(0);
      expect(dot.y).toBeLessThanOrEqual(100);
    }
    // Dots never sit on top of each other.
    for (const [index, a] of dots.entries()) for (const b of dots.slice(index + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.id} × ${b.id}`).toBeGreaterThan(6);
  });
});
