import { describe, expect, it } from 'vitest';
import { areas, parityScreens, resolveScreen, screens } from './routes';

describe('parity registry', () => {
  it('lists exactly the 40 approved artboards', () => {
    expect(parityScreens).toHaveLength(40);
  });

  it('uses unique screen ids and hrefs', () => {
    expect(new Set(screens.map((screen) => screen.id)).size).toBe(screens.length);
    expect(new Set(screens.map((screen) => screen.href)).size).toBe(screens.length);
  });

  it('gives every product area the five required variations', () => {
    for (const area of areas.filter((item) => !['overview', 'mare'].includes(item.id))) {
      expect(area.states, area.id).toEqual(expect.arrayContaining(['empty', 'loading', 'error', 'offline', 'locked']));
    }
  });

  it.each(parityScreens)('$href resolves back to $id', (screen) => {
    const url = new URL(screen.href, 'https://portfolio.invalid');
    expect(resolveScreen(url.pathname, url.search)?.id).toBe(screen.id);
  });

  it('prefers the base screen when an overlay is closed', () => {
    expect(resolveScreen('/mare/ops/balcao', '')?.id).toBe('balcao-lanes');
    expect(resolveScreen('/mare/ops/balcao', '?modal=cutoff-plan&sub=why')?.id).toBe('balcao-cutoff-plan');
    expect(resolveScreen('/mare/ops/product-hub/products/510233', '?tab=pricing')?.id).toBe('product-hub-detail');
  });

  it('resolves dynamic ids to their artboard', () => {
    expect(resolveScreen('/mare/ops/balcao/pick/MR-904120')?.id).toBe('balcao-picking');
    expect(resolveScreen('/mare/ops/mesh/partners/via-norte')?.id).toBe('mesh-partner');
    expect(resolveScreen('/pulse/distribution/')?.id).toBe('pulse-distribution');
  });
});
