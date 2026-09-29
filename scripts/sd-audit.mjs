// System design audit: the M0/M5 defect list, measured in Playwright Chromium (the Chrome
// DevTools MCP fallback: this sandbox has no Chrome stable). For every path it records
// screenshots at 1440 × 900 and 1920 × 1080, a 10-second performance trace while the diagram
// animates and steps, console errors, axe, CLS, text sizes, overlaps, colors, jargon, motion
// while off-screen or hidden, and the reduced-motion result.
//
//   LABEL=v1 PATHS=/system-design/mare,/system-design/atlas node scripts/sd-audit.mjs
//
// Writes docs/audit/<LABEL>.json and docs/audit/img/<LABEL>-<slug>-<width>.png. Traces go to
// TRACE_DIR (default: the OS temp dir) because they are large; only their numbers are kept.
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import { baseUrl, ensureServers, root } from './lib/servers.mjs';

const label = process.env.LABEL ?? 'audit';
const paths = (process.env.PATHS ?? '/system-design/mare,/system-design/mare/request-path,/system-design/atlas,/system-design/pulse').split(',');
const traceDir = process.env.TRACE_DIR ?? tmpdir();
const imgDir = join(root, 'docs/audit/img');
mkdirSync(imgDir, { recursive: true });

// Words a non-technical founder would stop on. The story engine's lint uses the same list.
const jargon = ['kafka', 'idempot', 'cdc', 'embedding', 'vector', 'schema', 'sql', 'partition', 'microservice', 'api', 'latency', 'p95', 'dlq', 'bff', 'otel', 'opentelemetry', 'rag', 'circuit', 'autoscale', 'canonical', 'ncm', 'etl', 'shard', 'replica', 'throughput', 'saturation', 'middleware', 'queue', 'topic', 'consumer', 'backpressure', 'idempotency', 'rate-limit', 'rate limit', 'webhook', 'edge'];
const DIAGRAM = '[data-diagram], .rp-canvas, .sd-canvas';
const NEXT = '[data-step-next], .sd-aside .btn.primary';

const stop = await ensureServers();
const browser = await chromium.launch();
const results = [];

async function measure(path) {
  const slug = path.replace(/^\/|\/$/g, '').replace(/[/?=&]+/g, '-') || 'index';
  const result = { path, slug, consoleErrors: [], screenshots: [] };
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    window.__cls = 0;
    window.__longTasks = [];
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__longTasks.push(Math.round(entry.duration)); }).observe({ type: 'longtask', buffered: true });
  });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') result.consoleErrors.push(message.text().slice(0, 200)); });
  page.on('pageerror', (error) => result.consoleErrors.push(error.message.slice(0, 200)));
  await page.goto(baseUrl + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  result.clsAfterLoad = await page.evaluate(() => Math.round(window.__cls * 1000) / 1000);

  // Static structure of the diagram.
  result.diagram = await page.evaluate(({ selector, words }) => {
    const host = document.querySelector(selector);
    if (!host) return { found: false };
    const svg = host.querySelector('svg');
    const texts = [...host.querySelectorAll('text, strong, small, span, p')].filter((node) => node.getBoundingClientRect().width > 0 && (node.textContent ?? '').trim());
    const leafTexts = texts.filter((node) => !texts.some((other) => other !== node && node.contains(other)));
    const sizes = leafTexts.map((node) => {
      const font = parseFloat(getComputedStyle(node).fontSize);
      const ctm = node instanceof SVGGraphicsElement ? node.getScreenCTM() : null;
      return Math.round(font * (ctm ? Math.hypot(ctm.a, ctm.b) : 1) * 10) / 10;
    });
    const rects = leafTexts.map((node) => node.getBoundingClientRect());
    let overlaps = 0;
    const overlapSamples = [];
    for (let i = 0; i < rects.length; i += 1) for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i]; const b = rects[j];
      const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 2 && y > 2) { overlaps += 1; if (overlapSamples.length < 5) overlapSamples.push(`${leafTexts[i].textContent.trim().slice(0, 24)} × ${leafTexts[j].textContent.trim().slice(0, 24)}`); }
    }
    const colors = new Set();
    for (const node of host.querySelectorAll('*')) {
      const style = getComputedStyle(node);
      for (const value of [style.fill, style.stroke, style.borderTopColor, style.backgroundColor]) {
        const match = value?.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
        if (!match || (match[4] !== undefined && Number(match[4]) < 0.2)) continue;
        const [r, g, b] = match.slice(1, 4).map(Number);
        const spread = Math.max(r, g, b) - Math.min(r, g, b);
        if (spread > 40) colors.add(`${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`); // chromatic, bucketed
      }
    }
    const plain = (host.closest('main') ?? document.body).innerText.toLowerCase();
    const found = words.filter((word) => new RegExp(`\\b${word.replace(/[-\s]/g, '[-\\s]')}`, 'i').test(plain));
    return {
      found: true,
      viewBox: svg?.getAttribute('viewBox') ?? null,
      svgCount: host.querySelectorAll('svg').length,
      textNodes: leafTexts.length,
      minText: sizes.length ? Math.min(...sizes) : null,
      under14: sizes.filter((size) => size < 14).length,
      under16: sizes.filter((size) => size < 16).length,
      overlaps,
      overlapSamples,
      chromaticColors: colors.size,
      jargon: found,
      legend: Boolean(host.closest('main')?.querySelector('.legend, [data-legend]'))
    };
  }, { selector: DIAGRAM, words: jargon });

  // Screenshots at both sizes, top of the page (what a shared screen shows first).
  for (const [width, height] of [[1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(500);
    const file = `${label}-${slug}-${width}.png`;
    await page.screenshot({ path: join(imgDir, file) });
    result.screenshots.push(`img/${file}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator(DIAGRAM).first().scrollIntoViewIfNeeded().catch(() => undefined);
  // Advance two steps so the replay has lit edges (most diagrams start before the first hop).
  for (let index = 0; index < 2; index += 1) {
    await page.locator(NEXT).first().click({ timeout: 1000 }).catch(() => undefined);
    await page.waitForTimeout(400);
  }

  // Packet paths: sample every moving circle each frame; a packet that jumps more than 60 px
  // between frames (loop restart, re-render, drift) is a visible discontinuity.
  result.packets = await page.evaluate(async (selector) => {
    const host = document.querySelector(selector);
    if (!host) return null;
    const last = new Map();
    let maxJump = 0; let jumps = 0; let maxConcurrent = 0;
    const end = performance.now() + 3000;
    while (performance.now() < end) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const moving = [...host.querySelectorAll('circle, [data-packet]')].filter((node) => node.getAnimations().some((animation) => animation.playState === 'running'));
      maxConcurrent = Math.max(maxConcurrent, moving.length);
      for (const node of moving) {
        const box = node.getBoundingClientRect();
        const point = [box.x + box.width / 2, box.y + box.height / 2];
        const previous = last.get(node);
        if (previous) {
          const distance = Math.hypot(point[0] - previous[0], point[1] - previous[1]);
          maxJump = Math.max(maxJump, distance);
          if (distance > 60) jumps += 1;
        }
        last.set(node, point);
      }
    }
    return { maxConcurrent, maxJumpPx: Math.round(maxJump), jumps };
  }, DIAGRAM);

  // Everything that animates at once (focus of attention), and whether the page mutates the DOM
  // per frame (React state driving motion).
  result.motion = await page.evaluate(async (selector) => {
    const host = document.querySelector(selector) ?? document.body;
    let mutations = 0;
    const observer = new MutationObserver((list) => { mutations += list.length; });
    observer.observe(host, { subtree: true, childList: true, attributes: true, characterData: true });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    observer.disconnect();
    const running = host.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running');
    const props = new Set();
    for (const animation of running) for (const frame of animation.effect?.getKeyframes?.() ?? []) for (const key of Object.keys(frame)) if (!['offset', 'easing', 'composite', 'computedOffset'].includes(key)) props.add(key);
    return { runningAnimations: running.length, animatedProperties: [...props], domMutationsPerSecond: Math.round(mutations / 2) };
  }, DIAGRAM);

  // 10-second trace while stepping every 2.5 s.
  const tracePath = join(traceDir, `${label}-${slug}.trace.json`);
  await browser.startTracing(page, { path: tracePath, categories: ['toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'blink.user_timing'] });
  const frameStats = page.evaluate(async () => {
    const gaps = [];
    let previous = performance.now();
    const end = previous + 10_000;
    while (performance.now() < end) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const now = performance.now();
      gaps.push(now - previous);
      previous = now;
    }
    const long = gaps.filter((gap) => gap > 25).length;
    return { frames: gaps.length, fps: Math.round(gaps.length / 10), droppedFrames: long, worstFrameMs: Math.round(Math.max(...gaps)) };
  });
  for (let index = 0; index < 4; index += 1) {
    await page.waitForTimeout(2500);
    await page.locator(NEXT).first().click({ timeout: 1000 }).catch(() => undefined);
  }
  result.frames = await frameStats;
  const buffer = await browser.stopTracing();
  const trace = JSON.parse(buffer.toString());
  const events = trace.traceEvents ?? trace;
  const mainThreads = new Set(events.filter((event) => event.name === 'thread_name' && event.args?.name === 'CrRendererMain').map((event) => `${event.pid}:${event.tid}`));
  const tasks = events.filter((event) => /RunTask$/.test(event.name) && mainThreads.has(`${event.pid}:${event.tid}`) && event.dur);
  const longTasks = tasks.filter((event) => event.dur > 50_000).map((event) => Math.round(event.dur / 1000));
  result.trace = { file: tracePath, tasks: tasks.length, longTasksOver50ms: longTasks.length, longestTaskMs: tasks.length ? Math.round(Math.max(...tasks.map((event) => event.dur)) / 1000) : 0, observerLongTasks: await page.evaluate(() => window.__longTasks) };
  result.clsAfterSteps = await page.evaluate(() => Math.round(window.__cls * 1000) / 1000);

  // Off-screen and hidden-tab behavior: count animations still running inside the diagram.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.evaluate(() => document.body.style.setProperty('padding-bottom', '3000px'));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  result.offscreenRunning = await page.evaluate((selector) => {
    const host = document.querySelector(selector);
    if (!host) return null;
    const box = host.getBoundingClientRect();
    return { visible: box.bottom > 0 && box.top < innerHeight, running: host.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length };
  }, DIAGRAM);
  await page.evaluate(() => { document.body.style.removeProperty('padding-bottom'); window.scrollTo(0, 0); });
  await page.locator(DIAGRAM).first().scrollIntoViewIfNeeded().catch(() => undefined);
  const session = await context.newCDPSession(page);
  await session.send('Page.setWebLifecycleState', { state: 'frozen' }).catch(() => undefined);
  await session.send('Page.setWebLifecycleState', { state: 'active' }).catch(() => undefined);
  result.hiddenRunning = await page.evaluate(async (selector) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 300));
    const host = document.querySelector(selector);
    return host ? host.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length : null;
  }, DIAGRAM);

  // Axe (WCAG 2.1 A/AA), on a fresh load.
  await page.goto(baseUrl + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  result.axe = axe.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical').map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes.length }));
  await context.close();

  // Reduced motion: what still moves, and whether the diagram still says everything.
  const reduced = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(baseUrl + path, { waitUntil: 'networkidle' });
  await reducedPage.waitForTimeout(1000);
  result.reducedMotion = await reducedPage.evaluate((selector) => {
    const host = document.querySelector(selector) ?? document.body;
    const running = host.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running' && (animation.effect?.getTiming?.().duration ?? 0) > 20);
    return { running: running.length, textLength: host.innerText?.length ?? host.textContent.length };
  }, DIAGRAM);
  const file = `${label}-${slug}-reduced.png`;
  await reducedPage.screenshot({ path: join(imgDir, file) });
  result.screenshots.push(`img/${file}`);
  await reduced.close();
  return result;
}

try {
  for (const path of paths) {
    process.stdout.write(`${path} … `);
    const result = await measure(path);
    results.push(result);
    console.log(`long tasks ${result.trace.longTasksOver50ms}, CLS ${result.clsAfterSteps}, axe ${result.axe.length}, min text ${result.diagram.minText}px`);
  }
} finally {
  await browser.close();
  stop();
}
writeFileSync(join(root, `docs/audit/${label}.json`), `${JSON.stringify(results, null, 2)}\n`);
console.log(`wrote docs/audit/${label}.json`);
