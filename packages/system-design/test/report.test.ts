import { describe, expect, it } from 'vitest';
import { reportSeries } from '../src/report';

describe('morning report data', () => {
  const series = reportSeries();

  it('covers a Monday from 08:00 to 18:00 in 10-minute buckets, breaking at 14:00', () => {
    expect(series.times[0]).toBe('08:00');
    expect(series.times.at(-1)).toBe('18:00');
    expect(series.times[series.breakIndex]).toBe('14:00');
  });

  it('stays inside the normal range before 14:00', () => {
    for (let index = 0; index < series.breakIndex; index += 1) {
      expect(series.today[index]!).toBeGreaterThanOrEqual(series.low[index]!);
      expect(series.today[index]!).toBeLessThanOrEqual(series.high[index]!);
    }
  });

  it('supports the sentence: 12% below a normal Monday since 14:00', () => {
    const after = series.today.slice(series.breakIndex + 1).map((value, index) => value / series.normal[series.breakIndex + 1 + index]!);
    const average = after.reduce((sum, ratio) => sum + ratio, 0) / after.length;
    expect(Math.round((1 - average) * 100)).toBe(12);
    for (const [index, value] of series.today.slice(series.breakIndex + 1).entries()) expect(value).toBeLessThan(series.low[series.breakIndex + 1 + index]!);
  });
});
