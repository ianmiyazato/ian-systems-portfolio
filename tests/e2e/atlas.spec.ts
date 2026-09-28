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
    await expect(card.getByRole('link', { name: 'Practice in Arena' })).toHaveAttribute('href', /prompt=cache-invalidation/);
    await expect(page.getByRole('link', { name: /Number 1: Payments at scale/ })).toBeVisible();
  });
});
