import { expect, type Page } from '@playwright/test';
import { resolveScreen } from '../../packages/routes/src/index';

export const footer = 'All names are fictitious';

/** Collects console errors and uncaught exceptions from the moment it is attached. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

export type RouteProblems = { href: string; heading: string | null; problems: string[] };

/**
 * The crawler's definition of a healthy screen: the footer rendered, the main region is not
 * blank, no remote error boundary or designed not-found is showing, and the <h1> contains the
 * manifest heading (when the route is in the manifest).
 */
export async function inspectRoute(page: Page, href: string, errors: string[], heading?: string): Promise<RouteProblems> {
  await expect(page.locator('.im-footer')).toContainText(footer, { timeout: 20_000 });
  await page.waitForLoadState('networkidle');
  // Judge the page the browser ended on: legacy links (?view=, /balcao) redirect first.
  const landed = new URL(page.url());
  const expected = heading ?? resolveScreen(landed.pathname, landed.search)?.heading;
  await page.waitForFunction(() => !document.querySelector('[data-remote-status="loading"]'), undefined, { timeout: 15_000 }).catch(() => undefined);
  const snapshot = await page.evaluate(() => {
    const main = document.querySelector('main') ?? document.body;
    return {
      h1: [...document.querySelectorAll('h1')].map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '').join(' | '),
      text: (main as HTMLElement).innerText.trim().length,
      boundary: document.querySelectorAll('[data-remote-status="error"], nextjs-portal, #__next_error__').length,
      notFound: document.querySelectorAll('[data-not-found]').length
    };
  });
  const problems: string[] = [];
  if (snapshot.text < 40) problems.push(`main region is blank (${snapshot.text} characters)`);
  if (snapshot.boundary) problems.push('an error boundary is showing');
  if (snapshot.notFound) problems.push('the designed not-found state is showing');
  if (!snapshot.h1) problems.push('no <h1>');
  else if (expected && !snapshot.h1.toLowerCase().includes(expected.toLowerCase())) problems.push(`<h1> "${snapshot.h1}" does not contain "${expected}"`);
  problems.push(...errors);
  return { href, heading: snapshot.h1 || null, problems };
}
