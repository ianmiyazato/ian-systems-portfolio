import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';
import { routes } from '../../packages/routes/src/index';

/**
 * JS budgets (gzip): everything a page view downloads until the network is idle, without interaction.
 * Shell pages ≤ 130 kB, each ops remote ≤ 180 kB of its own code, Astro shop pages ≤ 60 kB.
 * Code that only loads on use (palette, lens, HUD, shortcuts, provenance) is correctly excluded. Chart-library pages may be listed as exceptions
 * (docs/agents/budgets.md). Sizes are gzip -9 of the bytes actually loaded, so they don't depend on
 * how the preview servers compress. WRITE_BUDGETS=1 records the table.
 */
const BUDGET = { shell: 130, remote: 180, shop: 60 } as const;
export const exceptions: Record<string, string> = {};
const remotes = ['counter', 'product-hub', 'pay', 'circle', 'mesh'] as const;
const results: Record<string, { kb: number; budget: number | null; group: string }> = {};

async function scripts(page: Page, href: string) {
  const urls = new Set<string>();
  page.on('response', (response) => {
    const url = response.url();
    if (response.request().resourceType() === 'script' || url.endsWith('.js')) urls.add(url);
  });
  await page.goto(href);
  await expect(page.locator('.im-footer')).toBeVisible({ timeout: 20_000 });
  await page.waitForLoadState('networkidle');
  const sizes = await Promise.all([...urls].map(async (url) => {
    const body = await (await page.request.get(url)).body();
    return { url: new URL(url).pathname, kb: gzipSync(body, { level: 9 }).length / 1024 };
  }));
  return sizes;
}

const breakdown = (loaded: Awaited<ReturnType<typeof scripts>>) => loaded
  .toSorted((a, b) => b.kb - a.kb)
  .map((item) => `${item.kb.toFixed(1)} kB ${item.url}`)
  .join('\n');

const shellAndShop = routes.filter((route) => (route.zone === 'shell' || route.zone === 'mare-shop') && route.parity !== false);

test.describe('JS budgets', () => {
  for (const route of shellAndShop) {
    test(`budget · ${route.id}`, async ({ page }) => {
      const loaded = await scripts(page, route.href);
      const kb = loaded.reduce((sum, item) => sum + item.kb, 0);
      const group = route.zone === 'shell' ? 'shell' : 'shop';
      const budget = exceptions[route.id] ? null : BUDGET[group];
      results[route.id] = { kb: Math.round(kb * 10) / 10, budget, group };
      if (budget) expect(kb, `${route.id}: ${kb.toFixed(1)} kB > ${budget} kB\n${breakdown(loaded)}`).toBeLessThanOrEqual(budget);
    });
  }

  for (const remote of remotes) {
    test(`budget · remote ${remote}`, async ({ page }) => {
      const loaded = await scripts(page, `/mare/ops/${remote}`);
      const own = loaded.filter((item) => item.url.startsWith(`/mare/ops/remotes/${remote}/`)).reduce((sum, item) => sum + item.kb, 0);
      const host = loaded.filter((item) => !item.url.startsWith('/mare/ops/remotes/')).reduce((sum, item) => sum + item.kb, 0);
      results[`remote-${remote}`] = { kb: Math.round(own * 10) / 10, budget: BUDGET.remote, group: 'remote' };
      results[`host (with ${remote})`] = { kb: Math.round(host * 10) / 10, budget: null, group: 'host' };
      expect(own, `${remote}: ${own.toFixed(1)} kB > ${BUDGET.remote} kB\n${breakdown(loaded)}`).toBeLessThanOrEqual(BUDGET.remote);
    });
  }

  test.afterAll(() => {
    if (process.env.WRITE_BUDGETS) writeFileSync('docs/agents/js-budgets.json', `${JSON.stringify(results, null, 2)}\n`);
  });
});
