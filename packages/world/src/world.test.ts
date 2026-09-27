import { domainEventSchema } from '@portfolio/events';
import { describe, expect, it } from 'vitest';
import { DEFAULT_START, MINUTE, World, clock, dayCurve, eventsForMinute, initialState, parseLocalTime } from './index';

const world = (search = '') => new World(initialState(search, 0));

describe('world clock', () => {
  it('starts at 16:18 Maré time and honours ?t=', () => {
    expect(clock(DEFAULT_START)).toBe('16:18');
    expect(clock(parseLocalTime('16:40')!)).toBe('16:40');
    expect(world('?t=09:05').now(0)).toBe(parseLocalTime('09:05'));
  });

  it('advances at the chosen speed and stops when paused', () => {
    const w = world('?speed=10');
    expect(w.now(1000) - w.now(0)).toBe(10_000);
    expect(world('?live=paused').now(60_000)).toBe(DEFAULT_START);
  });

  it('has a lunch and a bigger evening peak', () => {
    expect(dayCurve(12.6)).toBeGreaterThan(dayCurve(16.3));
    expect(dayCurve(20.2)).toBeGreaterThan(dayCurve(12.6));
    expect(dayCurve(3)).toBeLessThan(0.3);
  });
});

describe('event generation', () => {
  const conditions = { seed: 42, scenario: 'normal' as const, faults: {} };
  const minute = Math.floor(DEFAULT_START / MINUTE);

  it('is deterministic for a seed and different across seeds', () => {
    expect(eventsForMinute(minute, conditions)).toEqual(eventsForMinute(minute, conditions));
    expect(eventsForMinute(minute, { ...conditions, seed: 7 })).not.toEqual(eventsForMinute(minute, conditions));
  });

  it('emits only events that satisfy the Zod domain contracts', () => {
    for (let offset = 0; offset < 30; offset += 1) {
      for (const event of eventsForMinute(minute + offset, conditions)) {
        const parsed = domainEventSchema.safeParse(event);
        expect(parsed.success, `${event.topic} ${JSON.stringify(parsed.error?.issues)}`).toBe(true);
      }
    }
  });

  it('covers every topic within an hour', () => {
    const w = world();
    const seen = new Set(w.between(DEFAULT_START, DEFAULT_START + 60 * MINUTE).map((event) => event.topic));
    expect([...seen].sort()).toEqual(['auth.scored', 'commission.confirmed', 'delivery.updated', 'dispute.opened', 'invoice.issued', 'orders.placed', 'payments.captured', 'returns.created', 'stock.reserved']);
  });

  it('spikes 3.4× on Black Friday', () => {
    const count = (scenario: 'normal' | 'black-friday') => Array.from({ length: 60 }, (_, index) => eventsForMinute(minute + index, { ...conditions, scenario }).filter((event) => event.topic === 'orders.placed').length).reduce((a, b) => a + b, 0);
    const ratio = count('black-friday') / count('normal');
    expect(ratio).toBeGreaterThan(2.9);
    expect(ratio).toBeLessThan(3.9);
  });

  it('turns a carrier outage into delivery exceptions for that carrier only', () => {
    const faults = { 'carrier-outage': [{ since: 0 }] };
    const events = Array.from({ length: 60 }, (_, index) => eventsForMinute(minute + index, { ...conditions, faults })).flat();
    const ligeiro = events.filter((event) => event.topic === 'delivery.updated' && event.payload.carrier === 'Ligeiro Log');
    expect(ligeiro.length).toBeGreaterThan(0);
    expect(ligeiro.every((event) => event.topic === 'delivery.updated' && event.payload.status === 'exception')).toBe(true);
  });

  it('returns the latest events before now in time order', () => {
    const w = world();
    const recent = w.recent(['orders.placed'], 12, undefined, DEFAULT_START);
    expect(recent).toHaveLength(12);
    expect(recent.map((event) => event.at)).toEqual([...recent.map((event) => event.at)].sort());
    expect(Date.parse(recent.at(-1)!.at)).toBeLessThan(DEFAULT_START);
  });

  it('opens and recovers faults at the current sim time', () => {
    const w = world('?live=paused');
    w.setFault('db-pool', true);
    expect(w.isFaulted('db-pool')).toBe(true);
    w.setFault('db-pool', false);
    expect(w.isFaulted('db-pool')).toBe(false);
    expect(w.state.faults['db-pool']).toHaveLength(1);
  });
});
