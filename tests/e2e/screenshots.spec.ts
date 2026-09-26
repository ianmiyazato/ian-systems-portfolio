import { test } from '@playwright/test';

const shots: Array<[string, string]> = [
  ['home', '/'], ['mare-balcao', '/mare/ops/balcao'], ['mare-product-hub', '/mare/ops/product-hub'], ['mare-pay-modal', '/mare/ops/pay?modal=decision&sub=override'], ['mare-circle', '/mare/ops/circle'], ['mare-mesh-error', '/mare/ops/mesh?state=error'], ['mare-shop', '/mare/shop'], ['atlas-board', '/atlas/pipeline/board'], ['pulse', '/pulse'], ['system-mare', '/system-design/mare']
];

for (const [name, route] of shots) {
  test(`capture ${name}`, async ({ page }) => {
    await page.goto(route);
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true });
  });
}

