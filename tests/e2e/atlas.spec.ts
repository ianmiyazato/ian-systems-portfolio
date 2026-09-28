import { expect, test } from '@playwright/test';

test.describe('Atlas', () => {
  test('logging a passed outcome moves the card to Onsite', async ({ page }) => {
    await page.goto('/atlas/pipeline/board?drawer=parallax-pay&sub=log-outcome');
    await expect(page.getByRole('dialog')).toHaveCount(2);
    await page.getByRole('button', { name: 'Save and move to Onsite' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('section[aria-labelledby="col-onsite"]')).toContainText('Parallax Pay');
  });

  test('upgrading in checkout updates the plan badge in another tab', async ({ context }) => {
    const [first, second] = [await context.newPage(), await context.newPage()];
    await first.goto('/atlas/academy/designing-for-10x?modal=paywall&sub=checkout');
    await second.goto('/atlas/pipeline');
    await first.getByRole('button', { name: 'Start free week' }).click();
    await expect(first.getByText('You’re Pro')).toBeVisible();
    await expect(second.locator('.at-plan')).toHaveText('Pro');
  });

  test('adding a cache node makes the interviewer ask a follow-up', async ({ page }) => {
    await page.goto('/atlas/arena/session/14');
    await page.getByRole('button', { name: 'Add cache node' }).click();
    await expect(page.locator('.at-wb-node.new')).toHaveText('Redis · balance cache');
    await expect(page.locator('.at-transcript')).toContainText('reversed', { timeout: 8000 });
  });

  test('a rubric row opens the transcript at the cited timestamp', async ({ page }) => {
    await page.goto('/atlas/arena/sessions/14');
    await page.getByRole('button', { name: /Estimation/ }).click();
    await expect(page).toHaveURL(/drawer=transcript&t=31%3A30|drawer=transcript&t=31:30/);
    await expect(page.locator('.at-transcript li.cited')).toContainText('keep everything forever');
  });

  test('checkout failure explains the fix', async ({ page }) => {
    await page.goto('/atlas/academy/designing-for-10x?modal=paywall&sub=checkout&state=checkout-failed');
    await page.getByRole('button', { name: 'Start free week' }).click();
    await expect(page.locator('[data-anchor="at-checkout-failed"]')).toContainText('Try Pix');
  });

  test('academy browse: billboard, personalized art, continue watching and top 5', async ({ page }) => {
    await page.goto('/atlas/academy');
    await expect(page.getByRole('heading', { level: 1, name: 'Payments at scale' })).toBeVisible();
    await expect(page.getByText('New series · 6 episodes')).toBeVisible();
    const myList = page.getByRole('button', { name: '+ My list' });
    await myList.click();
    await expect(page.getByRole('button', { name: '✓ In my list' })).toHaveAttribute('aria-pressed', 'true');
    // Artwork follows the weakest rubric area, and the member can see and change why.
    const continueRow = page.locator('[data-anchor="ab-continue"]');
    await expect(continueRow.getByRole('img', { name: /Designing for 10×: artwork emphasizing numbers on the diagram/ })).toBeVisible();
    await page.getByRole('button', { name: 'Failure modes' }).click();
    await expect(continueRow.getByRole('img', { name: /Designing for 10×: artwork emphasizing where it breaks/ })).toBeVisible();
    // Focus expands a card at once and offers the matching Arena drill.
    const card = continueRow.locator('.ab-card').nth(1);
    await card.getByRole('link', { name: /Caching that stays correct, 12% watched/ }).focus();
    await expect(card).toHaveClass(/is-expanded/);
    await page.keyboard.press('Tab');
    await expect(card.getByRole('link', { name: 'Resume', exact: true })).toBeFocused();
    await expect(card.getByRole('link', { name: 'Practice in Arena' })).toHaveAttribute('href', /prompt=lru-cache/);
    await expect(page.getByRole('link', { name: /Number 1: Payments at scale/ })).toBeVisible();
  });

  test('practice mix: play, keep playing across pages, shuffle by weakness, why drawer', async ({ page }) => {
    await page.goto('/atlas/arena/mix/today?t=16:18');
    await expect(page.getByRole('heading', { level: 1, name: 'Interview Mix · Tuesday' })).toBeVisible();
    await page.getByRole('button', { name: 'Play mix' }).click();
    const bar = page.getByRole('region', { name: 'Now playing' });
    await expect(bar.getByText('Estimate storage for a payments ledger')).toBeVisible();
    await expect(page.locator('.mx-row.is-current').getByLabel('Playing')).toBeVisible();
    // The player lives in the layout: it keeps going on another Atlas page.
    await page.getByRole('navigation', { name: 'Atlas' }).getByRole('link', { name: 'Pipeline' }).click();
    await expect(page).toHaveURL(/\/atlas\/pipeline/);
    await expect(bar.getByRole('button', { name: 'Pause' })).toBeVisible();
    await bar.getByRole('button', { name: 'Next' }).click();
    await expect(bar.getByText('Designing for 10×')).toBeVisible();
    await bar.getByRole('link', { name: 'Open Interview Mix · Tuesday' }).click();
    await page.getByRole('button', { name: 'Shuffle by weakness' }).click();
    await expect(page.locator('.mx-table [data-row]').nth(1)).toHaveAttribute('data-row', 'fanout-envelope');
    await page.getByRole('button', { name: 'You liked it on Sunday' }).click();
    const drawer = page.getByRole('dialog', { name: 'Caching that stays correct' });
    await drawer.getByRole('button', { name: 'Remove from this mix' }).click();
    await expect(page.locator('[data-row="caching-correct"]')).toHaveCount(0);
  });

  test('practice mix reacts to the pipeline and has a first-run state', async ({ page }) => {
    await page.goto('/atlas/arena/mix/today?t=16:40&live=paused');
    await expect(page.locator('[data-row="orbital-screen"]').getByText('New')).toBeVisible();
    await page.goto('/atlas/arena/mix/today?state=empty');
    await expect(page.getByRole('heading', { name: 'No mix yet' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start the baseline' })).toBeVisible();
  });

  test('wrapped: story cards, pause, and a privacy-safe share image', async ({ page }) => {
    await page.goto('/atlas/wrapped');
    await expect(page.getByRole('heading', { level: 2, name: 'You practiced 33 times.' })).toBeVisible();
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('button', { name: 'Next card' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Behavioral, 84/100.' })).toBeVisible();
    for (let step = 0; step < 3; step += 1) await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'Share your recap' }).click();
    const share = page.getByRole('dialog', { name: 'Share your recap' });
    await expect(share.getByRole('link', { name: 'Download image' })).toHaveAttribute('download', 'atlas-wrapped-2026.png');
    await expect(share.getByText('Company names are left out')).toBeVisible();
  });

  test('wrapped with fewer than five sessions is an encouraging mini-recap', async ({ page }) => {
    await page.goto('/atlas/wrapped?state=empty');
    await expect(page.getByRole('heading', { level: 2, name: 'You started.' })).toBeVisible();
    await expect(page.getByText('1 / 3')).toBeVisible();
  });

  test('offer wallet: private by default, FX scenario, and accept archives the rest', async ({ page }) => {
    await page.goto('/atlas/offers');
    const kite = page.locator('[data-anchor="of-card"]');
    await expect(kite.getByText('amount hidden')).toBeAttached();
    await page.getByRole('button', { name: 'Show amounts' }).click();
    await expect(kite.getByText('R$43,167')).toBeVisible();
    await expect(page.getByText(/the USD contract nets R\$[\d,]+ more a month/)).toBeVisible();
    await page.getByRole('slider').fill('4.9');
    await expect(page.getByText(/the USD contract nets R\$[\d,]+ less a month/)).toBeVisible();
    await page.getByRole('button', { name: 'Show me the break-even' }).click();
    await expect(page.getByText('R$5.03', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Accept offer' }).click();
    await page.getByRole('button', { name: 'Confirm with Face ID' }).click();
    const sheet = page.getByRole('dialog', { name: 'You accepted Kite Robotics' });
    await expect(sheet.getByText('5 processes archived, notes queued:')).toBeVisible();
    await sheet.getByRole('link', { name: 'Open the board' }).click();
    await expect(page.getByText('5 processes archived after you accepted an offer')).toBeVisible();
    await expect(page.locator('.at-board').getByText('Parallax Pay')).toHaveCount(0);
    await expect(page.locator('.at-board').getByText('Accepted · contract review Mon 10:00')).toBeVisible();
  });

  test('offer wallet: an offer expiring tonight counts down on the world clock', async ({ page }) => {
    await page.goto('/atlas/offers?state=expiring&t=16:18&live=paused');
    await expect(page.getByText('Expires in 5 h 42 min · 22:00')).toBeVisible();
    await page.goto('/atlas/pipeline?state=expiring');
    await expect(page.getByRole('link', { name: 'open the offer wallet' })).toBeVisible();
  });

  test('live mock: request, match with an ETA, message, cancel', async ({ page }) => {
    await page.goto('/atlas/mentors/live?t=16:18&live=paused');
    await expect(page.getByText('8 mentors online · 16:18 in São Paulo')).toBeVisible();
    await expect(page.getByText('Demand is high · 1.2×')).toBeVisible();
    await page.getByRole('button', { name: 'Find a mentor' }).click();
    const sheet = page.getByRole('dialog', { name: 'Matched with Priya' });
    await expect(sheet.getByText('4 min')).toBeVisible();
    await expect(page).toHaveURL(/match=priya/);
    await sheet.getByRole('button', { name: 'Message' }).click();
    await sheet.getByRole('button', { name: 'Can we focus on estimation?' }).click();
    await expect(sheet.getByText('Sent: “Can we focus on estimation?”')).toBeVisible();
    await sheet.getByRole('button', { name: 'Cancel' }).click();
    await expect(sheet).toBeHidden();
  });

  test('live mock: a canceled mentor is rematched, and no supply means a waitlist', async ({ page }) => {
    await page.goto('/atlas/mentors/live?state=error');
    await page.getByRole('button', { name: 'Find a mentor' }).click();
    await expect(page.getByText('Priya had to cancel. Rematching you now, no credits used.')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Matched with Sam' })).toBeVisible({ timeout: 8000 });
    await page.goto('/atlas/mentors/live?state=empty');
    await page.getByRole('button', { name: 'Find a mentor' }).click();
    await expect(page.getByRole('dialog', { name: 'No mentor free right now' })).toBeVisible();
  });
});
