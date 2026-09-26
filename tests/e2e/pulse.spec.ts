import { expect, test } from '@playwright/test';

test.describe('Pulse', () => {
  test('Ask Pulse streams a cited answer with a trace link', async ({ page }) => {
    await page.goto('/pulse');
    await page.getByRole('button', { name: 'Why is Seoul moving before LA?' }).click();
    await expect(page.locator('.ai-stream')).toContainText('9–14 hours', { timeout: 10000 });
    await expect(page.locator('.pl-ask .ai-source')).toHaveCount(3);
    await page.getByRole('link', { name: /Show trace/ }).click();
    await expect(page).toHaveURL(/\/pulse\/harness\?q=/);
    await expect(page.locator('.pl-gate')).toContainText('pass', { timeout: 10000 });
  });

  test('language switch translates the interface', async ({ page }) => {
    await page.goto('/pulse');
    await page.getByRole('button', { name: 'KR' }).click();
    await expect(page.getByRole('button', { name: 'KR' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('퍼포먼스 인텔리전스');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  });

  test('distribution slots move with the keyboard and reach reacts to pages', async ({ page }) => {
    await page.goto('/pulse/distribution');
    await expect(page.getByText(/outside the local peak/)).toBeVisible();
    const slot = page.getByRole('button', { name: /chorus · EN at 13:00/ });
    await slot.focus();
    for (let i = 0; i < 7; i += 1) await page.keyboard.press('ArrowRight');
    await expect(page.getByText(/outside the local peak/)).toBeHidden();
    const reach = await page.locator('.pl-reach strong').textContent();
    await page.getByRole('checkbox').first().uncheck();
    await expect(page.locator('.pl-reach strong')).not.toHaveText(reach!);
  });
});
