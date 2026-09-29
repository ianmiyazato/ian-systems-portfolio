/**
 * Build vs buy: one row per component, for both problems. The cards, the 2 × 2 map and the
 * decision log all read these rows, so the map can never disagree with the cards.
 */
import { z } from 'zod';
import metrics from '../data/build-vs-buy/metrics.json';
import personalization from '../data/build-vs-buy/personalization.json';

export const rowSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  component: z.string().min(3),
  kind: z.enum(['build', 'buy', 'open-source']),
  decision: z.string().min(3),
  why: z.string().min(10),
  giveUp: z.string().min(10),
  /** Engineering layer: how we would replace this later. */
  swapPlan: z.string().min(10),
  /** Engineering layer: what happens to cost at 10× the volume. */
  costAt10x: z.string().min(10),
  /** 1–5: how much it makes us different (map x). */
  difference: z.number().min(1).max(5),
  /** 1–5: how hard it is to do well (map y). */
  difficulty: z.number().min(1).max(5)
});

export const tableSchema = z.object({ problem: z.enum(['a', 'b']), title: z.string(), rows: z.array(rowSchema).min(1) });

export type Row = z.infer<typeof rowSchema>;
export type Table = z.infer<typeof tableSchema>;
export type Quadrant = 'buy' | 'build-later' | 'open-source' | 'build-now';

export const buildVsBuy = {
  metrics: tableSchema.parse(metrics),
  personalization: tableSchema.parse(personalization)
} as const;

export const quadrants: Record<Quadrant, { title: string; line: string }> = {
  buy: { title: 'Buy', line: 'Hard and generic: someone else does it better.' },
  'build-later': { title: 'Build later', line: 'Ours in the end; start with a ready tool.' },
  'open-source': { title: 'Use open source', line: 'Generic and simple: take the standard.' },
  'build-now': { title: 'Build now', line: 'Why customers choose us, and within reach.' }
};

export const kindLabel: Record<Row['kind'], string> = { build: 'Build', buy: 'Buy', 'open-source': 'Open source' };

/** The map splits both axes at 3: left/right is difference, bottom/top is difficulty. */
export function quadrantOf(row: Pick<Row, 'difference' | 'difficulty'>): Quadrant {
  const different = row.difference >= 3;
  const hard = row.difficulty >= 3;
  if (different) return hard ? 'build-later' : 'build-now';
  return hard ? 'buy' : 'open-source';
}

/** True when a text says "free" without a limit (a number or the word limit/up to/until) close after it. */
export function freeWithoutLimit(text: string): boolean {
  const pattern = /\bfree\b/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const after = text.slice(match.index, match.index + 48);
    if (!/\d|limit|up to|until/i.test(after)) return true;
  }
  return false;
}

export type Dot = { id: string; problem: 'a' | 'b'; x: number; y: number; quadrant: Quadrant; row: Row };

/** Map positions in percent (x from the left, y from the bottom), in row order: Problem A, then B. */
export function mapDots(): Dot[] {
  return Object.values(buildVsBuy).flatMap((table) => table.rows.map((row) => ({
    id: row.id,
    problem: table.problem,
    x: ((row.difference - 1) / 4) * 100,
    y: ((row.difficulty - 1) / 4) * 100,
    quadrant: quadrantOf(row),
    row
  })));
}
