import type { DomainEvent, Payload, Topic } from '@portfolio/events/domain';
import { carrierNames, catalog, creatorRoster, firstNames, int, pick, rng, seedOf, stores, type Random } from '@portfolio/mocks';
import { MINUTE, dayCurve, localHour } from './time';

export type FaultId = 'carrier-outage' | 'db-pool' | 'topic-lag' | 'einvoice-fail' | 'traffic-spike';
export type Scenario = 'normal' | 'black-friday';
/** When each fault started and (once recovered) ended, in sim ms. */
export type FaultWindow = { since: number; until?: number };
export type Conditions = { seed: number; scenario: Scenario; faults: Partial<Record<FaultId, FaultWindow[]>> };

export type WorldEvent = DomainEvent;

/** Base events per minute at a day-curve multiplier of 1 (the whole Maré network). */
export const baseRates: Record<Topic, number> = {
  'orders.placed': 9,
  'stock.reserved': 0,
  'payments.captured': 0,
  'invoice.issued': 0,
  'delivery.updated': 5,
  'commission.confirmed': 2.4,
  'dispute.opened': 0.18,
  'auth.scored': 36,
  'returns.created': 0.12,
  // Only people create these (Counter refunds, Circle reversals), through World.record().
  'returns.refunded': 0,
  'commission.reversed': 0,
  'price.changed': 0
};

/** The Ligeiro Log outage is the chaos panel's carrier; Counter's store is #0412. */
export const OUTAGE_CARRIER = 'Ligeiro Log';
export const HOME_STORE = '#0412';

export function faultActive(conditions: Conditions, fault: FaultId, at: number) {
  return (conditions.faults[fault] ?? []).some((window) => at >= window.since && (window.until === undefined || at < window.until));
}

export function rateMultiplier(conditions: Conditions, at: number) {
  const surge = conditions.scenario === 'black-friday' || faultActive(conditions, 'traffic-spike', at) ? 3.4 : 1;
  return dayCurve(localHour(at)) * surge;
}

function gaussian(random: Random) {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

export function poisson(random: Random, lambda: number) {
  if (lambda <= 0) return 0;
  if (lambda > 30) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * gaussian(random)));
  const limit = Math.exp(-lambda);
  let k = 0;
  let product = 1;
  do {
    k += 1;
    product *= random();
  } while (product > limit);
  return k - 1;
}

const iso = (ms: number) => new Date(ms).toISOString();
const deliveryStatuses = ['picked-up', 'in-transit', 'in-transit', 'out-for-delivery', 'delivered', 'delivered'] as const;
const merchants = ['Maré site', 'Maré app', 'Maré Vila Nova Mall', 'Maré Downtown', 'Marketplace · Linho & Co', 'Marketplace · Casa Ribeira'];
const devices = ['iPhone 15 · app', 'Pixel 8 · app', 'Chrome · macOS', 'Safari · iOS', 'Edge · Windows', 'Store POS #0412'];

export const orderIdFor = (minute: number, index: number) => `MR-9${String((minute * 23 + index * 7) % 100000).padStart(5, '0')}`;
export const trackingFor = (orderId: string) => `TRK${String(seedOf(orderId) % 10_000_000).padStart(7, '0')}`;
export const maskAccount = (n: number) => `•••• ${String(n % 10000).padStart(4, '0')}`;

function event<T extends Topic>(topic: T, id: string, at: number, key: string, payload: Payload<T>): WorldEvent {
  return { id, topic, at: iso(at), key, payload } as WorldEvent;
}

/** Every event whose sim minute is `minute` (ms / 60 000), in time order. Deterministic. */
export function eventsForMinute(minute: number, conditions: Conditions): WorldEvent[] {
  const start = minute * MINUTE;
  const out: WorldEvent[] = [];
  const surge = rateMultiplier(conditions, start);
  const lagging = faultActive(conditions, 'db-pool', start);

  for (const topic of Object.keys(baseRates) as Topic[]) {
    const lambda = baseRates[topic] * surge;
    if (!lambda) continue;
    const random = rng(seedOf(`${conditions.seed}:${topic}:${minute}`));
    const n = poisson(random, lambda);
    for (let index = 0; index < n; index += 1) {
      const at = start + Math.floor(random() * MINUTE);
      const id = `${topic.split('.')[0]!.slice(0, 3)}_${minute.toString(36)}_${index}`;
      switch (topic) {
        case 'orders.placed': {
          const orderId = orderIdFor(minute, index);
          const channel = pick(random, ['site', 'site', 'app', 'app', 'app', 'store', 'marketplace'] as const);
          const fulfillment = random() > 0.42 ? 'pickup' : 'delivery';
          const store = random() < 0.34 ? HOME_STORE : pick(random, stores).code;
          const items = Array.from({ length: int(random, 1, 3) }, () => {
            const item = pick(random, catalog);
            return { sku: item.sku, name: item.name, size: pick(random, item.sizes), priceCents: item.price * 100 };
          });
          const totalCents = items.reduce((sum, item) => sum + item.priceCents, 0);
          const payment = pick(random, ['pix', 'card', 'card', 'pay-credit', 'pay-store'] as const);
          out.push(event('orders.placed', id, at, orderId, { orderId, channel, fulfillment, store, customer: pick(random, firstNames), items, totalCents, payment }));
          // Downstream events follow the order through the backbone (outbox → Kafka → consumers).
          items.forEach((item, position) => {
            out.push(event('stock.reserved', `stk_${minute.toString(36)}_${index}_${position}`, at + 800 + position * 300, item.sku, { orderId, sku: item.sku, size: item.size, store, quantity: 1, remaining: int(random, 0, 14) }));
          });
          out.push(event('payments.captured', `pay_${minute.toString(36)}_${index}`, at + int(random, 1800, 4800) * (lagging ? 3 : 1), orderId, { orderId, method: payment, amountCents: totalCents, installments: payment === 'pay-credit' ? pick(random, [3, 6, 10]) : payment === 'card' ? pick(random, [1, 1, 3]) : 1 }));
          const rejected = random() < (faultActive(conditions, 'einvoice-fail', at) ? 0.45 : 0.026);
          out.push(event('invoice.issued', `inv_${minute.toString(36)}_${index}`, at + int(random, 25_000, 55_000), orderId, { orderId, invoice: `NF-e ${38000 + ((minute * 17 + index) % 9000)}`, status: rejected ? 'rejected' : 'authorized', rejectionCode: rejected ? pick(random, ['778', '539', '225']) : undefined, ncm: pick(random, ['6205.30.00', '6204.44.00', '4202.22.10', '6403.99.90']) }));
          if (fulfillment === 'delivery') {
            const carrier = pick(random, carrierNames);
            const down = carrier === OUTAGE_CARRIER && faultActive(conditions, 'carrier-outage', at);
            out.push(event('delivery.updated', `dlv_${minute.toString(36)}_${index}_l`, at + int(random, 110_000, 170_000), orderId, { orderId, carrier, status: down ? 'exception' : 'label-created', etaMinutes: int(random, 90, 300), trackingNumber: trackingFor(orderId) }));
          }
          break;
        }
        case 'delivery.updated': {
          const orderId = orderIdFor(minute - int(random, 30, 600), index);
          const carrier = pick(random, carrierNames);
          const down = carrier === OUTAGE_CARRIER && faultActive(conditions, 'carrier-outage', at);
          const status = down ? 'exception' : pick(random, deliveryStatuses);
          out.push(event('delivery.updated', id, at, orderId, { orderId, carrier, status, etaMinutes: status === 'delivered' ? 0 : int(random, 8, 180), trackingNumber: trackingFor(orderId) }));
          break;
        }
        case 'commission.confirmed': {
          const creator = pick(random, creatorRoster);
          const orderId = orderIdFor(minute - 43_200, index);
          out.push(event('commission.confirmed', id, at, creator.code, { creator: creator.name, code: creator.code, orderId, amountCents: int(random, 900, 4800), reversed: random() < 0.06 }));
          break;
        }
        case 'dispute.opened': {
          const disputeId = `DP-${String(40000 + ((minute * 3 + index) % 60000))}`;
          out.push(event('dispute.opened', id, at, disputeId, { disputeId, account: maskAccount(int(random, 1000, 9999)), amountCents: int(random, 89, 1890) * 100, reason: pick(random, ['not-received', 'not-received', 'fraud', 'duplicate', 'not-as-described'] as const), network: pick(random, ['Maré Pay Credit', 'Maré Pay Store', 'Card network']), dueDays: int(random, 2, 20) }));
          break;
        }
        case 'auth.scored': {
          const score = Math.min(999, Math.max(0, Math.round(640 + gaussian(random) * 120)));
          const action = score < 380 ? 'blocked' : score < 470 ? 'step-up' : score < 510 ? 'held' : 'approved';
          const latency = Math.round((38 + random() * 60) * (lagging ? 4.2 : 1));
          out.push(event('auth.scored', id, at, `auth_${minute.toString(36)}_${index}`, { authId: `AU-${(minute * 41 + index).toString(36).toUpperCase().slice(-7)}`, account: maskAccount(int(random, 1000, 9999)), merchant: pick(random, merchants), amountCents: int(random, 49, 2400) * 100, score, action, latencyMs: latency, device: pick(random, devices) }));
          break;
        }
        case 'returns.created': {
          const item = pick(random, catalog);
          const returnId = `RT-${String(12000 + ((minute * 5 + index) % 80000))}`;
          out.push(event('returns.created', id, at, returnId, { returnId, orderId: orderIdFor(minute - int(random, 1440, 20_000), index), store: random() < 0.55 ? HOME_STORE : pick(random, stores).code, channel: random() < 0.6 ? 'in-store' : 'courier', sku: item.sku, name: item.name, size: pick(random, item.sizes), reason: pick(random, ['size', 'size', 'changed-mind', 'damaged', 'not-as-pictured', 'late'] as const), amountCents: item.price * 100, customer: pick(random, firstNames) }));
          break;
        }
        default:
          break;
      }
    }
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}
