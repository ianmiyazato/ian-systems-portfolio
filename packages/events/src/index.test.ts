import { describe, expect, it } from 'vitest';
import { eventSchema } from './index';

describe('event schema', () => {
  it('accepts a valid order event', () => {
    expect(eventSchema.safeParse({ type: 'order.created', id: 'OR-1042', channel: 'pickup', occurredAt: '2026-09-26T12:00:00.000Z' }).success).toBe(true);
  });

  it('rejects an invalid market', () => {
    expect(eventSchema.safeParse({ type: 'campaign.moment', market: 'Paris', score: 2, occurredAt: 'bad' }).success).toBe(false);
  });
});

