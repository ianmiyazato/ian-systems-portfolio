import { describe, expect, it } from 'vitest';
import { CANONICAL_TRACE, DEFAULT_START, MINUTE, SLOW_SPAN, World, checkoutSeries, findTrace, initialState, problems, traceIdOf } from './index';

const world = (search = '') => new World(initialState(search, 0));

describe('telemetry', () => {
  it('opens mid-incident: deploy #812 saturated the Orders pool at 16:02', () => {
    const open = problems(world(), DEFAULT_START);
    expect(open[0]).toMatchObject({ id: 'P-812', fault: 'db-pool' });
    expect(open[0]!.endedAt).toBeUndefined();
    expect(problems(world('?fault=none'), DEFAULT_START)).toEqual([]);
  });

  it('the canonical trace spends most of its time waiting for a connection', () => {
    const trace = findTrace(world(), CANONICAL_TRACE)!;
    const wait = trace.spans.find((span) => span.name === SLOW_SPAN)!;
    expect(wait.duration / trace.duration).toBeGreaterThan(0.6);
    expect(wait.attributes['db.pool.max']).toBe(32);
    expect(trace.spans.every((span) => span.parentId === undefined || trace.spans.some((parent) => parent.spanId === span.parentId))).toBe(true);
  });

  it('latency recovers after the fix and the deploy marker sits before the spike', () => {
    const w = world('?live=paused');
    const before = checkoutSeries(w, DEFAULT_START, 20);
    expect(before.at(-1)!.p95).toBeGreaterThan(700);
    expect(before[0]!.p95).toBeLessThan(250);
    w.setFault('db-pool', false);
    const after = checkoutSeries(w, DEFAULT_START + 5 * MINUTE, 3);
    expect(after.at(-1)!.p95).toBeLessThan(250);
    expect(problems(w, DEFAULT_START + 5 * MINUTE)[0]!.endedAt).toBeDefined();
  });

  it('actions people take have findable traces', () => {
    const w = world('?live=paused');
    const event = w.record({ topic: 'action.performed', key: 'plan', payload: { system: 'counter', action: 'apply cutoff plan', summary: '3 orders re-routed', actor: 'Ana' } });
    const trace = findTrace(w, traceIdOf(event.id))!;
    expect(trace.name).toContain('apply cutoff plan');
    expect(trace.spans.some((span) => span.kind === 'producer')).toBe(true);
  });
});
