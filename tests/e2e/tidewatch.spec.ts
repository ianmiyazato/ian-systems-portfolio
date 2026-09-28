import { expect, test, type Page } from '@playwright/test';

async function runPaletteAction(page: Page, query: string, title: RegExp) {
  await page.waitForFunction(() => document.documentElement.dataset.chrome === 'on');
  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'Command palette' });
  await expect(palette).toBeVisible();
  await palette.getByRole('combobox').fill(query);
  await palette.getByRole('option', { name: title }).click();
}

test.describe('Tidewatch', () => {
  test('the default world is mid-incident and rolling back #812 resolves P-812', async ({ page }) => {
    await page.goto('/observability');
    const problem = page.getByRole('alert').filter({ hasText: 'P-812' });
    await expect(problem).toBeVisible();
    await expect(problem.getByRole('heading', { level: 1 })).toContainText('Checkout p95 degraded');
    await page.getByRole('button', { name: 'Roll back #812' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'No open problems' })).toBeVisible();
    await expect(page.getByText(/P-812 resolved at/)).toBeVisible();
  });

  test('a chaos action from the palette opens a new problem', async ({ page }) => {
    await page.goto('/observability?fault=none');
    // The static HTML already says "No open problems"; a healthy orders-api proves the world mounted.
    await expect(page.getByRole('button', { name: 'orders-api, healthy' })).toBeVisible();
    await runPaletteAction(page, 'chaos', /saturate the Orders DB pool/);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('alert').filter({ hasText: 'Checkout p95 degraded' })).toBeVisible();
  });

  test('the trace waterfall highlights the slow span and its attributes', async ({ page }) => {
    await page.goto('/observability/traces/9f3a2c');
    await expect(page.getByRole('heading', { level: 1, name: 'Trace 9f3a2c' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'db.pool.acquire' })).toBeVisible();
    await expect(page.getByText(/Why it.s slow: 70% waiting for a DB connection/)).toBeVisible();
    await expect(page.getByText('db pool wait exceeded 500ms')).toBeVisible();
  });

  test('logs filter by field and free text', async ({ page }) => {
    await page.goto('/observability/logs?live=paused');
    const query = page.getByRole('search').getByRole('textbox');
    await query.fill('service:orders-api level:warn pool');
    const rows = page.locator('.tw-logs li');
    await expect(rows.first()).toBeVisible();
    for (const text of await rows.allTextContents()) expect(text).toMatch(/warn.*orders-api.*pool/);
    await query.fill('service:nothing-here');
    await expect(page.getByText('No log lines match.')).toBeVisible();
  });

  test('the burning checkout SLO pages on-call', async ({ page }) => {
    await page.goto('/observability/slos');
    await expect(page.getByRole('heading', { level: 1, name: 'SLOs' })).toBeVisible();
    await expect(page.getByText('firing · paged on-call').first()).toBeVisible();
  });

  test('View trace from a Counter action lands on that live trace', async ({ page }) => {
    await page.goto('/mare/ops/counter?modal=cutoff-plan');
    await page.getByRole('button', { name: 'Apply plan' }).click();
    const link = page.getByRole('status').getByRole('link', { name: 'View trace' });
    await expect(link).toHaveAttribute('href', /\/observability\/traces\/live\?id=/);
    await link.click();
    await expect(page).toHaveURL(/\/observability\/traces\/live\?id=/);
    await expect(page.getByText(/apply cutoff plan/i).first()).toBeVisible();
  });
});
