import { expect, test } from '@playwright/test';

test.describe('Maré Shop', () => {
  test('site hero, AI stylist results and bag drawer', async ({ page }) => {
    await page.goto('/mare/shop');
    await expect(page.getByRole('heading', { name: /Linen, sun/ })).toBeVisible();
    await expect(page.locator('.cs-card')).toHaveCount(6);
    await page.getByRole('link', { name: /Describe a look/ }).click();
    await expect(page).toHaveURL(/ask=/);
    await expect(page.locator('.cs-match')).toHaveCount(4);
    await page.getByRole('link', { name: /Bag/ }).click();
    await expect(page.getByRole('dialog', { name: 'Your bag' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Your bag' })).toBeHidden();
  });

  test('product page shows sizes, store stock and installments', async ({ page }) => {
    await page.goto('/mare/shop/p/natural-linen-shirt');
    await expect(page).toHaveURL(/\/mare\/shop\/products\/natural-linen-shirt$/);
    await expect(page.getByText('3× R$83.00 interest-free with Maré Pay')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'XS' })).toBeDisabled();
    await expect(page.getByText('2 left · pickup today by 18:00')).toBeVisible();
  });

  test('the PDP answers fit, delivery and bundle questions before Add to bag', async ({ page }) => {
    await page.goto('/mare/shop/products/linen-midi-dress?t=16:18&live=paused');
    await expect(page.getByRole('heading', { level: 1, name: 'Linen midi dress' })).toBeVisible();
    // M is sold out (dashed, announced), so the page preselects S and says why.
    await expect(page.getByRole('radio', { name: /^M\s*, sold out/ })).toBeDisabled();
    await expect(page.getByRole('radio', { name: 'S', exact: true })).toBeChecked();
    await expect(page.getByText(/Runs large · \d+% of reviewers sized down, and M is sold out/)).toBeVisible();
    await page.getByRole('radio', { name: 'L', exact: true }).check({ force: true });
    await expect(page.getByText(/L will be noticeably loose/)).toBeVisible();
    // The cutoff counts down on the world clock: 16:18 → 18:30.
    await expect(page.getByText('Order within 2 h 12 min')).toBeVisible();
    // Gallery thumbnails are tabs.
    await page.getByRole('tab', { name: 'Fabric' }).click();
    await expect(page.getByRole('img', { name: /close-up of the weave/ })).toBeVisible();
    // Unticking a companion updates the bundle.
    await page.getByRole('checkbox', { name: 'Include Straw sun hat' }).uncheck();
    await expect(page.getByRole('button', { name: 'Add 2 to bag' })).toBeVisible();
    await expect(page.locator('[data-bundle-total]')).toHaveText('R$538');
    // The AI review summary shows its sources and how it was made.
    const summary = page.getByRole('complementary', { name: 'Simulated AI review summary' });
    await expect(summary.getByText('Simulated AI')).toBeVisible();
    await summary.getByRole('button', { name: 'How this summary was made' }).click();
    await expect(summary.getByText(/A person on the reviews team reads every summary/)).toBeVisible();
  });

  test('pay app card flips and installments default to 3x', async ({ page }) => {
    await page.goto('/mare/apps/pay');
    const flip = page.getByRole('button', { name: 'Flip card' }).first();
    await flip.click();
    await expect(flip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('input[name="pa-inst-1"]').nth(2)).toBeChecked();
  });

  test('stories open from the rail, advance, and mark the ring as seen', async ({ page }) => {
    await page.goto('/mare/shop');
    await page.getByRole('link', { name: /@ninac/ }).click();
    const story = page.getByRole('dialog', { name: 'Story from @ninac' });
    await expect(story).toBeVisible();
    await expect(story.getByText('My humid-weekend uniform')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(story.getByText('Then the wide-leg pants')).toBeVisible();
    await story.getByRole('button', { name: 'Pause' }).click();
    await expect(story.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(story).toBeHidden();
    await expect(page.getByRole('link', { name: /@ninac\s*, seen/ })).toBeVisible();
  });

  test('row cards expand after hover intent and reveal quick actions', async ({ page }) => {
    await page.goto('/mare/shop');
    const tile = page.locator('#picked .cs-tile').nth(1);
    await expect(page.locator('#picked')).toHaveClass(/is-ready/);
    // Center the row first: a minimal scroll would park the card's actions under the sticky bars.
    await tile.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await tile.hover();
    await expect(tile).toHaveClass(/is-expanded/);
    await expect(tile.getByRole('button', { name: 'Add to bag' })).toBeVisible();
    // Keyboard path: focus expands the card at once, and Enter acts on the quick action.
    await page.mouse.move(0, 0);
    await expect(tile).not.toHaveClass(/is-expanded/);
    await tile.getByRole('button', { name: 'Save' }).focus();
    await expect(tile).toHaveClass(/is-expanded/);
    await page.keyboard.press('Enter');
    await expect(tile.getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('offline variation shows saved picks', async ({ page }) => {
    await page.goto('/mare/shop?state=offline');
    await expect(page.getByText(/You're offline/)).toBeVisible();
  });
});
