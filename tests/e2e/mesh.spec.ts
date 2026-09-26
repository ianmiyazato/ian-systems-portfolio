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
});
