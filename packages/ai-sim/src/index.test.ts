import { describe, expect, it } from 'vitest';
import { SimulatedProvider } from './index';

describe('SimulatedProvider', () => {
  it('returns a stable top-k', async () => {
    const provider = new SimulatedProvider();
    expect(await provider.retrieve('carrier cutoff', 2)).toEqual(await provider.retrieve('carrier cutoff', 2));
  });

  it('streams tokens in order', async () => {
    const tokens: string[] = [];
    for await (const token of new SimulatedProvider().generateStream('the plan')) tokens.push(token);
    expect(tokens.join('')).toContain('the plan');
  });

  it('enforces the eval gate', async () => {
    const provider = new SimulatedProvider();
    expect((await provider.judge('A sufficiently grounded answer.', await provider.retrieve('policy'))).passed).toBe(true);
    expect((await provider.judge('short', [])).passed).toBe(false);
  });
});

