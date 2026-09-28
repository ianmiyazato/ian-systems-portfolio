import { expect, test } from '@playwright/test';

// Keyboard shortcuts come from one engine in @portfolio/chrome and DOM conventions on each screen.
test.describe('keyboard shortcuts', () => {
  test('? lists the shortcuts for this screen and g + letter switches views (Pay)', async ({ page }) => {
    await page.goto('/mare/ops/pay');
    await expect(page.locator('[data-nav-row]').first()).toBeVisible();
    await page.keyboard.press('?');
    const help = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(help).toBeVisible();
    await expect(help.getByText('Disputes')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();
    await page.keyboard.press('g');
    await expect(page.getByRole('status').filter({ hasText: /g · .*d Disputes/ })).toBeVisible();
    await page.keyboard.press('d');
    await expect(page).toHaveURL(/\/mare\/ops\/pay\/disputes$/);
  });

  test('j / k move between rows and Enter opens (Product Hub catalog)', async ({ page }) => {
    await page.goto('/mare/ops/product-hub');
    const rows = page.locator('[data-nav-row]');
    await expect(rows.first()).toBeVisible();
    await page.keyboard.press('j');
    await page.keyboard.press('j');
    await page.keyboard.press('k');
    await expect(rows.first().locator('[data-nav-open]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/mare\/ops\/product-hub\/products\//);
  });

  test('a approves where it is safe, inside the open dialog', async ({ page }) => {
    await page.goto('/mare/ops/product-hub/products/510233?modal=agent-run');
    await expect(page.locator('.ph-steps li.done')).toHaveCount(5);
    await page.keyboard.press('a');
    await expect(page.getByText(/Price change approved · R\$219/)).toBeVisible();
  });

  test('/ focuses search, and the same keys work in other stacks', async ({ page }) => {
    await page.goto('/observability/traces/9f3a2c');
    await expect(page.locator('[data-shortcut-search]')).toBeVisible();
    await page.keyboard.press('/');
    await expect(page.locator('[data-shortcut-search]')).toBeFocused();
    await page.goto('/pulse');
    await expect(page.getByRole('heading', { level: 1, name: 'Hana Rae' })).toBeVisible();
    await page.waitForFunction(() => customElements.get('im-shortcuts'));
    await page.keyboard.press('g');
    await page.keyboard.press('w');
    await expect(page).toHaveURL(/\/pulse\/wallet/);
  });
});
