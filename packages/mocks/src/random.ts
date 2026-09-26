/** Mulberry32: tiny, fast and deterministic, so every reviewer sees the same synthetic data. */
export function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export type Random = ReturnType<typeof rng>;

export const int = (random: Random, min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
export const pick = <T>(random: Random, items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
export const round = (value: number, digits = 2) => Number(value.toFixed(digits));

/** A seeded random walk, used for sparklines and signal charts. */
export function series(seed: number, length: number, start = 50, volatility = 6, drift = 0) {
  const random = rng(seed);
  const values: number[] = [];
  let value = start;
  for (let index = 0; index < length; index += 1) {
    value = Math.max(2, value + (random() - 0.5) * volatility * 2 + drift);
    values.push(round(value, 1));
  }
  return values;
}

/** Hash a string to a stable seed. */
export function seedOf(text: string) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
