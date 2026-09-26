import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { areas, screens } from '../../packages/chrome/src/routes';

// Every screen and deep link in the parity registry, plus each area's variations, through the shell domain.
const main: Record<string, string> = {
  balcao: '/mare/ops/balcao', 'product-hub': '/mare/ops/product-hub', pay: '/mare/ops/pay', circle: '/mare/ops/circle',
  mesh: '/mare/ops/mesh', consumer: '/mare/shop', atlas: '/atlas/pipeline', pulse: '/pulse'
};
const targets = [
  ...screens.map((screen) => [screen.id, screen.href] as const),
  ...areas.flatMap((area) => (main[area.id] ? area.states.map((state) => [`${area.id}--${state}`, `${main[area.id]}?state=${state}`] as const) : []))
];

for (const [name, href] of targets) {
  test(`a11y · ${name}`, async ({ page }) => {
    await page.goto(href);
    await expect(page.locator('.im-footer')).toContainText('All names are fictitious · data is synthetic · AI behavior is simulated in v0.1');
    await page.waitForLoadState('networkidle');
    // Let sequenced reveals (agent traces, streamed text) finish so axe measures resting colours.
    await page.waitForTimeout(2600);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
    expect(serious.map((violation) => `${violation.id}: ${violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}
