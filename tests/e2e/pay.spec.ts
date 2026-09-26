import { expect, test } from '@playwright/test';

test.describe('Pay', () => {
  test('applications highlights the review-band row and shows the histogram band', async ({ page }) => {
    await page.goto('/mare/ops/pay');
    await expect(page.locator('tr.highlight')).toContainText('AP-77118');
    await expect(page.locator('.py-hist .in-band')).toHaveCount(3);
  });

  test('score contributions add up and the decision above policy needs an override', async ({ page }) => {
    await page.goto('/mare/ops/pay/applications/AP-77118');
    await expect(page.getByRole('heading', { name: 'Why the score is 588' })).toBeVisible();
    await page.getByRole('button', { name: 'Decide' }).click();
    await expect(page.getByRole('alert')).toContainText('Above the review-band policy max');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('dialog', { name: 'Policy override' })).toBeVisible();
    await page.getByLabel('Reason').fill('Fourteen months on time on Loja; recent move explains the address.');
    await page.getByRole('button', { name: 'Send for approval' }).click();
    await expect(page.getByText(/Sent for approval · Renata A./)).toBeVisible();
  });

  test('declined and drift variations are designed', async ({ page }) => {
    await page.goto('/mare/ops/pay?state=declined');
    await expect(page.getByRole('heading', { name: 'About your Maré Pay application' })).toBeVisible();
    await page.goto('/mare/ops/pay?state=drift');
    await expect(page.getByText(/Model drift · PSI 0.27/)).toBeVisible();
  });
});
