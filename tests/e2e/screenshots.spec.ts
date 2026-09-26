import { expect, test, type Page } from '@playwright/test';
import { areas, screens, type ScreenRoute } from '../../packages/chrome/src/routes';

// Generates docs/screenshots/<area>/<screen>.png for every registry screen (1440 × 900),
// one image per designed variation of each area's main screen, and key mobile views at 390.
const zone = process.env.SHOT_ZONE;
const only = (screen: ScreenRoute) => !zone || screen.zone === zone;
const mainScreen: Record<string, string> = {
  balcao: 'balcao-lanes', 'product-hub': 'product-hub-catalog', pay: 'pay-applications', circle: 'circle-program',
  mesh: 'mesh-topology', consumer: 'consumer-site', atlas: 'atlas-pipeline', pulse: 'pulse-intelligence'
};
const mobile = ['home', 'balcao-lanes', 'balcao-picking', 'consumer-site', 'consumer-app', 'pay-customer-app', 'atlas-board', 'pulse-intelligence'];

async function settle(page: Page) {
  await expect(page.locator('.im-footer')).toContainText('All names are fictitious');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  // Let entrance motion finish so screenshots show the resting design.
  await page.waitForTimeout(1400);
}

const withState = (href: string, state: string) => `${href}${href.includes('?') ? '&' : '?'}state=${state}`;

for (const screen of screens.filter(only)) {
  test(`screenshot ${screen.area}/${screen.id}`, async ({ page }) => {
    await page.goto(screen.href);
    await settle(page);
    await page.screenshot({ path: `docs/screenshots/${screen.area}/${screen.id}.png` });
  });
}

for (const area of areas) {
  const id = mainScreen[area.id];
  const screen = screens.find((item) => item.id === id);
  if (!screen || !only(screen)) continue;
  for (const state of area.states) {
    test(`screenshot ${area.id}/${id}--${state}`, async ({ page }) => {
      const target = state === 'picked' ? '/mare/ops/balcao/pick/MR-904117' : screen.href;
      await page.goto(withState(target, state));
      await settle(page);
      // Static zones render every variation in place; bring the active one into view.
      await page.evaluate((active) => document.querySelector(`[data-state-only~="${active}"]`)?.scrollIntoView({ block: 'center' }), state);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `docs/screenshots/${area.id}/${state === 'picked' ? 'balcao-picking' : id}--${state}.png` });
    });
  }
}

for (const id of mobile) {
  const screen = screens.find((item) => item.id === id);
  if (!screen || !only(screen)) continue;
  test(`screenshot mobile/${id}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(screen.href);
    await settle(page);
    await page.screenshot({ path: `docs/screenshots/mobile/${id}.png` });
  });
}
