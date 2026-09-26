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
