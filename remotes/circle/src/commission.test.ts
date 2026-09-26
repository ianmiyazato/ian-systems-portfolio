import { describe, expect, it } from 'vitest';
import { commissionFor, DEFAULT_RATE, sampleOrder, summerSwim } from './commission';

describe('commission math', () => {
  const { lines, total } = commissionFor(sampleOrder, [summerSwim]);

  it('pays the swim rule rate on matching items', () => {
    expect(lines[0]).toMatchObject({ rate: 0.1, amount: 25.9, rule: 'summer-swim' });
    expect(lines[1]).toMatchObject({ rate: 0.1, amount: 19.9 });
  });

  it('pays nothing on third-party marketplace items or returns', () => {
    expect(lines[2]).toMatchObject({ rate: 0, amount: 0, rule: 'marketplace' });
    expect(lines[4]).toMatchObject({ rate: 0, amount: 0, rule: 'returned' });
  });

  it('falls back to the default rate outside the rule', () => {
    expect(lines[3]).toMatchObject({ rate: DEFAULT_RATE, amount: 14.94, rule: null });
  });

  it('totals the receipt', () => {
    expect(total).toBe(60.74);
  });

  it('lets a higher-priority rule win', () => {
    const boost = { ...summerSwim, id: 'boost', priority: 30, rate: 0.15 };
    expect(commissionFor(sampleOrder, [summerSwim, boost]).lines[0]?.rule).toBe('boost');
  });
});
