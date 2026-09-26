// Browser probe: loads routes in Chromium and fails on console errors, page errors, failed or 4xx/5xx requests.
// BASE=https://… PATHS='/ /pulse' SHOTS=dir node scripts/browser-probe.mjs
import { chromium } from '@playwright/test';
const base = process.env.BASE ?? 'https://ian-portfolio-shell.vercel.app';
const paths = (process.env.PATHS ?? '/ /mare/ops/balcao /mare/shop /pulse /atlas/pipeline').split(' ');
const shots = process.env.SHOTS;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let failures = 0;
for (const path of paths) {
  const errors = [];
  const onConsole = (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); };
  const onFail = (r) => errors.push(`failed: ${r.url()} ${r.failure()?.errorText}`);
  const onResp = (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); };
  const onPageError = (e) => errors.push(`pageerror: ${e.message}`);
  page.on('console', onConsole); page.on('requestfailed', onFail); page.on('response', onResp); page.on('pageerror', onPageError);
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(Number(process.env.WAIT ?? 600));
  if (shots) await page.screenshot({ path: `${shots}/${path.replace(/[^a-z0-9]+/gi, '_') || 'home'}.png`, fullPage: process.env.FULL === '1' });
  page.off('console', onConsole); page.off('requestfailed', onFail); page.off('response', onResp); page.off('pageerror', onPageError);
  failures += errors.length;
  console.log(`${errors.length ? '✗' : '✓'} ${path}${errors.length ? '\n   ' + errors.join('\n   ') : ''}`);
}
await browser.close();
process.exit(failures ? 1 : 0);
