import { expect, test } from '@playwright/test';

test.describe('Circle', () => {
  test('program dashboard flags the MARI15 leak', async ({ page }) => {
    await page.goto('/mare/ops/circle');
    await expect(page.locator('.cc-card')).toHaveCount(4);
    await page.getByRole('button', { name: 'Investigate', exact: true }).click();
    await expect(page).toHaveURL(/modal=leak&code=MARI15/);
    await page.getByRole('button', { name: 'Cap and rotate code' }).click();
    await page.getByRole('button', { name: 'Send and rotate' }).click();
    await expect(page.getByText(/MARI15-SOL is live/)).toBeVisible();
  });

  test('rule builder receipt recalculates with the rate', async ({ page }) => {
    await page.goto('/mare/ops/circle/rules/summer-swim');
    await expect(page.locator('.cc-receipt footer strong')).toHaveText('R$ 60,74');
    await page.getByLabel('Commission rate').fill('12');
    await expect(page.locator('.cc-receipt footer strong')).toHaveText('R$ 69,90');
  });

  test('no-sales and payout-failed variations', async ({ page }) => {
    await page.goto('/mare/ops/circle?state=empty');
    await expect(page.getByText(/no sales yet/)).toBeVisible();
    await page.goto('/mare/ops/circle?state=payout-failed');
    await expect(page.getByRole('button', { name: 'Retry payout' })).toBeVisible();
  });
});
