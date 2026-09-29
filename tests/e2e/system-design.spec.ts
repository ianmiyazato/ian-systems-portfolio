import { expect, test } from '@playwright/test';

// v0.3: the v0.1/v0.2 architecture pages were rebuilt (Maré) or retired with permanent redirects.
for (const [from, to] of [
  ['/system-design/mare/request-path', '/system-design/mare'],
  ['/system-design/atlas', '/system-design'],
  ['/system-design/pulse', '/system-design/metrics-to-decisions']
] as const) {
  test(`system design · ${from} redirects to ${to}`, async ({ page, request }) => {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`${to.replace(/\//g, '\\/')}$`));
    await expect(page.locator('h1')).toBeVisible();
  });
}

test('system design · the Maré deep dive steps through six ideas with an engineering layer', async ({ page }) => {
  // v0.4: /system-design/mare is the Maré case; the deep dive moved one level down.
  await page.goto('/system-design/mare/orders');
  await expect(page.getByRole('heading', { level: 1, name: 'Orders under load' })).toBeVisible();
  const screen = page.locator('[data-screen="mare"]');
  await expect(screen).toHaveAttribute('data-steps', '6');
  await page.keyboard.press('End');
  await expect(screen).toHaveAttribute('data-step', '6');
  await expect(page.locator('[data-anchor="mare-orders-assistant"]')).toHaveClass(/is-focus/);
  await page.keyboard.press('e');
  await expect(screen.locator('[data-step-only="6"] .sd-step-eng')).toContainText('approval step');
  await expect(page.locator('[data-anchor="sd-mare-metrics"]')).toContainText('450 → ~200 ms');
});

test('system design · the portfolio bar and home link to the story', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'See the system design' })).toHaveAttribute('href', '/system-design');
});
