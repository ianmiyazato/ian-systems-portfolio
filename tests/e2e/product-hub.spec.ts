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
});
