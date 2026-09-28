import { expect, test } from '@playwright/test';

for (const [project, scenario] of [['mare', 'Black Friday spike'], ['atlas', 'Arena session scored'], ['pulse', 'Model release through the eval gate']] as const) {
  test(`system design · ${project} replays "${scenario}"`, async ({ page }) => {
    await page.goto(`/system-design/${project}`);
    await page.getByRole('button', { name: scenario }).click();
    const steps = await page.locator('.sd-timeline li').count();
    expect(steps).toBeGreaterThan(2);
    for (let index = 1; index < steps; index += 1) {
      await page.getByRole('button', { name: 'Next step →' }).click();
      await expect(page.locator('.sd-timeline li').nth(index)).toHaveClass(/now/);
    }
    await expect(page.locator('.sd-node.lit').first()).toBeVisible();
    await page.getByRole('group', { name: 'Inspect a component' }).getByRole('button').first().click();
    await expect(page.getByRole('region', { name: /Decision for/ })).toBeVisible();
    await page.getByRole('button', { name: 'Synchronous before' }).click();
    await expect(page.locator('.sd-before')).toBeVisible();
  });
}

test.describe('Request path', () => {
  test('nodes explain themselves and layers can be isolated', async ({ page }) => {
    await page.goto('/system-design/mare/request-path');
    await expect(page.getByRole('heading', { level: 1, name: 'Every hop, live' })).toBeVisible();
    await page.getByRole('button', { name: 'Orders, writes once, emits' }).click();
    const panel = page.locator('[data-anchor="rp-node-panel"]');
    await expect(panel).toContainText('enterprise RDBMS');
    await expect(panel).toContainText('Failure modes');
    await page.getByRole('button', { name: 'Only queues' }).click();
    await expect(page.locator('.rp-node.layer-service.dim').first()).toBeAttached();
    await expect(page.locator('.rp-node.layer-backbone.dim')).toHaveCount(0);
  });

  test('live packets follow world events', async ({ page }) => {
    await page.goto('/system-design/mare/request-path');
    await expect.poll(async () => page.locator('.rp-packet').count(), { timeout: 15000 }).toBeGreaterThan(0);
  });

  test('the default world is mid-incident, so the DB pool replay offers recovery', async ({ page }) => {
    await page.goto('/system-design/mare/request-path');
    await page.getByRole('button', { name: 'DB pool saturation after deploy #812' }).click();
    await expect(page.getByRole('button', { name: 'Recover · end the incident' })).toBeVisible();
  });

  test('a replay runs live across the portfolio and recovers', async ({ page }) => {
    await page.goto('/system-design/mare/request-path?fault=none');
    await page.getByRole('button', { name: 'DB pool saturation after deploy #812' }).click();
    await page.getByRole('button', { name: 'Run it live across the portfolio' }).click();
    await expect(page.locator('.rp-node.failed', { hasText: 'Orders' })).toBeVisible();
    await page.getByRole('button', { name: 'Recover · end the incident' }).click();
    await expect(page.locator('.rp-node.failed', { hasText: 'Orders' })).toHaveCount(0);
  });
});
