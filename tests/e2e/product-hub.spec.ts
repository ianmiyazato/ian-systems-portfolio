import { expect, test } from '@playwright/test';

test.describe('Product Hub', () => {
  test('catalog shows facets, KPIs, the dense table and the bulk bar', async ({ page }) => {
    await page.goto('/mare/ops/product-hub');
    await expect(page.getByRole('heading', { name: 'Summer · needs action' })).toBeVisible();
    await expect(page.locator('.ph-table tbody tr')).toHaveCount(14);
    await expect(page.getByRole('region', { name: 'Bulk actions' })).toContainText('3 selected');
  });

  test('agent run reveals five tool calls, then editing below the floor blocks approval', async ({ page }) => {
    await page.goto('/mare/ops/product-hub/products/510233?modal=agent-run&sub=edit');
    await expect(page.locator('.ph-steps li.done')).toHaveCount(5);
    const price = page.getByLabel('New price (R$)');
    await price.fill('199');
    await expect(page.getByRole('button', { name: 'Save and approve' })).toBeDisabled();
    await price.fill('219');
    await page.getByRole('button', { name: 'Save and approve' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(/Price change approved/)).toBeVisible();
  });

  test('seller onboarding flags low-confidence mappings for review', async ({ page }) => {
    await page.goto('/mare/ops/product-hub/marketplace/onboarding/linho-co?step=mapping');
    await expect(page.locator('.ph-mapping tr.needs-review')).toHaveCount(2);
    await page.locator('.ph-mapping tr.needs-review').first().getByRole('button', { name: 'Review' }).click();
    await expect(page.locator('.ph-mapping tr.needs-review')).toHaveCount(1);
  });

  test('zero-results and rejected variations explain what happened', async ({ page }) => {
    await page.goto('/mare/ops/product-hub?state=empty');
    await expect(page.getByText('No products match Summer · Marketplace · Shoes')).toBeVisible();
    await page.goto('/mare/ops/product-hub?state=rejected');
    await expect(page.getByText(/below the 30% floor/)).toBeVisible();
  });

  test('every nav item is a real view; product tabs show their own sections', async ({ page }) => {
    await page.goto('/mare/ops/product-hub?view=imports');
    await expect(page).toHaveURL(/\/mare\/ops\/product-hub\/imports$/);
    for (const [slug, heading] of [['availability', 'Availability'], ['imports', 'Imports'], ['audit', 'Audit']]) {
      await page.goto(`/mare/ops/product-hub/${slug}`);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.locator('.ph-nav [aria-current="page"]')).toHaveText(heading);
    }
    await page.goto('/mare/ops/product-hub/products/510233?tab=content');
    await expect(page.locator('[data-anchor="ph-content"]')).toContainText('Content · 86% complete');
    await expect(page.locator('[data-anchor="ph-chart"]')).toHaveCount(0);
  });

  test('availability: a rebalance applies optimistically and can be undone', async ({ page }) => {
    await page.goto('/mare/ops/product-hub/availability?live=paused');
    const app = page.locator('tr', { hasText: 'MR-18511' }).locator('td').nth(2);
    await expect(app).toContainText('5');
    await page.getByRole('button', { name: 'Review the move' }).click();
    await page.getByRole('dialog', { name: 'Rebalance allocation' }).getByRole('button', { name: 'Move 6 units' }).click();
    await expect(app).toContainText('11');
    await page.locator('[data-anchor="ph-undo-toast"]').getByRole('button', { name: 'Undo' }).click();
    await expect(app).toContainText('5');
  });

  test('imports: the error drawer suggests fixes row by row', async ({ page }) => {
    await page.goto('/mare/ops/product-hub/imports?state=failed');
    await expect(page.locator('[data-anchor="ph-import-failed"]')).toBeVisible();
    await page.getByRole('button', { name: 'Review fixes' }).click();
    const drawer = page.locator('[data-anchor="ph-import-drawer"]');
    await drawer.getByRole('button', { name: 'Sand' }).first().click();
    await expect(drawer.locator('tr.accepted')).toHaveCount(1);
  });

  test('approving a price writes an audit entry with how it was made', async ({ context }) => {
    const audit = await context.newPage();
    await audit.goto('/mare/ops/product-hub/audit');
    const product = await context.newPage();
    await product.goto('/mare/ops/product-hub/products/510233?modal=agent-run');
    await product.getByRole('button', { name: 'Approve R$219' }).click();
    const entry = audit.locator('tr', { hasText: 'Today' });
    await expect(entry).toContainText('Natural linen shirt R$249 → R$219');
    await entry.getByRole('button', { name: 'How this was made' }).click();
    await expect(audit.locator('[data-anchor="ph-provenance"]')).toContainText('ft-pricing-v2');
  });
});

