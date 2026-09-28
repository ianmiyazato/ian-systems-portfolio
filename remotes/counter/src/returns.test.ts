import { describe, expect, it } from 'vitest';
import { refundQuote, todaysReturns } from './returns';

const helena = todaysReturns.find((item) => item.returnId === 'RT-12418')!;
const marina = todaysReturns.find((item) => item.returnId === 'RT-12407')!;

describe('refund quotes', () => {
  it('reverses Maré Pay installments instead of refunding the full price', () => {
    const quote = refundQuote(helena, 'original-payment');
    expect(quote.installmentsReversed).toBe(2);
    expect(quote.installmentCents).toBe(10633);
    expect(quote.refundedNowCents).toBe(10633);
    // Paid now + canceled installments never exceed the price.
    expect(quote.refundedNowCents + quote.installmentCents * quote.installmentsReversed).toBeLessThanOrEqual(31900);
  });

  it('adds a 10% instant bonus to store credit', () => {
    const quote = refundQuote(helena, 'store-credit');
    expect(quote.amountCents).toBe(35090);
    expect(quote.bonusCents).toBe(3190);
  });

  it('reverses the creator commission only when money moves', () => {
    expect(refundQuote(helena, 'store-credit').commissionReversalCents).toBe(1914);
    expect(refundQuote(helena, 'exchange').commissionReversalCents).toBe(0);
    expect(refundQuote(marina, 'original-payment').commissionReversalCents).toBe(0);
  });

  it('refunds Pix and card in full', () => {
    expect(refundQuote(marina, 'original-payment')).toMatchObject({ amountCents: 23900, refundedNowCents: 23900, installmentsReversed: 0 });
  });
});
