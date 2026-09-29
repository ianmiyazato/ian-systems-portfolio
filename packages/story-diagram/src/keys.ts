/** Pure keyboard and step arithmetic, shared by the player and its tests. */
export type Command = 'next' | 'prev' | 'first' | 'last' | 'pause' | 'layer' | 'present' | 'notes' | 'exit';

type KeyLike = { key: string; shiftKey: boolean; metaKey: boolean; ctrlKey: boolean; altKey: boolean };

const map: Record<string, Command> = {
  ArrowRight: 'next', ' ': 'next', PageDown: 'next',
  ArrowLeft: 'prev', PageUp: 'prev',
  Home: 'first', End: 'last',
  p: 'pause', e: 'layer', f: 'present', n: 'notes',
  Escape: 'exit'
};

/** Modified keys belong to the browser and the portfolio chrome (⌘K palette, ⇧P performance HUD). */
export function commandFor(event: KeyLike): Command | null {
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return null;
  return map[event.key] ?? map[event.key.toLowerCase()] ?? null;
}

/** 1-based page step → the screen (0-based) and its own step (1-based). */
export function locate(counts: number[], step: number): { screen: number; step: number } {
  let remaining = step;
  for (const [screen, count] of counts.entries()) {
    if (remaining <= count) return { screen, step: remaining };
    remaining -= count;
  }
  return { screen: counts.length - 1, step: counts.at(-1) ?? 1 };
}

export function flatten(counts: number[], screen: number, step: number): number {
  return counts.slice(0, screen).reduce((sum, count) => sum + count, 0) + step;
}

/** Reads ?step= (1-based, clamped); "last" means the final step. */
export function parseStep(search: string, total: number): number {
  const raw = new URLSearchParams(search).get('step');
  if (raw === 'last') return total;
  const value = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 1), total);
}
