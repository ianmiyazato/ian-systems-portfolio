import { expect, test, type Page } from '@playwright/test';
import { routes as screens, systems as areas, type RouteEntry as ScreenRoute } from '../../packages/routes/src/index';

// Generates docs/screenshots/<area>/<screen>.png for every registry screen (1440 × 900),
// one image per designed variation of each area's main screen, and key mobile views at 390.
const zone = process.env.SHOT_ZONE;
const only = (screen: ScreenRoute) => (!zone || screen.zone === zone) && selected(screen);
const picked = process.env.SHOT_ONLY?.split(',').filter(Boolean);
const selected = (screen: ScreenRoute) => !picked || picked.some((item) => screen.id === item || screen.system === item || screen.href === item);
// Some variations belong to a specific screen rather than the area's main screen.
const stateScreen: Record<string, [string, string]> = {
  picked: ['balcao-picking', '/mare/ops/balcao/pick/MR-904117'],
  limit: ['atlas-arena', '/atlas/arena'],
  generating: ['atlas-feedback', '/atlas/arena/sessions/14'],
  'checkout-failed': ['atlas-paywall', '/atlas/academy/designing-for-10x?modal=paywall&sub=checkout']
};
const mobile = screens.filter((screen) => screen.mobile).map((screen) => screen.id);

async function settle(page: Page) {
  await expect(page.locator('.im-footer')).toContainText('All names are fictitious');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  // Let entrance motion finish so screenshots show the resting design.
  await page.waitForTimeout(1400);
}

const withState = (href: string, state: string) => `${href}${href.includes('?') ? '&' : '?'}state=${state}`;

for (const screen of screens.filter(only)) {
  test(`screenshot ${screen.system}/${screen.id}`, async ({ page }) => {
    await page.goto(screen.href);
    await settle(page);
    await page.screenshot({ path: `docs/screenshots/${screen.system}/${screen.id}.png` });
  });
}

for (const area of areas) {
  const id = area.home;
  const screen = screens.find((item) => item.id === id);
  if (!screen || !only(screen)) continue;
  for (const state of area.states) {
    test(`screenshot ${area.id}/${id}--${state}`, async ({ page }) => {
      const [name, target] = stateScreen[state] ?? [id, screen.href];
      await page.goto(withState(target, state));
      await settle(page);
      // Static zones render every variation in place; bring the active one into view.
      await page.evaluate((active) => document.querySelector(`[data-state-only~="${active}"]`)?.scrollIntoView({ block: 'center' }), state);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `docs/screenshots/${area.id}/${name}--${state}.png` });
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
