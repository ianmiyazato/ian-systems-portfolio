import { z } from 'zod';

/**
 * Canonical domain events. `packages/world` generates exactly these shapes in the browser, the
 * contract checker (M9) versions them, and every screen reads them. Money is BRL in cents.
 */
const base = { id: z.string(), at: z.string().datetime(), key: z.string() };
const cents = z.number().int().nonnegative();
const store = z.string().regex(/^#\d{4}$/);

export const orderItem = z.object({ sku: z.string(), name: z.string(), size: z.string(), priceCents: cents });

export const domainEvents = {
  'orders.placed': z.object({
    ...base,
    topic: z.literal('orders.placed'),
    payload: z.object({
      orderId: z.string(),
      channel: z.enum(['site', 'app', 'store', 'marketplace']),
      fulfillment: z.enum(['pickup', 'delivery']),
      store,
      customer: z.string(),
      items: z.array(orderItem).min(1),
      totalCents: cents,
      payment: z.enum(['pix', 'card', 'pay-credit', 'pay-store'])
    })
  }),
  'stock.reserved': z.object({
    ...base,
    topic: z.literal('stock.reserved'),
    payload: z.object({ orderId: z.string(), sku: z.string(), size: z.string(), store, quantity: z.number().int().positive(), remaining: z.number().int().nonnegative() })
  }),
  'payments.captured': z.object({
    ...base,
    topic: z.literal('payments.captured'),
    payload: z.object({ orderId: z.string(), method: z.enum(['pix', 'card', 'pay-credit', 'pay-store']), amountCents: cents, installments: z.number().int().min(1).max(12) })
  }),
  'delivery.updated': z.object({
    ...base,
    topic: z.literal('delivery.updated'),
    payload: z.object({
      orderId: z.string(),
      carrier: z.string(),
      status: z.enum(['label-created', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered', 'exception']),
      etaMinutes: z.number().int().nonnegative(),
      trackingNumber: z.string()
    })
  }),
  'commission.confirmed': z.object({
    ...base,
    topic: z.literal('commission.confirmed'),
    payload: z.object({ creator: z.string(), code: z.string(), orderId: z.string(), amountCents: cents, reversed: z.boolean() })
  }),
  'invoice.issued': z.object({
    ...base,
    topic: z.literal('invoice.issued'),
    payload: z.object({ orderId: z.string(), invoice: z.string(), status: z.enum(['authorized', 'rejected']), rejectionCode: z.string().optional(), ncm: z.string() })
  }),
  'dispute.opened': z.object({
    ...base,
    topic: z.literal('dispute.opened'),
    payload: z.object({ disputeId: z.string(), account: z.string(), amountCents: cents, reason: z.enum(['not-received', 'fraud', 'duplicate', 'not-as-described']), network: z.string(), dueDays: z.number().int().positive() })
  }),
  'auth.scored': z.object({
    ...base,
    topic: z.literal('auth.scored'),
    payload: z.object({
      authId: z.string(),
      account: z.string(),
      merchant: z.string(),
      amountCents: cents,
      score: z.number().int().min(0).max(999),
      action: z.enum(['approved', 'step-up', 'blocked', 'held']),
      latencyMs: z.number().int().positive(),
      device: z.string()
    })
  }),
  'returns.created': z.object({
    ...base,
    topic: z.literal('returns.created'),
    payload: z.object({ returnId: z.string(), orderId: z.string(), store, channel: z.enum(['in-store', 'courier']), sku: z.string(), name: z.string(), size: z.string(), reason: z.enum(['size', 'changed-mind', 'damaged', 'not-as-pictured', 'late']), amountCents: cents, customer: z.string() })
  }),
  'returns.refunded': z.object({
    ...base,
    topic: z.literal('returns.refunded'),
    payload: z.object({ returnId: z.string(), orderId: z.string(), store, method: z.enum(['original-payment', 'store-credit', 'exchange']), amountCents: cents, bonusCents: cents, installmentsReversed: z.number().int().nonnegative(), staff: z.string() })
  }),
  'price.changed': z.object({
    ...base,
    topic: z.literal('price.changed'),
    payload: z.object({ sku: z.string(), name: z.string(), fromCents: cents, toCents: cents, channels: z.array(z.enum(['site', 'app', 'marketplace'])).min(1), source: z.enum(['agent', 'human']), model: z.string().optional(), approvedBy: z.string(), reason: z.string(), untilDays: z.number().int().positive() })
  }),
  'commission.reversed': z.object({
    ...base,
    topic: z.literal('commission.reversed'),
    payload: z.object({ code: z.string(), creator: z.string(), orderId: z.string(), amountCents: cents, reason: z.enum(['return', 'fraud', 'leak']) })
  })
} as const;

export type Topic = keyof typeof domainEvents;
export const topics = Object.keys(domainEvents) as Topic[];
export type DomainEvent<T extends Topic = Topic> = T extends Topic ? z.infer<(typeof domainEvents)[T]> : never;
export type Payload<T extends Topic> = DomainEvent<T>['payload'];

export const domainEventSchema = z.discriminatedUnion('topic', [
  domainEvents['orders.placed'],
  domainEvents['stock.reserved'],
  domainEvents['payments.captured'],
  domainEvents['delivery.updated'],
  domainEvents['commission.confirmed'],
  domainEvents['invoice.issued'],
  domainEvents['dispute.opened'],
  domainEvents['auth.scored'],
  domainEvents['returns.created'],
  domainEvents['returns.refunded'],
  domainEvents['commission.reversed'],
  domainEvents['price.changed']
]);
