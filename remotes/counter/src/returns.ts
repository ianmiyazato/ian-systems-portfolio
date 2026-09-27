import { catalogBySku, creatorRoster, pick, rng, seedOf, type CatalogItem } from '@portfolio/mocks';
import type { WorldEvent } from '@portfolio/world';

export type Reason = 'size' | 'changed-mind' | 'damaged' | 'not-as-pictured' | 'late';
export type Payment = { method: 'pay-credit'; installments: number; paid: number } | { method: 'card' } | { method: 'pix' } | { method: 'pay-store'; installments: number; paid: number };
export type RefundMethod = 'original-payment' | 'store-credit' | 'exchange';

export type ReturnCase = {
  returnId: string;
  orderId: string;
  customer: string;
  channel: 'in-store' | 'courier';
  item: CatalogItem;
  size: string;
  reason: Reason;
  /** Local time the return was opened ("15:42"), or the courier's expected drop-off. */
  time: string;
  arriving?: boolean;
  purchased: string;
  payment: Payment;
  /** Circle creator code used on the original order, if any. */
  code?: string;
  /** Receipt already matched (courier returns carry the order; app receipts scan themselves). */
  receipt: boolean;
  live?: boolean;
};

export const reasonLabel: Record<Reason, string> = {
  size: 'Wrong size',
  'changed-mind': 'Changed mind',
  damaged: 'Arrived damaged',
  'not-as-pictured': 'Not as pictured',
  late: 'Delivered late'
};

const item = (sku: string) => catalogBySku(sku)!;

/** Today's returns at Vila Nova Mall before the world starts adding more. */
export const todaysReturns: ReturnCase[] = [
  { returnId: 'RT-12418', orderId: 'MR-903870', customer: 'Helena', channel: 'in-store', item: item('MR-18511'), size: 'S', reason: 'size', time: '15:42', purchased: 'Sep 12', payment: { method: 'pay-credit', installments: 3, paid: 1 }, code: 'NINA10', receipt: true },
  { returnId: 'RT-12411', orderId: 'MR-903512', customer: 'Caio', channel: 'courier', item: item('MR-18455'), size: '9', reason: 'damaged', time: '17:20', arriving: true, purchased: 'Sep 19', payment: { method: 'card' }, receipt: true },
  { returnId: 'RT-12407', orderId: 'MR-903244', customer: 'Marina', channel: 'in-store', item: item('MR-18285'), size: 'M', reason: 'changed-mind', time: '14:05', purchased: 'Sep 20', payment: { method: 'pix' }, receipt: false },
  { returnId: 'RT-12399', orderId: 'MR-902981', customer: 'Diego', channel: 'courier', item: item('MR-17921'), size: 'One size', reason: 'not-as-pictured', time: '13:10', purchased: 'Sep 8', payment: { method: 'pay-store', installments: 2, paid: 1 }, receipt: true },
  { returnId: 'RT-12391', orderId: 'MR-902760', customer: 'Yasmin', channel: 'in-store', item: item('MR-18401'), size: 'L', reason: 'size', time: '11:32', purchased: 'Sep 15', payment: { method: 'card' }, code: 'MARI15', receipt: false }
];

/** Turn a world `returns.created` event into a case the counter can work. */
export function fromWorld(event: Extract<WorldEvent, { topic: 'returns.created' }>, time: string): ReturnCase {
  const random = rng(seedOf(event.payload.returnId));
  const payment = pick<Payment>(random, [{ method: 'pay-credit', installments: 3, paid: 1 }, { method: 'card' }, { method: 'pix' }, { method: 'card' }]);
  return {
    returnId: event.payload.returnId,
    orderId: event.payload.orderId,
    customer: event.payload.customer,
    channel: event.payload.channel,
    item: catalogBySku(event.payload.sku)!,
    size: event.payload.size,
    reason: event.payload.reason,
    time,
    purchased: pick(random, ['Sep 9', 'Sep 14', 'Sep 18', 'Sep 21']),
    payment,
    code: random() < 0.35 ? pick(random, creatorRoster).code : undefined,
    receipt: event.payload.channel === 'courier',
    live: true
  };
}

export const COMMISSION_RATE = 0.06;
export const STORE_CREDIT_BONUS = 0.1;

export type RefundQuote = {
  method: RefundMethod;
  /** What the customer receives now, in cents. */
  amountCents: number;
  bonusCents: number;
  /** Future Maré Pay installments canceled instead of charged. */
  installmentsReversed: number;
  installmentCents: number;
  /** Already-paid amount returned to the original method, in cents. */
  refundedNowCents: number;
  commissionReversalCents: number;
  lines: string[];
};

const cents = (reais: number) => Math.round(reais * 100);
const money = (value: number) => `R$${(value / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The refund options a return offers. Maré Pay installments are reversed (future ones canceled,
 * paid ones refunded) rather than refunded in full, so the customer never pays for a returned item.
 */
export function refundQuote(item: ReturnCase, method: RefundMethod): RefundQuote {
  const price = cents(item.item.price);
  const commissionReversalCents = item.code && method !== 'exchange' ? Math.round(price * COMMISSION_RATE) : 0;
  if (method === 'store-credit') {
    const bonusCents = Math.round(price * STORE_CREDIT_BONUS);
    return { method, amountCents: price + bonusCents, bonusCents, installmentsReversed: 0, installmentCents: 0, refundedNowCents: 0, commissionReversalCents, lines: [`${money(price)} + ${money(bonusCents)} instant bonus`, 'Usable today in store, site and app'] };
  }
  if (method === 'exchange') {
    return { method, amountCents: 0, bonusCents: 0, installmentsReversed: 0, installmentCents: 0, refundedNowCents: 0, commissionReversalCents: 0, lines: ['Same item, another size or color', 'No money moves; the creator keeps the commission'] };
  }
  if (item.payment.method === 'pay-credit' || item.payment.method === 'pay-store') {
    const { installments, paid } = item.payment;
    const installmentCents = Math.floor(price / installments);
    const refundedNowCents = installmentCents * paid;
    const installmentsReversed = installments - paid;
    return {
      method,
      amountCents: price,
      bonusCents: 0,
      installmentsReversed,
      installmentCents,
      refundedNowCents,
      commissionReversalCents,
      lines: [`Cancels ${installmentsReversed} remaining installment${installmentsReversed === 1 ? '' : 's'} of ${money(installmentCents)}`, `Returns ${money(refundedNowCents)} already paid to ${item.payment.method === 'pay-credit' ? 'Maré Pay Credit' : 'Maré Pay Store'}`]
    };
  }
  return { method, amountCents: price, bonusCents: 0, installmentsReversed: 0, installmentCents: 0, refundedNowCents: price, commissionReversalCents, lines: [`${money(price)} back to ${item.payment.method === 'pix' ? 'the Pix (instant payment) key used' : 'the card used'}`, item.payment.method === 'pix' ? 'Arrives in seconds' : 'Shows on the statement in 2–5 business days'] };
}

export const paymentLabel = (payment: Payment) =>
  payment.method === 'pay-credit' ? `Maré Pay Credit · ${payment.installments}× · ${payment.paid} paid` : payment.method === 'pay-store' ? `Maré Pay Store · ${payment.installments}× · ${payment.paid} paid` : payment.method === 'pix' ? 'Pix' : 'Card';

export { money };
