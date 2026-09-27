import { describe, expect, it } from 'vitest';
import { matchView, navItems, overlayParams, parityRoutes, remoteViews, resolveScreen, routes, systems } from './index';

describe('routes manifest', () => {
  it('keeps the 40 approved v0.1 artboards', () => {
    expect(parityRoutes.filter((route) => route.release === '0.1')).toHaveLength(40);
  });

  it('uses unique ids and hrefs', () => {
    expect(new Set(routes.map((route) => route.id)).size).toBe(routes.length);
    expect(new Set(routes.map((route) => route.href)).size).toBe(routes.length);
  });

  it('gives every route a heading, board and owner', () => {
    for (const route of routes) {
      expect(route.heading.trim(), route.id).not.toBe('');
      expect(route.board, route.id).toMatch(/^[A-Z0-9]{2,}-[a-z0-9-]+$/i);
      expect(route.owner, route.id).toMatch(/^@portfolio\//);
    }
  });

  it('gives every product system the five required variations', () => {
    for (const system of systems.filter((item) => !['overview', 'mare'].includes(item.id))) {
      expect(system.states, system.id).toEqual(expect.arrayContaining(['empty', 'loading', 'error', 'offline', 'locked']));
    }
  });

  it.each(parityRoutes)('$href resolves back to $id', (route) => {
    const url = new URL(route.href, 'https://portfolio.invalid');
    expect(resolveScreen(url.pathname, url.search)?.id).toBe(route.id);
  });

  it('prefers the base screen when an overlay is closed', () => {
    expect(resolveScreen('/mare/ops/counter', '')?.id).toBe('counter-lanes');
    expect(resolveScreen('/mare/ops/counter', '?modal=cutoff-plan&sub=why')?.id).toBe('counter-cutoff-plan');
    expect(resolveScreen('/mare/ops/product-hub/products/510233', '?tab=pricing')?.id).toBe('product-hub-detail');
  });

  it('resolves dynamic ids to their artboard', () => {
    expect(resolveScreen('/mare/ops/counter/pick/MR-904120')?.id).toBe('counter-picking');
    expect(resolveScreen('/mare/ops/mesh/partners/via-norte')?.id).toBe('mesh-partner');
    expect(resolveScreen('/pulse/distribution/')?.id).toBe('pulse-distribution');
  });

  it('derives overlay params from deep links', () => {
    expect(overlayParams(routes.find((route) => route.id === 'counter-handover')!)).toEqual({ modal: 'handover', sub: 'third-party' });
  });
});

describe('remote views', () => {
  it('uses unique ids and segments per remote', () => {
    for (const views of Object.values(remoteViews)) {
      expect(new Set(views.map((view) => view.id)).size).toBe(views.length);
      expect(new Set(views.map((view) => view.segment)).size).toBe(views.length);
    }
  });

  it('builds nav hrefs as path routes, never ?view=', () => {
    for (const remote of Object.keys(remoteViews) as Array<keyof typeof remoteViews>) {
      for (const item of navItems(remote)) expect(item.href, item.id).not.toMatch(/[?&]view=/);
    }
  });

  it('redirects legacy ?view= links to the path route and keeps other params', () => {
    expect(matchView('pay', [], new URLSearchParams('view=disputes&state=empty'))).toEqual({ kind: 'redirect', href: '/mare/ops/pay/disputes?state=empty' });
  });

  it('matches views by first segment and reports unknown ones', () => {
    expect(matchView('pay', ['applications', 'AP-77118'], new URLSearchParams())).toEqual({ kind: 'view', id: 'application', rest: ['AP-77118'] });
    expect(matchView('pay', [], new URLSearchParams())).toEqual({ kind: 'view', id: 'applications', rest: [] });
    expect(matchView('pay', ['nope'], new URLSearchParams())).toEqual({ kind: 'not-found', segment: 'nope' });
    expect(matchView('pay', [], new URLSearchParams('view=nope'))).toEqual({ kind: 'not-found', segment: 'nope' });
  });
});
