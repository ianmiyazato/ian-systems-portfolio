import { describe, expect, it } from 'vitest';
import { POLICY_MAX_REVIEW, bandFor, factors, scoreOf } from './data';

describe('Pay score explanation', () => {
  it('contributions add up to the displayed score of 588', () => {
    expect(scoreOf(factors)).toBe(588);
  });

  it('puts 588 in the manual review band', () => {
    expect(bandFor(588)).toBe('Review');
    expect(bandFor(620)).toBe('Auto-approve');
    expect(bandFor(559)).toBe('Decline');
  });

  it('keeps the review-band policy maximum below the requested limit', () => {
    expect(POLICY_MAX_REVIEW).toBeLessThan(6000);
  });
});
