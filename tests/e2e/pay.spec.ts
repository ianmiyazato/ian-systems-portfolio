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
    await page.getByLabel('Reason').fill('Fourteen months on time on the Store card; recent move explains the address.');
    await page.getByRole('button', { name: 'Send for approval' }).click();
    await expect(page.getByText(/Sent for approval · Renata A./)).toBeVisible();
  });

  test('declined and drift variations are designed', async ({ page }) => {
    await page.goto('/mare/ops/pay?state=declined');
    await expect(page.getByRole('heading', { name: 'About your Maré Pay application' })).toBeVisible();
    await page.goto('/mare/ops/pay?state=drift');
    await expect(page.getByText(/Model drift · PSI 0.27/)).toBeVisible();
  });

  test('every nav item is a real view and legacy ?view= links redirect', async ({ page }) => {
    for (const [slug, heading] of [['accounts', 'Accounts'], ['disputes', 'Disputes'], ['collections', 'Collections'], ['fraud', 'Fraud'], ['models', 'Models'], ['policies', 'Policies']]) {
      await page.goto(`/mare/ops/pay?view=${slug}`);
      await expect(page).toHaveURL(new RegExp(`/mare/ops/pay/${slug}$`));
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.locator('.py-side [aria-current="page"]')).toContainText(heading);
    }
  });

  test('accounts: drawer, raise limit against policy, and the frozen variation', async ({ page }) => {
    await page.goto('/mare/ops/pay/accounts');
    await page.getByRole('button', { name: /^H•••• C\./ }).click();
    const drawer = page.getByRole('dialog', { name: 'H•••• C.' });
    await expect(drawer).toContainText('Statement');
    await drawer.getByRole('button', { name: 'Raise limit' }).click();
    const sub = page.getByRole('dialog', { name: 'Raise credit limit' });
    await expect(sub).toContainText('Within policy v7 band');
    await page.goto('/mare/ops/pay/accounts?state=frozen');
    await expect(page.locator('[data-anchor="py-frozen"]')).toContainText('Frozen 16:02');
    await expect(page.getByRole('button', { name: 'Raise limit' })).toBeDisabled();
  });

  test('disputes: proofs move the win likelihood and evidence is submitted', async ({ page }) => {
    await page.goto('/mare/ops/pay/disputes');
    const pack = page.locator('[data-anchor="py-dispute-case"]');
    await expect(pack.locator('.py-ring strong')).toHaveText('74%');
    await pack.getByRole('checkbox', { name: /Chat transcript/ }).check();
    await expect(pack.locator('.py-ring strong')).toHaveText('82%');
    await pack.getByRole('button', { name: 'Submit evidence' }).click();
    await page.getByRole('dialog', { name: 'Submit evidence' }).getByRole('button', { name: 'Submit to the network' }).click();
    await expect(page.locator('[data-anchor="py-dispute-submitted"]')).toBeVisible();
  });

  test('collections: the agreement builder recalculates live', async ({ page }) => {
    await page.goto('/mare/ops/pay/collections?state=promise-broken');
    await expect(page.locator('[data-anchor="py-promise-broken"]')).toBeVisible();
    await page.getByRole('button', { name: 'Offer an agreement' }).click();
    const modal = page.getByRole('dialog', { name: 'Agreement builder' });
    const quote = modal.locator('[data-anchor="py-agreement-quote"]');
    await expect(quote).toContainText('6× R$396.86');
    await modal.getByRole('button', { name: '12×' }).click();
    await expect(quote).not.toContainText('6× R$396.86');
    await expect(modal.locator('[data-anchor="py-payment-link"]')).toContainText('12×');
  });

  test('fraud: the stream is live and a pattern becomes a shadow-mode rule', async ({ page }) => {
    await page.goto('/mare/ops/pay/fraud');
    await expect(page.locator('.py-stream tbody tr')).toHaveCount(11);
    await page.getByRole('button', { name: 'Draft rule' }).click();
    await page.getByRole('dialog', { name: 'Draft rule FR-219' }).getByRole('button', { name: 'Save in shadow mode' }).click();
    await expect(page.locator('[data-anchor="py-rule-saved"]')).toBeVisible();
  });

  test('models: unmeasured gates stay [value] and block promotion', async ({ page }) => {
    await page.goto('/mare/ops/pay/models');
    await expect(page.locator('[data-anchor="py-gates"]')).toContainText('[value]');
    await expect(page.getByRole('button', { name: 'Promote to champion' })).toBeDisabled();
  });

  test('policies: replay, two-person approval, publish; conflicts block', async ({ page }) => {
    await page.goto('/mare/ops/pay/policies');
    await page.getByRole('button', { name: 'Run simulation' }).click();
    await expect(page.locator('[data-anchor="py-policy-impact"]')).toContainText('+2,940 customers approved');
    await page.getByRole('button', { name: 'Request approval' }).click();
    await page.getByRole('dialog', { name: 'Request approval for v8' }).getByRole('button', { name: 'Send to Lara' }).click();
    await page.getByRole('button', { name: 'Publish v8' }).click();
    await expect(page.locator('[data-anchor="py-policy-published"]')).toBeVisible();
    await page.goto('/mare/ops/pay/policies?state=conflict');
    await expect(page.locator('[data-anchor="py-policy-conflict"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request approval' })).toBeDisabled();
  });

  test('the recap replays what changed since you left, story by story', async ({ page }) => {
    await page.goto('/mare/ops/pay');
    await page.getByRole('button', { name: /What changed since/ }).click();
    const recap = page.getByRole('dialog', { name: 'What changed since you left' });
    await expect(recap.getByText('Applications', { exact: true })).toBeVisible();
    await recap.getByRole('button', { name: 'Pause' }).click();
    await recap.getByRole('button', { name: 'Next' }).click();
    // The default world is mid-incident, so scoring is slow and the card points to Tidewatch.
    await expect(recap.getByText('214 ms')).toBeVisible();
    await expect(recap.getByRole('link', { name: 'Open P-812 in Tidewatch' })).toHaveAttribute('href', '/observability');
    await page.keyboard.press('ArrowRight');
    await expect(recap.getByText('2 due')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(recap).toBeHidden();
  });

  test('returning to Pay after a while plays the recap once', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pay:last-visit', String(Date.parse('2026-09-26T14:00:00-03:00'))));
    await page.goto('/mare/ops/pay?t=16:18');
    await expect(page.getByRole('dialog', { name: 'What changed since you left' })).toBeVisible();
    await expect(page.getByText(/Since 14:00 · 1 of 5/)).toBeVisible();
  });
});
