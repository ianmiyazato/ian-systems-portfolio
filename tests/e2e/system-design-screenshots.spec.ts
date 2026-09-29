import { expect, test } from '@playwright/test';
import { routes } from '../../packages/routes/src/index';

// Every step of every system design page, as a presenter shows it (?present=1) at 1440 × 900
// and 1920 × 1080: docs/screenshots/system-design/steps/<route>-<step>-<width>.jpg.
// Reduced motion shows each step's final state, so the frames are deterministic.
const story = routes.filter((route) => route.system === 'system-design');
const sizes = [[1440, 900], [1920, 1080]] as const;

for (const route of story) {
  for (const [width, height] of sizes) {
    test(`screenshot steps · ${route.id} · ${width}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${route.href}?present=1&step=1&ai=300`);
      await expect(page.locator('html')).toHaveAttribute('data-present', '');
      await page.evaluate(() => document.fonts.ready);
      const steps = await page.locator('[data-screen]').evaluateAll((screens) => screens.reduce((sum, screen) => sum + Number((screen as HTMLElement).dataset.steps ?? 1), 0));
      for (let step = 1; step <= steps; step += 1) {
        await page.goto(`${route.href}?present=1&step=${step}&ai=300`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(step === 1 ? 900 : 600);
        // The audience's view: controls hide while the mouse is still.
        await page.evaluate(() => document.documentElement.setAttribute('data-idle', ''));
        await page.screenshot({ path: `docs/screenshots/system-design/steps/${route.id}-${String(step).padStart(2, '0')}-${width}.jpg`, quality: 82 });
      }
    });
  }
}
