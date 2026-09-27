// Lighthouse (default mobile config, simulated throttling), median of N runs. Free tier: it runs
// against the local production build (all four zones behind the shell on :3000), never previews.
// Chromium comes from Playwright and is driven over its debugging port, which also works on WSL
// where chrome-launcher would try to use a Windows temp directory.
//   pnpm build && pnpm lighthouse          # local production build
//   LHCI_BASE=https://… RUNS=3 node scripts/lighthouse.mjs   # an existing deployment
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { ensureServers } from './lib/servers.mjs';

const base = process.env.LHCI_BASE ?? 'http://127.0.0.1:3000';
const stopServers = process.env.LHCI_BASE ? () => {} : await ensureServers();
const runs = Number(process.env.RUNS ?? 3);
const paths = (process.env.PATHS ?? '/ /work/mare /mare/shop /mare/ops/balcao /pulse').split(' ');
const port = 9333;
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
mkdirSync('.lighthouseci', { recursive: true });

const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
const median = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
const results = [];
for (const path of paths) {
  const scores = Object.fromEntries(categories.map((category) => [category, []]));
  let lcp = [];
  for (let run = 0; run < runs; run += 1) {
    const result = await lighthouse(`${base}${path}`, { port, output: 'json', logLevel: 'error', onlyCategories: categories });
    for (const category of categories) scores[category].push(Math.round((result.lhr.categories[category]?.score ?? 0) * 100));
    lcp.push(result.lhr.audits['largest-contentful-paint'].numericValue);
    if (run === 0) writeFileSync(`.lighthouseci/${path.replace(/\W+/g, '_') || 'home'}.json`, result.report);
  }
  const row = { path, ...Object.fromEntries(categories.map((category) => [category, median(scores[category])])), lcpMs: Math.round(median(lcp)) };
  results.push(row);
  console.log(JSON.stringify(row));
}
await browser.close();
writeFileSync('.lighthouseci/summary.json', JSON.stringify({ base, runs, measuredAt: new Date().toISOString(), results }, null, 2));
stopServers();
