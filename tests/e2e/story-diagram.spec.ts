import { expect, test, type Page } from '@playwright/test';
import { fixtureHtml } from '../support/story-fixture';

/**
 * The story engine in a real browser, on a self-contained fixture page (no app build needed):
 * keyboard and ?step= control, presentation mode, reduced motion, compositor-only animation,
 * pausing off-screen and in hidden tabs, at most three packets on focused edges, and CLS 0.
 */
const PAGE = 'http://story.test/fixture';
let html = '';

test.beforeAll(async () => {
  html = await fixtureHtml();
});

test.beforeEach(async ({ page }) => {
  await page.route('http://story.test/**', (route) => route.fulfill({ contentType: 'text/html', body: html }));
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
});

const flow = (page: Page) => page.locator('[data-screen="flow"]');
const stepParam = (page: Page) => new URL(page.url()).searchParams.get('step');
const running = (page: Page, selector: string) => page.evaluate((scope) => document.querySelector(scope)!.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length, selector);

test('arrows, Space, Home and End walk every step across screens, and the URL follows', async ({ page }) => {
  await page.goto(PAGE);
  await expect(flow(page)).toHaveAttribute('data-step', '1');
  await page.keyboard.press('ArrowRight');
  await expect(flow(page)).toHaveAttribute('data-step', '2');
  expect(stepParam(page)).toBe('2');
  await page.keyboard.press(' ');
  await expect(flow(page)).toHaveAttribute('data-step', '3');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-screen="cards"]')).toHaveAttribute('data-step', '1');
  await expect(page.locator('[data-screen="cards"]')).toHaveAttribute('data-active', '');
  expect(stepParam(page)).toBe('4');
  await page.keyboard.press('ArrowLeft');
  await expect(flow(page)).toHaveAttribute('data-step', '3');
  await page.keyboard.press('End');
  await expect(page.locator('[data-screen="cards"]')).toHaveAttribute('data-step', '2');
  expect(stepParam(page)).toBe('5');
  await page.keyboard.press('Home');
  await expect(flow(page)).toHaveAttribute('data-step', '1');
  expect(stepParam(page)).toBe('1');
});

test('each step is reachable by URL and focuses one idea', async ({ page }) => {
  await page.goto(`${PAGE}?step=3`);
  await expect(flow(page)).toHaveAttribute('data-step', '3');
  await expect(page.locator('.sd-node[data-id="store"]')).toHaveClass(/is-focus/);
  await expect(page.locator('.sd-node[data-id="source"]')).toHaveClass(/is-dim/);
  await expect(page.locator('[data-screen="flow"] [data-step-only="3"]')).toBeVisible();
  await expect(page.locator('[data-screen="flow"] [data-step-only="1"]')).toBeHidden();
  await expect.poll(() => page.locator('.sd-node[data-id="source"]').evaluate((node) => getComputedStyle(node).opacity)).toBe('0.25');
});

test('E toggles the engineering layer and P pauses every animation', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('[data-screen="flow"] [data-step-only="1"] .sd-step-eng')).toBeHidden();
  await page.keyboard.press('e');
  await expect(page.locator('html')).toHaveAttribute('data-layer', 'engineering');
  await expect(page.locator('[data-screen="flow"] [data-step-only="1"] .sd-step-eng')).toBeVisible();
  await expect(page.locator('.sd-node[data-id="check"] .sd-eng')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('layer')).toBe('engineering');
  await page.keyboard.press('e');
  await expect(page.locator('html')).not.toHaveAttribute('data-layer', 'engineering');

  await expect.poll(() => running(page, '[data-screen="flow"]')).toBeGreaterThan(0);
  await page.keyboard.press('p');
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-paused', '');
  expect(await running(page, '[data-screen="flow"]')).toBe(0);
  await page.keyboard.press('p');
  await expect.poll(() => running(page, '[data-screen="flow"]')).toBeGreaterThan(0);
});

test('presentation mode: one screen at a time, notes on N, controls hide until the mouse moves', async ({ page }) => {
  await page.goto(`${PAGE}?present=1`);
  await expect(page.locator('html')).toHaveAttribute('data-present', '');
  await expect(flow(page)).toBeVisible();
  await expect(page.locator('[data-screen="cards"]')).toBeHidden();
  const box = await flow(page).boundingBox();
  expect(Math.abs(box!.width / box!.height - 16 / 9)).toBeLessThan(0.02);
  await page.keyboard.press('n');
  await expect(page.locator('[data-screen="flow"] [data-note="1"]')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-screen="flow"] [data-note="2"]')).toBeVisible();
  await expect(page.locator('.sd-controls')).toHaveCSS('opacity', '0', { timeout: 4000 });
  await page.mouse.move(200, 200);
  await page.mouse.move(260, 240);
  await expect(page.locator('.sd-controls')).toHaveCSS('opacity', '1');
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveAttribute('data-present', '');
  await page.keyboard.press('f');
  await expect(page.locator('html')).toHaveAttribute('data-present', '');
});

test('animations only touch transform, opacity or offset-distance', async ({ page }) => {
  await page.goto(PAGE);
  for (let step = 1; step <= 5; step += 1) {
    const found = await page.evaluate(() => {
      const allowed = new Set(['transform', 'opacity', 'offset-distance', 'offsetDistance', 'none']);
      const bad: string[] = [];
      for (const animation of document.getAnimations()) {
        const effect = animation.effect as KeyframeEffect | null;
        for (const frame of effect?.getKeyframes() ?? []) for (const key of Object.keys(frame)) if (!['offset', 'computedOffset', 'easing', 'composite'].includes(key) && !allowed.has(key)) bad.push(`animation: ${key}`);
      }
      for (const element of document.querySelectorAll('[data-deck] *')) {
        const style = getComputedStyle(element);
        if (style.transitionDuration.split(',').every((value) => parseFloat(value) === 0)) continue;
        for (const property of style.transitionProperty.split(',').map((value) => value.trim())) if (!allowed.has(property)) bad.push(`transition on ${element.tagName.toLowerCase()}.${element.getAttribute('class')}: ${property}`);
      }
      return { bad: [...new Set(bad)], count: document.getAnimations().length };
    });
    expect(found.bad).toEqual([]);
    // Diagram steps always have packets moving; the card screen only fades.
    if (step <= 3) expect(found.count).toBeGreaterThan(0);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
  }
});

test('at most three packets move, only along focused edges', async ({ page }) => {
  await page.goto(`${PAGE}?step=2`);
  await page.waitForTimeout(400);
  const packets = await page.evaluate(() => {
    // Compare the number sequences: browsers may re-serialize the path string.
    const numbers = (text: string) => (text.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).join(',');
    const focused = [...document.querySelectorAll('.sd-edge.is-focus path.sd-edge-line')].map((path) => numbers(path.getAttribute('d')!));
    return [...document.querySelectorAll<SVGElement>('.sd-packet')]
      .filter((packet) => packet.getAnimations().some((animation) => animation.playState === 'running'))
      .map((packet) => ({ path: getComputedStyle(packet).offsetPath, onFocused: focused.includes(numbers(getComputedStyle(packet).offsetPath)) }));
  });
  expect(packets.length).toBeGreaterThan(0);
  expect(packets.length).toBeLessThanOrEqual(3);
  for (const packet of packets) expect(packet.onFocused, packet.path).toBe(true);
});

test('animations pause off-screen and in a hidden tab', async ({ page }) => {
  await page.goto(PAGE);
  await expect.poll(() => running(page, '[data-screen="flow"]')).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => running(page, '[data-screen="flow"]')).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => running(page, '[data-screen="flow"]')).toBeGreaterThan(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => running(page, '[data-screen="flow"]')).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => running(page, '[data-screen="flow"]')).toBeGreaterThan(0);
});

test('CLS stays 0 while loading and while steps animate', async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForTimeout(500);
  for (let step = 0; step < 4; step += 1) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(450);
  }
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBe(0);
});

test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('shows each step final state at once, with nothing hidden', async ({ page }) => {
    await page.goto(PAGE);
    for (const step of [1, 2, 3]) {
      if (step > 1) await page.keyboard.press('ArrowRight');
      expect(await running(page, '[data-deck]')).toBe(0);
      const state = await page.evaluate(() => ({
        focus: [...document.querySelectorAll('[data-screen="flow"] .is-focus')].map((node) => getComputedStyle(node).opacity),
        packets: [...document.querySelectorAll<SVGElement>('.sd-packet')].filter((packet) => getComputedStyle(packet).opacity === '1').length,
        caption: document.querySelector<HTMLElement>('[data-screen="flow"] [data-step-only]:not(.is-off)')?.innerText ?? ''
      }));
      expect(state.focus.length).toBeGreaterThan(0);
      expect(new Set(state.focus)).toEqual(new Set(['1']));
      // Direction is still shown: packets rest on the focused edges instead of moving.
      expect(state.packets).toBeGreaterThan(0);
      expect(state.caption.length).toBeGreaterThan(10);
    }
  });
});
