import { expect, test } from '@playwright/test';

test.describe('Balcão', () => {
  test('order lanes render the approved board', async ({ page }) => {
    await page.goto('/mare/ops/balcao');
    await expect(page.getByRole('heading', { name: '59 open orders' })).toBeVisible();
    for (const lane of ['To pick', 'Picking', 'Ready', 'Handed over']) await expect(page.getByRole('heading', { name: lane, exact: true })).toBeVisible();
    await expect(page.getByText('Carrier 17:00 · 42 min')).toBeVisible();
    await expect(page.locator('.bc-ai-strip')).toContainText('Simulated AI');
  });

  test('scanning the last item plays the success variation', async ({ page }) => {
    await page.goto('/mare/ops/balcao/pick/MR-904117');
    await expect(page.locator('.bc-ring')).toContainText('2/3');
    await page.getByRole('button', { name: 'Simulate scan', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'All 3 items picked' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print label' })).toBeVisible();
  });

  test('cutoff plan deep link opens sheet + why drawer, and Esc closes only the top layer', async ({ page }) => {
    await page.goto('/mare/ops/balcao?modal=cutoff-plan&sub=why');
    await expect(page.getByRole('dialog')).toHaveCount(2);
    await expect(page.getByRole('dialog', { name: 'Why this plan' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expect(page).toHaveURL(/modal=cutoff-plan(?!.*sub=)/);
    await page.getByRole('button', { name: 'Apply plan' }).click();
    await expect(page.locator('[data-lane="picking"] [data-order="MR-904121"]')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Plan applied' })).toBeVisible();
  });

  test('third-party handover moves the order to handed over', async ({ page }) => {
    await page.goto('/mare/ops/balcao?modal=handover&order=MR-904112&sub=third-party');
    await expect(page.getByText('Matches')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm and hand over' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-lane="handed-over"] [data-order="MR-904112"]')).toBeVisible();
  });

  test('offline, empty and reminder variations are designed states', async ({ page }) => {
    await page.goto('/mare/ops/balcao?state=offline');
    await expect(page.getByText('Offline · 3 actions queued, will sync')).toBeVisible();
    await page.goto('/mare/ops/balcao?state=empty');
    await expect(page.getByText('Nothing to pick')).toBeVisible();
    await page.goto('/mare/ops/balcao?state=reminder-sent');
    await expect(page.getByText(/No-show reminder sent to Caio/)).toBeVisible();
  });

  test('a new order appears live in two tabs at once', async ({ context }) => {
    const [first, second] = [await context.newPage(), await context.newPage()];
    await Promise.all([first.goto('/mare/ops/balcao'), second.goto('/mare/ops/balcao')]);
    await Promise.all([expect(first.locator('.bc-live')).toBeVisible(), expect(second.locator('.bc-live')).toBeVisible()]);
    await first.getByRole('button', { name: 'Simulate order' }).click();
    await Promise.all([
      expect(first.locator('[data-lane="to-pick"] .bc-card.is-fresh')).toHaveCount(1),
      expect(second.locator('[data-lane="to-pick"] .bc-card.is-fresh')).toHaveCount(1)
    ]);
    const id = await first.locator('[data-lane="to-pick"] .bc-card.is-fresh').getAttribute('data-order');
    await expect(second.locator(`[data-order="${id}"]`)).toBeVisible();
  });
});
