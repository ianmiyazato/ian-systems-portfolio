import { describe, expect, it } from 'vitest';
import { agreementQuote } from './agreement';

describe('agreement quotes', () => {
  it('discounts the balance before financing it', () => {
    const quote = agreementQuote(2340.8, 10, 1);
    expect(quote).toMatchObject({ discount: 234.08, principal: 2106.72, installment: 2106.72, total: 2106.72, savings: 234.08 });
  });

  it('prices installments with a fixed monthly payment', () => {
    const quote = agreementQuote(2340.8, 5, 6);
    expect(quote.principal).toBe(2223.76);
    expect(quote.installment).toBe(396.86);
    expect(quote.total).toBe(2381.16);
    expect(quote.savings).toBeLessThan(0);
  });

  it('never charges more per installment as the plan gets longer', () => {
    const [three, six, twelve] = [3, 6, 12].map((count) => agreementQuote(1000, 0, count).installment);
    expect(three!).toBeGreaterThan(six!);
    expect(six!).toBeGreaterThan(twelve!);
  });
});
