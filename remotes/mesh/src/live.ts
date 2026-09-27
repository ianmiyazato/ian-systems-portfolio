import { MINUTE, clock, type World, type WorldEvent } from '@portfolio/world';
import type { LogLine } from './data';

/** The browser world is a sample of real traffic: one simulated event stands for this many. */
export const SAMPLE = 1_500;

/** A structured log line from a world event (only the lines an integrations engineer cares about). */
export function logLine(event: WorldEvent): LogLine | null {
  const t = clock(Date.parse(event.at), true);
  switch (event.topic) {
    case 'delivery.updated': {
      const source = event.payload.carrier.toLowerCase().replace(/ /g, '-');
      if (event.payload.status === 'exception') return { t, level: 'error', source, text: `${event.payload.orderId} exception · circuit counts it · → dlq` };
      if (event.payload.status === 'label-created') return { t, level: 'info', source, text: `label created ${event.payload.orderId} · ${event.payload.trackingNumber}` };
      return { t, level: 'info', source, text: `${event.payload.status} ${event.payload.orderId} · webhook ${90 + (event.payload.etaMinutes % 120)}ms` };
    }
    case 'invoice.issued':
      return event.payload.status === 'rejected'
        ? { t, level: 'error', source: 'einvoice', text: `${event.payload.invoice} rejected · code ${event.payload.rejectionCode} · ncm ${event.payload.ncm}` }
        : null;
    case 'orders.placed':
      return { t, level: 'info', source: 'bus', text: `orders.placed ${event.payload.orderId} · outbox → kafka · partition ${event.payload.orderId.charCodeAt(event.payload.orderId.length - 1) % 12}` };
    case 'returns.refunded':
      return { t, level: 'warn', source: 'counter', text: `returns.refunded ${event.payload.returnId} · by a person · commission reversal fan-out` };
    default:
      return null;
  }
}

export type Circuit = 'closed' | 'half-open' | 'open';

/**
 * Ligeiro Log's circuit follows its recent failures: open during an outage (chaos), half-open
 * while it recovers (probes), closed once the last five minutes are clean.
 */
export function circuitFor(partner: string, world: World, now: number): Circuit {
  if (partner !== 'ligeiro-log') return 'closed';
  if (world.isFaulted('carrier-outage', now)) return 'open';
  const recent = world.between(now - 5 * MINUTE, now, ['delivery.updated']).filter((event) => event.topic === 'delivery.updated' && event.payload.carrier === 'Ligeiro Log' && event.payload.status === 'exception').length;
  const recovering = (world.state.faults['carrier-outage'] ?? []).some((window) => window.until !== undefined && now - window.until < 4 * MINUTE);
  // Without chaos, the v0.1 story stands: ligeiro keeps flapping on unknown status X9 codes.
  return recent > 0 || recovering || Math.floor(now / (7 * MINUTE)) % 3 !== 2 ? 'half-open' : 'closed';
}

/** DLQ depth: failures parked in the last 20 minutes, minus what replays drained. */
export function dlqDepth(world: World, now: number, replayed = 0) {
  const parked = world.between(now - 20 * MINUTE, now, ['delivery.updated', 'invoice.issued']).filter((event) => (event.topic === 'delivery.updated' && event.payload.status === 'exception') || (event.topic === 'invoice.issued' && event.payload.status === 'rejected')).length;
  return Math.max(0, 14 + parked * 2 - replayed);
}

/** Sampled events in the last minute, scaled back up to the real rate. */
export function throughput(world: World, now: number) {
  return (world.between(now - MINUTE, now).length * SAMPLE) / 60;
}

export const perSecond = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k/s` : `${Math.round(value)}/s`);
