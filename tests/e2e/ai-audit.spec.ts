import { expect, test } from '@playwright/test';

// "AI you can audit": provenance on every AI card (any stack) and one audit log with outcomes.
test.describe('AI audit', () => {
  for (const [url, card] of [
    ['/mare/ops/counter', 'Cutoff plan ready'],
    ['/atlas/arena/mix/today', 'Why this mix'],
    ['/pulse/audio/afterglow', 'Cut a 28 s vertical of the hook for Tokyo'],
    ['/mare/shop', 'Why these']
  ] as const) {
    test(`How this was made on "${card}" (${url})`, async ({ page }) => {
      await page.goto(url.includes('shop') ? `${url}?ask=linen` : url);
      const surface = page.locator('.ai-surface', { hasText: card }).first();
      await expect(surface).toBeVisible();
      await surface.getByText('How this was made').click();
      await expect(surface.getByText('Model route')).toBeVisible();
      await expect(surface.getByText(/Tool calls · \d+ ms/)).toBeVisible();
      await expect(surface.getByRole('link', { name: /Open the trace in the Pulse harness/ })).toHaveAttribute('href', /\/pulse\/harness\?q=/);
    });
  }

  test('an approval in Counter shows up in the AI audit with its model and trace', async ({ page }) => {
    await page.goto('/mare/ops/counter?modal=cutoff-plan');
    await page.getByRole('button', { name: 'Apply plan' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Plan applied' })).toBeVisible();
    await page.goto('/observability/ai-audit');
    await expect(page.getByRole('heading', { level: 1, name: 'AI audit' })).toBeVisible();
    await page.getByRole('tab', { name: /Counter/ }).click();
    const row = page.locator('tr', { hasText: 'Apply cutoff plan' });
    await expect(row).toContainText('Ana');
    await expect(row).toContainText('ft-ops-v4');
    await expect(row).toContainText('measured in 24 h');
    await expect(row.getByRole('link')).toHaveAttribute('href', /\/observability\/traces\/live\?id=/);
    await expect(page.locator('tr', { hasText: 'reverted by Lara' })).toHaveCount(0);
    await page.getByRole('tab', { name: /Product Hub/ }).click();
    await expect(page.locator('tr', { hasText: 'reverted by Lara' })).toBeVisible();
  });
});
