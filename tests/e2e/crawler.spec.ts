import { expect, test } from '@playwright/test';
import { routeById, routes, systems } from '../../packages/routes/src/index';
import { inspectRoute, watchErrors } from '../support/route-check';

/**
 * The crawler: every manifest route renders its heading with zero console errors, no error
 * boundary and no designed not-found; then every nav item reachable from each system's pages
 * is followed, must render a real screen, and must become the current item where it lands.
 */
for (const route of routes) {
  test(`crawl route · ${route.id}`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(route.href);
    const result = await inspectRoute(page, route.href, errors, route.heading);
    expect(result.problems, route.href).toEqual([]);
  });
}

/** Nav items not yet rebuilt as real screens. Must be empty when M2 closes. */
const pending = new Set<string>([
  '/mare/ops/product-hub/products/510233?tab=pricing',
  '/mare/ops/product-hub/availability',
  '/mare/ops/product-hub/imports',
  '/mare/ops/product-hub/audit',
  '/mare/ops/product-hub/marketplace/onboarding/linho-co?step=mapping',
  '/mare/ops/product-hub?view=imports',
  '/mare/ops/product-hub/products/510233?tab=stock',
  '/mare/ops/product-hub/products/510233?tab=audit',
  '/mare/ops/circle?view=creators',
  '/mare/ops/circle?view=campaigns',
  '/mare/ops/circle?view=payouts',
  '/mare/ops/mesh?view=events',
  '/mare/ops/mesh?view=contracts'
]);

// One page per system (its home) plus each zone's entry points is enough to reach every nav.
const roots = [...new Set([...systems.map((system) => system.home).filter((id): id is string => Boolean(id)), 'home', 'work-index', 'mare-ops-index', 'counter-picking', 'atlas-academy'])];

for (const id of roots) {
  const root = routeById(id)!;
  test(`crawl nav · ${root.id}`, async ({ page }) => {
    await page.goto(root.href);
    await expect(page.locator('.im-footer')).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    const links = await page.evaluate(() => {
      const here = location.pathname + location.search;
      return [...document.querySelectorAll<HTMLElement>('nav')].flatMap((nav) => {
        const stateful = nav.querySelector('[aria-current]') !== null;
        return [...nav.querySelectorAll<HTMLAnchorElement>('a[href]')]
          .map((anchor) => new URL(anchor.href))
          .filter((url) => url.origin === location.origin && url.pathname + url.search !== here)
          .map((url) => ({ href: url.pathname + url.search, stateful, nav: nav.getAttribute('aria-label') ?? 'nav' }));
      });
    });
    const unique = [...new Map(links.map((link) => [link.href, link])).values()];
    const failures: string[] = [];
    for (const link of unique) {
      if (pending.has(link.href)) {
        test.info().annotations.push({ type: 'pending', description: link.href });
        continue;
      }
      const errors = watchErrors(page);
      await page.goto(link.href);
      const result = await inspectRoute(page, link.href, errors);
      if (link.stateful) {
        const current = await page.evaluate((target) => {
          const wanted = new URL(target, location.origin);
          return [...document.querySelectorAll<HTMLAnchorElement>('nav a[aria-current="page"]')].some((anchor) => {
            const url = new URL(anchor.href);
            return url.pathname.replace(/\/$/, '') === wanted.pathname.replace(/\/$/, '');
          });
        }, link.href);
        if (!current) result.problems.push(`"${link.nav}" item is not marked current after navigating to it`);
      }
      if (result.problems.length) failures.push(`${link.href} (from ${root.id} · ${link.nav}): ${result.problems.join('; ')}`);
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
    }
    expect(failures).toEqual([]);
  });
}
