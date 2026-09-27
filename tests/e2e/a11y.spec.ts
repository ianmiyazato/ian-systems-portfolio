import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { routeById, routes, systems } from '../../packages/routes/src/index';

// Every route and deep link in the manifest, plus each system's variations, through the shell domain.
const withState = (href: string, state: string) => `${href.split('?')[0]}?state=${state}`;
const targets = [
  ...routes.map((route) => [route.id, route.href] as const),
  ...systems.flatMap((system) => {
    const home = system.home ? routeById(system.home) : undefined;
    return home ? system.states.map((state) => [`${system.id}--${state}`, withState(home.href, state)] as const) : [];
  }),
  ...routes.flatMap((route) => (route.states ?? []).map((state) => [`${route.id}--${state}`, withState(route.href, state)] as const))
];

// The world is pinned (?live=paused) so axe measures the resting design, not a row mid-arrival.
const pinned = (href: string) => `${href}${href.includes('?') ? '&' : '?'}live=paused`;

for (const [name, href] of targets) {
  test(`a11y · ${name}`, async ({ page }) => {
    await page.goto(pinned(href));
    await expect(page.locator('.im-footer')).toContainText('All names are fictitious · data is synthetic · AI behavior is simulated in v0.1');
    await page.waitForLoadState('networkidle');
    // Let sequenced reveals (agent traces, streamed text) finish so axe measures resting colors.
    await page.waitForTimeout(2600);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
    expect(serious.map((violation) => `${violation.id}: ${violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}
