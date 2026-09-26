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

  it('uses a domain corpus and canned grounded answers', async () => {
    const provider = new SimulatedProvider([{ id: 'a', text: 'Seoul chorus lift', score: 0, source: 'market · Seoul' }], { why: 'Because of the chorus.' });
    expect((await provider.retrieve('seoul chorus', 1))[0]?.id).toBe('a');
    const tokens: string[] = [];
    for await (const token of provider.generateStream('why')) tokens.push(token);
    expect(tokens.join('').trim()).toBe('Because of the chorus.');
  });

  it('enforces the eval gate', async () => {
    const provider = new SimulatedProvider();
    expect((await provider.judge('A sufficiently grounded answer.', await provider.retrieve('policy'))).passed).toBe(true);
    expect((await provider.judge('short', [])).passed).toBe(false);
  });
});

