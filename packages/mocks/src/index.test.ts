import { describe, expect, it } from 'vitest';
import { counterOrders, liveOrder, rng, series } from './index';

describe('seeded mocks', () => {
  it('are deterministic across calls', () => {
    expect(counterOrders()).toEqual(counterOrders());
    expect(series(7, 12)).toEqual(series(7, 12));
    expect(rng(1)()).toBe(rng(1)());
  });

  it('keep the artboard ids stable', () => {
    const ids = counterOrders().map((order) => order.id);
    expect(liveOrder(3)).toEqual(liveOrder(3));
    expect(ids).toContain('MR-904117');
    expect(ids).toContain('MR-904112');
  });
});
