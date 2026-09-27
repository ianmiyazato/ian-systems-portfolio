import { expect, test } from '@playwright/test';

test.describe('Mesh', () => {
  test('topology streams the log and shows the degraded edge', async ({ page }) => {
    await page.goto('/mare/ops/mesh');
    await expect(page.locator('.ms-graph .edge.warn')).toHaveCount(2);
    const before = await page.locator('.ms-log li').count();
    await expect.poll(async () => page.locator('.ms-log li').count(), { timeout: 8000 }).toBeGreaterThan(before);
  });

  test('breaking the carrier shows an open circuit', async ({ page }) => {
    await page.goto('/mare/ops/mesh?state=down');
    await expect(page.getByText(/circuit open since 16:11/)).toBeVisible();
    await expect(page.locator('.ms-graph .node.down')).toHaveCount(1);
  });

  test('dlq replay with transform empties the queue', async ({ page }) => {
    await page.goto('/mare/ops/mesh/dlq?modal=replay&sub=transform');
    await expect(page.getByText('valid against canonical.tracking.v3')).toBeVisible();
    await page.getByRole('button', { name: 'replay 2 with transform' }).click();
    await expect(page.getByText(/replayed 17 · 2 with transform · 1 skipped/)).toBeVisible();
  });

  test('deploying the X9 mapping fixes the failing row', async ({ page }) => {
    await page.goto('/mare/ops/mesh/partners/ligeiro-log');
    await expect(page.locator('.ms-table tr.fail')).toHaveCount(1);
    await page.getByRole('button', { name: 'deploy mapping' }).click();
    await expect(page.locator('.ms-table tr.fail')).toHaveCount(0);
  });

  test('events and contracts are real views; legacy ?view= links redirect', async ({ page }) => {
    for (const [slug, heading] of [['events', 'event stream'], ['contracts', 'contracts']]) {
      await page.goto(`/mare/ops/mesh?view=${slug}`);
      await expect(page).toHaveURL(new RegExp(`/mare/ops/mesh/${slug}$`));
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });

  test('contracts: the proposed delivery.updated v3 is blocked and names the consumers it breaks', async ({ page }) => {
    await page.goto('/mare/ops/mesh/contracts');
    await expect(page.locator('[data-anchor="ms-ci-verdict"]')).toContainText('blocked by ci');
    const consumers = page.locator('[data-anchor="ms-consumers"]');
    for (const name of ['counter', 'notifications', 'shop-tracking']) await expect(consumers.locator('li.breaks', { hasText: name })).toBeVisible();
    await page.getByRole('button', { name: 'draft the three prs' }).click();
    const modal = page.getByRole('dialog', { name: 'expand, migrate, contract' });
    await expect(modal.locator('.ms-check.pass', { hasText: '✓ backward' })).toBeVisible();
    await expect(modal.locator('.ms-check.pass', { hasText: '✓ full' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'orders.placed' }).click();
    await expect(page.locator('[data-anchor="ms-ci-verdict"]')).toContainText('compatible under full');
  });

  test('events: a refund recorded at the Counter is findable by its return id', async ({ context }) => {
    const counter = await context.newPage();
    await counter.goto('/mare/ops/counter/returns?return=RT-12418');
    for (const name of ['Tags attached', 'No damage beyond the reason given', 'Original packaging or bag']) await counter.getByRole('button', { name }).click();
    await counter.getByRole('button', { name: 'Refund R$350.90' }).click();
    await counter.getByRole('link', { name: 'View event in Mesh' }).click();
    await expect(counter).toHaveURL(/\/mare\/ops\/mesh\/events\?key=RT-12418/);
    const row = counter.locator('tr.action', { hasText: 'returns.refunded' });
    await expect(row).toContainText('recorded by a person');
    await row.getByRole('button', { name: 'RT-12418' }).click();
    await expect(counter.locator('[data-anchor="ms-event-drawer"] .ms-json')).toContainText('"method": "store-credit"');
  });
});

