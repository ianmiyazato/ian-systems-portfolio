import { expect, test, type Page } from '@playwright/test';
import { findJargon } from '../../packages/story-diagram/src/jargon';
import { caseSequence, cases, expectedLoss } from '../../packages/system-design/src/cases';
import { routes } from '../../packages/routes/src/index';
import { watchErrors } from '../support/route-check';

/**
 * v0.4 pilot: the Maré case (hub, Black Friday, storefront). Every step loads cleanly, the plain
 * layer carries no jargon, the decision math matches the content package, the live demo keeps
 * its promises and never moves the page, and presentation mode runs the three pages in order.
 */
const mare = cases.mare;
const run = caseSequence('mare');
const heading = (href: string) => routes.find((route) => route.href === href)!.heading;

async function pageCls(page: Page) {
  return page.evaluate(() => new Promise<number>((resolve) => {
    let total = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) total += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 300);
  }));
}

async function plainText(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((nodes) => nodes.map((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.sd-eng, .sd-step-eng, [data-eng-only], .sd-notes, title, desc').forEach((item) => item.remove());
    return clone.textContent ?? '';
  }).join(' '));
}

for (const { href, steps } of run) {
  test(`maré · ${href} · every step loads cleanly`, async ({ page }) => {
    for (let step = 1; step <= steps; step += 1) {
      const errors = watchErrors(page);
      await page.goto(`${href}?step=${step}`);
      await expect(page.locator('.im-footer')).toContainText('All names are fictitious');
      await expect(page.getByRole('heading', { level: 1 })).toContainText(heading(href));
      await expect(page.locator('[data-screen][data-active]')).toHaveCount(1);
      expect(errors, `${href}?step=${step}`).toEqual([]);
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
    }
  });

  test(`maré · ${href} · CLS stays 0 while loading and stepping`, async ({ page }) => {
    await page.goto(href);
    await page.waitForLoadState('networkidle');
    for (let step = 1; step < Math.min(steps, 5); step += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(450);
    }
    expect(await pageCls(page)).toBe(0);
  });

  test(`maré · ${href} · the plain layer has no jargon`, async ({ page }) => {
    await page.goto(href);
    expect(findJargon(await plainText(page, '[data-screen]'))).toEqual([]);
  });
}

test('maré · the hub shows the company, both problems and only real metrics', async ({ page }) => {
  await page.goto('/system-design/mare');
  await expect(page.locator('[data-anchor="sd-mare-context"] > div')).toHaveCount(3);
  await expect(page.locator('[data-anchor="sd-mare-backend"]')).toHaveAttribute('href', '/system-design/mare/black-friday');
  await expect(page.locator('[data-anchor="sd-mare-frontend"]')).toHaveAttribute('href', '/system-design/mare/storefront');
  for (const metric of mare.metrics) await expect(page.locator('[data-anchor="sd-mare-metrics"]')).toContainText(metric.value);
  await expect(page.locator('[data-anchor="sd-mare-concepts"] li')).toHaveCount(mare.concepts.length);
  await expect(page.locator('[data-anchor="sd-mare-deeper"] a').first()).toHaveAttribute('href', '/system-design/mare/orders');
});

test('maré · the index links to the case and the moved deep dive', async ({ page }) => {
  await page.goto('/system-design');
  await expect(page.locator('[data-anchor="sd-cases"] a')).toHaveAttribute('href', '/system-design/mare');
  await expect(page.locator('[data-anchor="sd-deep-dives"] a').first()).toHaveAttribute('href', '/system-design/mare/orders');
});

test('maré · the Black Friday story walks seven steps, and E reveals the engineering', async ({ page }) => {
  await page.goto('/system-design/mare/black-friday');
  const flow = page.locator('[data-screen="mare-bf-flow"]');
  await expect(flow).toHaveAttribute('data-steps', '7');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-anchor="mare-black-friday-stock"]')).toHaveClass(/is-focus/);
  await page.keyboard.press('e');
  await expect(flow.locator('[data-step-only="3"] .sd-step-eng')).toContainText('Redis');
  await expect(page.locator('[data-anchor="sd-bf-ladder-l1"] .sdp-ladder-trigger')).toBeVisible();
});

test('maré · the ladder focuses one level per step', async ({ page }) => {
  await page.goto(`/system-design/mare/black-friday?step=${7 + 3}`);
  await expect(page.locator('[data-screen="mare-bf-ladder"]')).toHaveAttribute('data-active', '');
  await expect(page.locator('[data-anchor="sd-bf-ladder-l3"]')).toHaveClass(/is-focus/);
  await expect(page.locator('[data-anchor="sd-bf-ladder-l1"]')).toHaveClass(/is-dim/);
  await expect(page.locator('[data-anchor="sd-bf-ladder"]')).toContainText('Illustrative triggers');
});

test('maré · "is it worth it?" matches the content package and reacts to the sliders', async ({ page }) => {
  await page.goto('/system-design/mare/black-friday');
  const { worth } = mare;
  const start = expectedLoss({ perMinute: worth.perMinute.value, minutes: worth.minutes.value, without: worth.without.value, with: worth.with, cost: worth.cost.value });
  const out = (key: string) => page.locator(`[data-worth-out="${key}"]`);
  await expect(out('without')).toHaveText(`R$${start.without.toLocaleString('en-US')}`);
  await expect(out('with')).toHaveText(`R$${start.with.toLocaleString('en-US')}`);
  await expect(page.locator('[data-worth-verdict]')).toHaveAttribute('data-worth-verdict', 'yes');
  // Make readiness expensive and outages unlikely: the verdict flips.
  await page.locator('input[name="cost"]').fill(String(worth.cost.max));
  await page.locator('input[name="without"]').fill(String(worth.without.min));
  const flipped = expectedLoss({ perMinute: worth.perMinute.value, minutes: worth.minutes.value, without: worth.without.min, with: worth.with, cost: worth.cost.max });
  await expect(page.locator('[data-worth-verdict]')).toHaveAttribute('data-worth-verdict', 'no');
  await expect(out('without')).toHaveText(`R$${flipped.without.toLocaleString('en-US')}`);
  await expect(page.locator('[data-anchor="sd-bf-worth"]')).toContainText('Illustrative inputs');
});

test.describe('maré · the storefront demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/system-design/mare/storefront');
    await page.locator('[data-live-demo]').scrollIntoViewIfNeeded();
  });

  test('stock shows as a band, never a count, and add to bag is careful when stock is scarce', async ({ page }) => {
    const band = page.locator('[data-lv-band]');
    const add = page.locator('[data-lv-add]');
    const status = page.locator('[data-lv-status]');
    await expect(band).toHaveText('In stock');
    // Plenty left: instant.
    await add.click();
    await expect(status).toHaveText('Added to bag ✓');
    await expect(page.locator('[data-lv-bag]')).toHaveText('1');
    // Others buy until a few are left: reserve first, then confirm.
    await page.locator('[data-lv-others]').click();
    await page.locator('[data-lv-others]').click();
    await expect(band).toHaveText('In stock');
    await expect(page.locator('[data-readout="stock"]')).toHaveText('24');
    await page.locator('[data-lv-others]').click();
    await expect(band).toHaveText('Few left');
    await add.click();
    await expect(add).toHaveText('Reserving…');
    await expect(status).toHaveText('Reserved for 20 min ✓');
    await expect(page.locator('[data-lv-bag]')).toHaveText('2');
    // Sold out: the button offers to notify instead.
    await page.locator('[data-lv-others]').click();
    await page.locator('[data-lv-others]').click();
    await expect(band).toHaveText('Sold out');
    await expect(add).toHaveText('Notify me');
    await expect(page.locator('.lv-page')).not.toContainText(/\b\d+ left\b/);
  });

  test('busy levels swap extras for their twins, the line keeps the bag, and nothing moves', async ({ page }) => {
    const level = (n: number) => page.locator(`[data-lv-level="${n}"]`);
    await expect(page.locator('[data-lv-twin="personal"]')).toBeVisible();
    await page.locator('[data-lv-add]').click();
    await level(1).click();
    await expect(page.locator('[data-lv-twin="personal"]')).toBeHidden();
    await expect(page.locator('[data-lv-twin="best"]')).toBeVisible();
    await expect(page.locator('[data-lv-video]')).toHaveText('Photo only · video off');
    await level(2).click();
    await expect(page.locator('[data-lv-twin="filters-few"]')).toBeVisible();
    await level(3).click();
    await page.locator('[data-lv-checkout]').click();
    await expect(page.locator('[data-lv-status]')).toContainText('your bag stays reserved');
    await level(4).click();
    await expect(page.locator('[data-lv-banner]')).toBeVisible();
    await expect(page.locator('[data-lv-add]')).toBeEnabled();
    await expect(page.locator('[data-readout="cls"]')).toHaveText('0.000');
    await page.locator('[data-lv-reset]').click();
    await expect(page.locator('[data-lv-level="0"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-readout="stock"]')).toHaveText('45');
  });
});

test('maré · presentation runs hub → Black Friday → storefront with the arrow keys', async ({ page }) => {
  await page.goto('/system-design/mare?present=1');
  await expect(page.locator('html')).toHaveAttribute('data-present', '');
  const boards: string[] = [];
  const total = run.reduce((sum, item) => sum + item.steps, 0);
  for (let press = 0; press < total + 3; press += 1) {
    const board = await page.locator('[data-screen][data-active]').getAttribute('data-board');
    if (board && boards.at(-1) !== board) boards.push(board);
    if (new URL(page.url()).pathname === '/system-design/mare/storefront' && (await page.locator('[data-screen][data-active]').getAttribute('data-board')) === 'SD-M6') break;
    await page.keyboard.press('ArrowRight');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('html')).toHaveAttribute('data-present', '');
  }
  expect(boards).toEqual(mare.screens.map((screen) => screen.board));
  await page.goto('/system-design/mare/black-friday?present=1&step=1');
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/\/system-design\/mare\?present=1&step=3/);
});
