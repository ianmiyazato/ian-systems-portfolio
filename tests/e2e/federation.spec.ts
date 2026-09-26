import { expect, test } from '@playwright/test';

const remotes = ['balcao', 'product-hub', 'pay', 'circle', 'mesh'];

test('Maré Ops loads five remotes at runtime from their manifests', async ({ page }) => {
  const manifests: string[] = [];
  page.on('response', (response) => {
    if (response.url().endsWith('/mf-manifest.json')) manifests.push(response.url());
  });
  await page.goto('/mare/ops/');
  await expect(page.locator('.remote-grid [data-remote-status="ready"]')).toHaveCount(5);
  for (const remote of remotes) expect(manifests.some((url) => url.includes(`/remotes/${remote}/`))).toBe(true);
});

for (const blocked of remotes) {
  test(`blocking the ${blocked} manifest leaves the other four working`, async ({ page }) => {
    await page.route(`**/remotes/${blocked}/mf-manifest.json`, (route) => route.abort('failed'));
    await page.goto('/mare/ops/');
    await expect(page.locator('.remote-grid [data-remote-status="ready"]')).toHaveCount(4);
    const fallback = page.locator(`.remote-fallback[data-remote="${blocked}"]`);
    await expect(fallback).toBeVisible();
    await expect(fallback.getByRole('button', { name: /Retry/ })).toBeVisible();
    await expect(page.locator('.im-footer')).toContainText('All names are fictitious');
  });
}

test('a failed remote page shows the designed fallback and recovers on retry', async ({ page }) => {
  let block = true;
  await page.route('**/remotes/pay/mf-manifest.json', (route) => (block ? route.abort('failed') : route.continue()));
  await page.goto('/mare/ops/pay');
  await expect(page.locator('.remote-fallback[data-remote="pay"]')).toBeVisible();
  await expect(page.locator('.host-switcher')).toBeVisible();
  block = false;
  await page.getByRole('button', { name: 'Retry Pay' }).click();
  await expect(page.locator('[data-remote="pay"][data-remote-status="ready"]')).toBeVisible();
});
