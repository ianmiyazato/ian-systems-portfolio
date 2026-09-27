import { catalogBySku, seedOf, type CounterOrder } from '@portfolio/mocks';
import { DEFAULT_START, MINUTE, clock, duration, parseLocalTime, type WorldEvent } from '@portfolio/world';

/** Carrier collections at Vila Nova Mall, in Maré local time. */
export const cutoffs = [{ carrier: 'Rota Sul', at: '17:00' }, { carrier: 'Via Norte', at: '18:30' }, { carrier: 'Rota Sul', at: '20:00' }] as const;

export function nextCutoff(now: number) {
  const today = cutoffs.map((cutoff) => ({ ...cutoff, ms: parseLocalTime(cutoff.at, now)! }));
  return today.find((cutoff) => cutoff.ms > now) ?? { ...today[0]!, ms: today[0]!.ms + 86_400_000 };
}

export type Timing = { deadline?: number; since?: number };

/**
 * The v0.1 board was drawn at 16:18 with relative labels ("16 min left", "Waiting · 8 min").
 * Anchoring them to the world's default start turns every label into a live countdown.
 */
export function timingOf(order: CounterOrder): Timing {
  if (order.deadline || order.since) return { deadline: order.deadline, since: order.since };
  const left = order.sla.match(/^(\d+) min left/);
  if (left) return { deadline: DEFAULT_START + Number(left[1]) * MINUTE };
  const cutoff = order.sla.match(/^Cutoff (\d{2}:\d{2})/);
  if (cutoff) return { deadline: parseLocalTime(cutoff[1], DEFAULT_START)! };
  const waiting = order.sla.match(/^Waiting (?:· )?(?:(\d+) h )?(\d+) min/);
  if (waiting) return { since: DEFAULT_START - (Number(waiting[1] ?? 0) * 60 + Number(waiting[2])) * MINUTE };
  return {};
}

/** The line under each card, recomputed every second of sim time. */
export function slaText(order: CounterOrder, now: number): { text: string; urgent: boolean } {
  const { deadline, since } = timingOf(order);
  if (order.lane === 'handed-over' || (!deadline && !since)) return { text: order.sla, urgent: order.urgent };
  if (since !== undefined) {
    const waited = now - since;
    const risk = waited > 90 * MINUTE;
    return { text: `Waiting · ${duration(waited)}${risk ? ' · no-show risk' : ''}`, urgent: risk || order.urgent };
  }
  const left = deadline! - now;
  if (left <= 0) return { text: order.type === 'pickup' ? 'Customer due now' : `Missed ${clock(deadline!)} · next truck`, urgent: true };
  const scanned = order.lane === 'picking' ? ` · ${order.items.filter((item) => item.scanned).length} of ${order.items.length} scanned` : '';
  return order.type === 'pickup'
    ? { text: `${duration(left)} left${scanned}`, urgent: left < 18 * MINUTE }
    : { text: `Cutoff ${clock(deadline!)} · ${duration(left)}${scanned}`, urgent: left < 18 * MINUTE };
}

/** Pickers keep working: an order in the picking lane scans one item every few minutes. */
export function withProgress(order: CounterOrder, now: number, exclude: string): CounterOrder {
  if (order.lane !== 'picking' || order.id === exclude) return order;
  const pace = (3 + (seedOf(order.id) % 3)) * MINUTE;
  const start = DEFAULT_START - (seedOf(order.id) % 4) * MINUTE;
  const done = order.items.filter((item) => item.scanned).length + Math.max(0, Math.floor((now - start) / pace));
  return { ...order, items: order.items.map((item, index) => ({ ...item, scanned: item.scanned || index < done })) };
}

const payments: Record<string, string> = { pix: 'Paid · Pix', card: 'Paid · card', 'pay-credit': 'Paid · Maré Pay Credit', 'pay-store': 'Paid · Maré Pay Store' };

/** About one in four orders for this store is fulfilled from the counter (the rest ship from the DC). */
export const isCounterOrder = (event: Extract<WorldEvent, { topic: 'orders.placed' }>) => event.payload.store === '#0412' && event.payload.channel !== 'store' && seedOf(event.payload.orderId) % 4 === 0;

export function fromWorld(event: Extract<WorldEvent, { topic: 'orders.placed' }>): CounterOrder {
  const placed = Date.parse(event.at);
  const pickup = event.payload.fulfillment === 'pickup';
  const deadline = pickup ? placed + 45 * MINUTE : nextCutoff(placed + 20 * MINUTE).ms;
  return {
    id: event.payload.orderId,
    customer: event.payload.customer,
    type: event.payload.fulfillment,
    lane: 'to-pick',
    items: event.payload.items.map((item) => ({ sku: item.sku, name: item.name, size: item.size, aisle: `${'ABCF'[seedOf(item.sku) % 4]}${(seedOf(item.sku) % 4) + 1}`, swatch: catalogBySku(item.sku)?.swatch ?? 'sand', scanned: false })),
    sla: pickup ? '45 min left' : `Cutoff ${clock(deadline)}`,
    deadline,
    urgent: false,
    total: `R$${(event.payload.totalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    payment: payments[event.payload.payment] ?? 'Paid'
  };
}
