import { expect, test } from '@playwright/test';

test.describe('Counter', () => {
  test('old Balcão links redirect permanently and keep their overlay params', async ({ page }) => {
    const response = await page.request.get('/mare/ops/balcao?modal=cutoff-plan&sub=why', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe('/mare/ops/counter?modal=cutoff-plan&sub=why');
    await page.goto('/mare/ops/balcao/pick/MR-904117');
    await expect(page).toHaveURL(/\/mare\/ops\/counter\/pick\/MR-904117$/);
    await expect(page.getByRole('link', { name: 'counter', exact: true })).toBeVisible();
  });

  test('order lanes render the approved board', async ({ page }) => {
    await page.goto('/mare/ops/counter');
    await expect(page.getByRole('heading', { name: '59 open orders' })).toBeVisible();
    for (const lane of ['To pick', 'Picking', 'Ready', 'Handed over']) await expect(page.getByRole('heading', { name: lane, exact: true })).toBeVisible();
    await expect(page.getByText('Carrier 17:00 · 42 min')).toBeVisible();
    await expect(page.locator('.ct-ai-strip')).toContainText('Simulated AI');
  });

  test('scanning the last item plays the success variation', async ({ page }) => {
    await page.goto('/mare/ops/counter/pick/MR-904117');
    await expect(page.locator('.ct-ring')).toContainText('2/3');
    await page.getByRole('button', { name: 'Simulate scan', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'All 3 items picked' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print label' })).toBeVisible();
  });

  test('cutoff plan deep link opens sheet + why drawer, and Esc closes only the top layer', async ({ page }) => {
    await page.goto('/mare/ops/counter?modal=cutoff-plan&sub=why');
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
    await page.goto('/mare/ops/counter?modal=handover&order=MR-904112&sub=third-party');
    await expect(page.getByText('Matches')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm and hand over' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-lane="handed-over"] [data-order="MR-904112"]')).toBeVisible();
  });

  test('offline, empty and reminder variations are designed states', async ({ page }) => {
    await page.goto('/mare/ops/counter?state=offline');
    await expect(page.getByText('Offline · 3 actions queued, will sync')).toBeVisible();
    await page.goto('/mare/ops/counter?state=empty');
    await expect(page.getByText('Nothing to pick')).toBeVisible();
    await page.goto('/mare/ops/counter?state=reminder-sent');
    await expect(page.getByText(/No-show reminder sent to Caio/)).toBeVisible();
  });

  test('a new order appears live in two tabs at once', async ({ context }) => {
    const [first, second] = [await context.newPage(), await context.newPage()];
    await Promise.all([first.goto('/mare/ops/counter'), second.goto('/mare/ops/counter')]);
    await Promise.all([expect(first.locator('.ct-live')).toBeVisible(), expect(second.locator('.ct-live')).toBeVisible()]);
    await first.getByRole('button', { name: 'Simulate order' }).click();
    await Promise.all([
      expect(first.locator('[data-lane="to-pick"] .ct-card.is-fresh')).toHaveCount(1),
      expect(second.locator('[data-lane="to-pick"] .ct-card.is-fresh')).toHaveCount(1)
    ]);
    const id = await first.locator('[data-lane="to-pick"] .ct-card.is-fresh').getAttribute('data-order');
    await expect(second.locator(`[data-order="${id}"]`)).toBeVisible();
  });

  test('returns: legacy ?view= link lands on the Returns path route', async ({ page }) => {
    await page.goto('/mare/ops/counter?view=returns');
    await expect(page).toHaveURL(/\/mare\/ops\/counter\/returns$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Returns' })).toBeVisible();
    await expect(page.locator('.ct-tabs [aria-current="page"]')).toHaveText('Returns');
  });

  test('returns: scan the receipt, check the condition and refund as store credit', async ({ page }) => {
    await page.goto('/mare/ops/counter/returns?return=RT-12407');
    await page.getByRole('button', { name: 'Scan receipt' }).click();
    const modal = page.getByRole('dialog', { name: 'Scan receipt' });
    await modal.getByRole('button', { name: 'Simulate scan', exact: true }).click();
    await expect(modal).toBeHidden();
    await expect(page.locator('[data-anchor="ct-receipt"]')).toContainText('MR-903244');
    for (const name of ['Tags attached', 'No damage beyond the reason given', 'Original packaging or bag']) await page.getByRole('button', { name }).click();
    await page.getByRole('button', { name: 'Refund R$262.90' }).click();
    await expect(page.locator('.ct-toast')).toContainText('store credit issued to Marina');
    await expect(page.getByRole('link', { name: 'View event in Mesh' })).toHaveAttribute('href', '/mare/ops/mesh/events?key=RT-12407');
  });

  test('returns: refunding a coded order reverses the Circle commission', async ({ page }) => {
    await page.goto('/mare/ops/counter/returns?return=RT-12418');
    for (const name of ['Tags attached', 'No damage beyond the reason given', 'Original packaging or bag']) await page.getByRole('button', { name }).click();
    await page.getByRole('radio', { name: /Original payment/ }).click();
    await expect(page.getByRole('radio', { name: /Original payment/ })).toContainText('Cancels 2 remaining installments');
    await page.getByRole('button', { name: 'Refund R$319.00' }).click();
    await expect(page.locator('.ct-toast')).toContainText('NINA10 commission reversed −R$19.14');
  });

  test('stock: sold-out size gets an AI tip, then a two-hour reservation', async ({ page }) => {
    await page.goto('/mare/ops/counter/stock?sku=MR-18511&size=M');
    await expect(page.getByRole('heading', { level: 1, name: 'Linen midi dress' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /M\s*Out/ })).toBeVisible();
    await expect(page.locator('[data-anchor="ct-stock-freshness"]')).toContainText('updated from stock events');
    const tip = page.locator('[data-anchor="ct-stock-ai"]');
    await expect(tip).toContainText('Simulated AI');
    await tip.getByRole('button', { name: /Show L/ }).click();
    await expect(page).toHaveURL(/size=L/);
    await page.getByRole('button', { name: 'Reserve for customer · 2 h' }).click();
    await page.getByRole('dialog', { name: 'Reserve for a customer' }).getByRole('button', { name: /Hold until/ }).click();
    await expect(page.locator('[data-anchor="ct-reserved"]')).toContainText('Reserved L for Helena');
  });

  test('stock: pausing live updates freezes the world clock', async ({ page }) => {
    await page.goto('/mare/ops/counter/stock');
    const control = page.locator('[data-anchor="ct-stock-live"]');
    await control.getByRole('button', { name: 'Pause live updates' }).click();
    await expect(control).toHaveAttribute('data-live', 'paused');
    const time = await control.locator('time').textContent();
    await page.waitForTimeout(1500);
    await expect(control.locator('time')).toHaveText(time!);
    await control.getByRole('button', { name: 'Resume live updates' }).click();
  });
});

