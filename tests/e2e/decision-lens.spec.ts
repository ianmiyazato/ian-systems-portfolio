import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { routes as screens } from '../../packages/routes/src/index';

type Resolution = { id: string; anchor: string; resolved: boolean; visible: boolean };

// Every screen with a decisions file must open the lens with ≥4 hotspots whose anchors resolve.
const covered = screens.filter((screen) => existsSync(`decisions/${screen.id}.json`) && (!process.env.LENS_ZONE || screen.zone === process.env.LENS_ZONE));

for (const screen of covered) {
  test(`Decision Lens · ${screen.id} · every anchor resolves`, async ({ page }) => {
    await page.goto(screen.href);
    await expect(page.locator('.im-footer')).toContainText('All names are fictitious');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('d');
    const lens = page.locator('im-decision-lens');
    await expect(lens.locator('.hotspot').first()).toBeAttached();
    const resolution = await lens.evaluate((element) => (element as unknown as { resolution: () => Promise<Resolution[]> }).resolution());
    expect(resolution.length, 'at least four decisions').toBeGreaterThanOrEqual(4);
    expect(resolution.filter((item) => !item.resolved).map((item) => item.anchor), 'unresolved anchors').toEqual([]);
    const screenId = await lens.evaluate((element) => (element as unknown as { screenId: string }).screenId);
    expect(screenId).toBe(screen.id);
  });
}
