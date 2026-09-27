import { describe, expect, it } from 'vitest';
import { allPass, forecastLift, guardrails, margin } from './pricing';

const base = { cost: 144.4, basePrice: 249, days: 16, channels: ['site', 'app'], competitorMedian: 231 };

describe('pricing guardrails', () => {
  it('accepts the agent proposal of R$219', () => {
    const result = guardrails({ ...base, price: 219 });
    expect(allPass(result)).toBe(true);
    expect(margin(219, 144.4)).toBeCloseTo(0.341, 3);
  });

  it('rejects a price below the 30% margin floor', () => {
    const result = guardrails({ ...base, price: 199 });
    expect(result.find((item) => item.id === 'margin')?.pass).toBe(false);
    expect(allPass(result)).toBe(false);
  });

  it('enforces marketplace parity only when the marketplace channel is selected', () => {
    expect(guardrails({ ...base, price: 209, channels: ['site'] }).find((item) => item.id === 'parity')?.pass).toBe(true);
    expect(guardrails({ ...base, price: 209, channels: ['site', 'marketplace'] }).find((item) => item.id === 'parity')?.pass).toBe(false);
  });

  it('caps the promotion window', () => {
    expect(guardrails({ ...base, price: 229, days: 45 }).find((item) => item.id === 'window')?.pass).toBe(false);
  });

  it('forecasts more units at a lower price', () => {
    expect(forecastLift(219, 249)).toBeGreaterThan(0.15);
    expect(forecastLift(249, 249)).toBe(0);
  });
});
