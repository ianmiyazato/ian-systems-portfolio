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
    await expect(page.locator('.cc-receipt footer strong')).toHaveText('R$60.74');
    await page.getByLabel('Commission rate').fill('12');
    await expect(page.locator('.cc-receipt footer strong')).toHaveText('R$69.90');
  });

  test('no-sales and payout-failed variations', async ({ page }) => {
    await page.goto('/mare/ops/circle?state=empty');
    await expect(page.getByText(/no sales yet/)).toBeVisible();
    await page.goto('/mare/ops/circle?state=payout-failed');
    await expect(page.getByRole('button', { name: 'Retry payout' })).toBeVisible();
  });

  test('every nav item is a real view and legacy ?view= links redirect', async ({ page }) => {
    for (const [slug, heading] of [['creators', 'Creators'], ['campaigns', 'Summer swim drop'], ['payouts', 'Payouts']]) {
      await page.goto(`/mare/ops/circle?view=${slug}`);
      await expect(page).toHaveURL(new RegExp(`/mare/ops/circle/${slug}$`));
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });

  test('creators: live leaderboard, profile drawer and the invite flow', async ({ page }) => {
    await page.goto('/mare/ops/circle/creators');
    await expect(page.locator('.cc-creator')).toHaveCount(12);
    await page.getByRole('button', { name: /^Nina Costa/ }).click();
    await expect(page.getByRole('dialog', { name: 'Nina Costa' })).toContainText('Performance · 14 days');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Invite creator' }).click();
    const invite = page.getByRole('dialog', { name: 'Invite a creator' });
    await expect(invite.locator('[data-anchor="cc-contract-preview"]')).toContainText('30 days after delivery');
    await invite.getByRole('button', { name: 'Send invite' }).click();
    await expect(page.locator('[data-anchor="cc-new-creator"]')).toContainText('no sales yet');
  });

  test('campaigns: post drawer and the scheduled variation', async ({ page }) => {
    await page.goto('/mare/ops/circle/campaigns');
    await page.locator('.cc-post').first().click();
    const drawer = page.locator('[data-anchor="cc-post-drawer"]');
    await drawer.getByRole('button', { name: /Boost/ }).click();
    await expect(drawer).toContainText('Boost scheduled');
    await page.goto('/mare/ops/circle/campaigns?state=scheduled');
    await expect(page.locator('[data-anchor="cc-campaign-scheduled"]')).toBeVisible();
  });

  test('payouts: approval needs the checklist, then a second factor', async ({ page }) => {
    await page.goto('/mare/ops/circle/payouts');
    const approve = page.locator('[data-anchor="cc-approve-payout"]');
    await expect(approve).toBeDisabled();
    await page.getByRole('button', { name: 'Hold Tomas until he confirms' }).click();
    await approve.click();
    const modal = page.getByRole('dialog', { name: 'Approve this payout?' });
    await modal.getByLabel('6-digit code from your authenticator').fill('482193');
    await modal.getByRole('button', { name: /^Approve/ }).click();
    await expect(page.locator('[data-anchor="cc-payout-approved"]')).toBeVisible();
  });

  test('a Counter refund reverses the creator commission in Payouts, across tabs', async ({ context }) => {
    const payouts = await context.newPage();
    await payouts.goto('/mare/ops/circle/payouts');
    const nina = payouts.locator('tr', { hasText: 'NINA10' });
    await expect(nina).toContainText('−R$38');
    const counter = await context.newPage();
    await counter.goto('/mare/ops/counter/returns?return=RT-12418');
    for (const name of ['Tags attached', 'No damage beyond the reason given', 'Original packaging or bag']) await counter.getByRole('button', { name }).click();
    await counter.getByRole('button', { name: 'Refund R$350.90' }).click();
    await expect(nina).toContainText('−R$57.14');
    await expect(nina).toContainText('order MR-903870 returned');
  });
});

