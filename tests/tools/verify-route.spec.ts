import { expect, test } from '@playwright/test';
import { inspectRoute, watchErrors } from '../support/route-check';

// pnpm verify:route <path> [path…] → VERIFY_ROUTES="a,b" playwright test --project=verify
const targets = (process.env.VERIFY_ROUTES ?? '').split(',').map((item) => item.trim()).filter(Boolean);

for (const href of targets) {
  test(`verify ${href}`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(href);
    const result = await inspectRoute(page, href, errors);
    console.log(`${result.problems.length ? '✗' : '✓'} ${href} · h1 "${result.heading ?? '—'}"`);
    expect(result.problems, href).toEqual([]);
  });
}
