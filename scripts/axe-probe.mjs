// Axe probe for one URL: prints serious/critical violations with axe's own explanation.
// node scripts/axe-probe.mjs http://127.0.0.1:3000/pulse [rule-id]
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(process.argv[2], { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const builder = new AxeBuilder({ page });
if (process.argv[3]) builder.withRules([process.argv[3]]);
const result = await builder.analyze();
for (const violation of result.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical'))
  for (const node of violation.nodes) console.log(violation.id, node.target.join(' '), '→', (node.any[0] ?? node.all[0] ?? node.none[0])?.message?.slice(0, 200));
await browser.close();
