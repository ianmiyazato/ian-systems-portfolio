import { expect, test } from '@playwright/test';
import { routes } from '../../packages/routes/src/index';

// Every animation must stop under prefers-reduced-motion: nothing may still be running a second after load.
test.describe('reduced motion', () => {
  for (const route of routes) {
    test(`reduced motion · ${route.id}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route.href);
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
      await expect(page.locator('.im-footer')).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(1000);
      const running = await page.evaluate(() =>
        document.getAnimations()
          .filter((animation) => animation.playState === 'running')
          .map((animation) => {
            const target = (animation.effect as KeyframeEffect | null)?.target as Element | null;
            const name = (animation as CSSAnimation).animationName ?? (animation as CSSTransition).transitionProperty ?? 'script';
            return `${name} on ${target ? `${target.tagName.toLowerCase()}${target.className && typeof target.className === 'string' ? `.${target.className.trim().split(/\s+/).join('.')}` : ''}` : '?'}`;
          })
      );
      expect([...new Set(running)]).toEqual([]);
    });
  }
});
