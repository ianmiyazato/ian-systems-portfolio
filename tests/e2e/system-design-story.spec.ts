import { expect, test, type Page } from '@playwright/test';
import { findJargon } from '../../packages/story-diagram/src/jargon';
import { buildVsBuy } from '../../packages/system-design/src/build-vs-buy';
import { presentationSequence } from '../../packages/system-design/src/deck';
import { routes } from '../../packages/routes/src/index';
import { watchErrors } from '../support/route-check';

/**
 * The system design story pages (static Astro, served under /system-design through the shell):
 * every step URL renders with zero console errors, cards match their JSON, the AI surface is
 * honest, and the plain layer carries no jargon.
 */
const story = presentationSequence().filter((page) => routes.some((route) => route.href === page.href));
const heading = (href: string) => routes.find((route) => route.href === href)!.heading;

async function cls(page: Page) {
  return page.evaluate(() => new Promise<number>((resolve) => {
    let total = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) total += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 300);
  }));
}

for (const { href, steps } of story) {
  test(`story · ${href} · every step loads cleanly`, async ({ page }) => {
    for (let step = 1; step <= steps; step += 1) {
      const errors = watchErrors(page);
      await page.goto(`${href}?step=${step}`);
      await expect(page.locator('.im-footer')).toContainText('All names are fictitious');
      await expect(page.getByRole('heading', { level: 1 })).toContainText(heading(href));
      await expect(page.locator('[data-screen][data-active]')).toHaveCount(1);
      expect(new URL(page.url()).searchParams.get('step') ?? String(step)).toBe(String(step));
      expect(errors, `${href}?step=${step}`).toEqual([]);
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
    }
  });

  test(`story · ${href} · CLS stays 0 while loading and stepping`, async ({ page }) => {
    await page.goto(href);
    await page.waitForLoadState('networkidle');
    for (let step = 1; step < Math.min(steps, 4); step += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
    }
    expect(await cls(page)).toBe(0);
  });
}

test('story · keys walk the Problem A flow and the URL follows', async ({ page }) => {
  await page.goto('/system-design/metrics-to-decisions');
  const flow = page.locator('[data-screen="a-flow"]');
  await expect(flow).toHaveAttribute('data-step', '1');
  await page.keyboard.press('ArrowRight');
  await expect(flow).toHaveAttribute('data-step', '2');
  await expect(page.locator('.sd-node[data-id="check"]')).toHaveClass(/is-focus/);
  await page.keyboard.press('End');
  await expect(page.locator('[data-screen="a-report"]')).toHaveAttribute('data-active', '');
  await page.keyboard.press('Home');
  await expect(flow).toHaveAttribute('data-step', '1');
  await page.keyboard.press('e');
  await expect(page.locator('[data-screen="a-flow"] [data-step-only="1"] .sd-step-eng')).toContainText('object storage');
});

test('story · the Problem A plain layer has no jargon', async ({ page }) => {
  await page.goto('/system-design/metrics-to-decisions');
  const text = await page.locator('[data-screen="a-flow"], [data-screen="a-report"]').evaluateAll((screens) => screens.map((screen) => {
    const clone = screen.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.sd-eng, .sd-step-eng, [data-eng-only], .sd-notes, title, desc').forEach((node) => node.remove());
    return clone.textContent ?? '';
  }).join(' '));
  expect(findJargon(text)).toEqual([]);
});

test('story · the morning report is a simulated AI surface with sources and a human approval', async ({ page }) => {
  await page.goto('/system-design/metrics-to-decisions?step=6');
  const report = page.locator('[data-anchor="sd-report-card"]');
  await expect(report).toContainText('Revenue in São Paulo stores is 12% below a normal Monday since 14:00');
  await expect(report).toContainText('Simulated AI');
  await expect(report.getByText('Card terminal status, per store')).toBeAttached();
  await expect(report).toContainText('Likely cause: card terminals failing at 3 stores since 13:52.');
  await report.getByRole('button', { name: /Approve/ }).click();
  await expect(report).toContainText('Approved by you');
});

test('story · the chart line draws itself, and reduced motion shows it whole at once', async ({ page }) => {
  await page.goto('/system-design/metrics-to-decisions?step=6');
  const wipe = page.locator('[data-chart-wipe]');
  await expect.poll(() => wipe.evaluate((node) => node.getAnimations().length)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/system-design/metrics-to-decisions?step=6');
  expect(await wipe.evaluate((node) => node.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
  const box = await wipe.boundingBox();
  const chart = await page.locator('[data-anchor="sd-report-chart"] svg').boundingBox();
  expect(box!.width).toBeGreaterThan(chart!.width * 0.8);
});

for (const [name, table] of Object.entries(buildVsBuy)) {
  const href = name === 'metrics' ? '/system-design/metrics-to-decisions/build-or-buy' : '/system-design/personal-and-instant/build-or-buy';
  test(`story · ${href} · the cards match ${name}.json`, async ({ page }) => {
    test.skip(!routes.some((route) => route.href === href), 'not built yet');
    await page.goto(href);
    const cards = page.locator('[data-row]');
    await expect(cards).toHaveCount(table.rows.length);
    for (const row of table.rows) {
      const card = page.locator(`[data-row="${row.id}"]`);
      await expect(card.locator('[data-field="component"]')).toHaveText(row.component);
      await expect(card.locator('[data-field="decision"]')).toHaveText(row.decision);
      await expect(card.locator('[data-field="why"]')).toHaveText(row.why);
      await expect(card.locator('[data-field="giveUp"]')).toHaveText(row.giveUp);
      await expect(card.locator('[data-field="swapPlan"]')).toHaveText(row.swapPlan);
      await expect(card.locator('[data-field="costAt10x"]')).toHaveText(row.costAt10x);
      await expect(card.locator('[data-field="swapPlan"]')).toBeHidden();
    }
    await page.keyboard.press('e');
    await expect(page.locator(`[data-row="${table.rows[0]!.id}"] [data-field="swapPlan"]`)).toBeVisible();
  });
}

test.describe('Problem B · speed', () => {
  test.skip(!routes.some((route) => route.href === '/system-design/personal-and-instant'), 'not built yet');

  test('the race plays both lanes on one clock, and reduced motion shows the finish', async ({ page }) => {
    await page.goto('/system-design/personal-and-instant?step=5');
    const race = page.locator('[data-anchor="sd-race"]');
    await expect.poll(() => race.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBeGreaterThan(4);
    await expect(race).toContainText('4.8 s of blank screen');
    await expect(race).toContainText('Useful at 0.6 s');
    await expect(page.locator('[data-anchor="sd-race-label"]')).toContainText('Illustrative targets');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/system-design/personal-and-instant?step=5');
    expect(await race.evaluate((node) => node.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length)).toBe(0);
    const scale = await page.locator('[data-race-segment]').first().evaluate((node) => getComputedStyle(node).transform);
    expect(scale === 'none' || scale.startsWith('matrix(1, 0, 0, 1')).toBe(true);
  });

  test('the demo pages 2,000 products, draws about 20 rows and falls back when the AI is slow', async ({ page }) => {
    await page.goto('/system-design/personal-and-instant?step=8&ai=1300');
    const demo = page.locator('[data-anchor="sd-demo"]');
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('[data-readout="first"]')).toHaveText(/\d+ ms/);
    await expect(demo.locator('[data-readout="memory"]')).toHaveText('24');
    const drawn = Number(await demo.locator('[data-readout="rows"]').textContent());
    expect(drawn).toBeGreaterThan(8);
    expect(drawn).toBeLessThanOrEqual(24);
    await expect(demo.locator('[data-picks]')).toContainText('Bestsellers in your size', { timeout: 3000 });
    await expect(demo.locator('[data-readout="ai"]')).toContainText('fallback', { timeout: 3000 });
    const slot = await demo.locator('[data-picks]').boundingBox();
    await page.waitForTimeout(900);
    expect((await demo.locator('[data-picks]').boundingBox())!.height).toBe(slot!.height);
    const list = demo.locator('[data-demo-list]');
    for (let index = 0; index < 6; index += 1) await list.evaluate((node) => node.scrollBy(0, 900));
    await expect.poll(async () => Number(await demo.locator('[data-readout="memory"]').textContent())).toBeGreaterThan(24);
    expect(await demo.locator('[data-demo-row]').count()).toBeLessThanOrEqual(24);
    await expect(demo.locator('[data-readout="cls"]')).toHaveText('0.000');
  });

  test('a fast AI fills the reserved slot with picks, without moving anything', async ({ page }) => {
    await page.goto('/system-design/personal-and-instant?step=8&ai=300');
    const demo = page.locator('[data-anchor="sd-demo"]');
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('[data-picks]')).toContainText('Picked for you', { timeout: 3000 });
    await expect(demo.locator('[data-readout="ai"]')).toContainText('300 ms');
    await expect(demo.locator('[data-readout="cls"]')).toHaveText('0.000');
  });
});
