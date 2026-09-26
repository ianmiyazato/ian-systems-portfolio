import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/', '/mare/ops/balcao', '/mare/ops/product-hub', '/mare/ops/pay', '/mare/ops/circle', '/mare/ops/mesh', '/mare/shop', '/atlas/pipeline/board', '/pulse', '/system-design/mare'];

for (const route of routes) {
  test(`${route} loads, opens decisions, and has no serious axe violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('footer')).toContainText('All names are fictitious');
    await page.getByRole('button', { name: /Show decisions/ }).click();
    await expect(page.locator('.hotspot')).toHaveCount(4);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);
  });
}

test('deep-linked nested modal is reproducible', async ({ page }) => {
  await page.goto('/mare/ops/pay/applications/AP-77118?modal=decision&sub=override');
  await expect(page.getByRole('dialog')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
});

test('Pulse language switch works', async ({ page }) => {
  await page.goto('/pulse');
  await page.getByRole('button', { name: 'KR' }).click();
  await expect(page.getByRole('button', { name: 'KR' })).toHaveClass(/active/);
});

test('decision lens keyboard shortcut works after hydration', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Show decisions/ }).waitFor();
  await page.keyboard.press('d');
  await expect(page.locator('.hotspot')).toHaveCount(4);
});

test('Balcão Supabase Broadcast reaches two open tabs', async ({ context }) => {
  test.skip(process.env.NEXT_PUBLIC_DATA_MODE !== 'supabase', 'Supabase mode is an opt-in integration check');
  const first = await context.newPage();
  const second = await context.newPage();
  await Promise.all([first.goto('/mare/ops/balcao'), second.goto('/mare/ops/balcao')]);
  await Promise.all([
    expect(first.locator('[data-realtime-status="live"]')).toBeVisible(),
    expect(second.locator('[data-realtime-status="live"]')).toBeVisible()
  ]);
  await first.getByRole('button', { name: 'Emit demo event' }).click();
  await Promise.all([
    expect(first.locator('.realtime-feed')).toContainText('New pickup'),
    expect(second.locator('.realtime-feed')).toContainText('New pickup')
  ]);
});
