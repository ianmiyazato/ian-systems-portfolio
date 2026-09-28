import { expect, test } from '@playwright/test';

test.describe('Pulse', () => {
  test('Ask Pulse streams a cited answer with a trace link', async ({ page }) => {
    await page.goto('/pulse/intelligence');
    await page.getByRole('button', { name: 'Why is Seoul moving before LA?' }).click();
    await expect(page.locator('.ai-stream')).toContainText('9–14 hours', { timeout: 10000 });
    await expect(page.locator('.pl-ask .ai-source')).toHaveCount(3);
    await page.getByRole('link', { name: /Show trace/ }).click();
    await expect(page).toHaveURL(/\/pulse\/harness\?q=/);
    await expect(page.locator('.pl-gate')).toContainText('pass', { timeout: 10000 });
  });

  test('language switch translates the interface', async ({ page }) => {
    await page.goto('/pulse/intelligence');
    await page.getByRole('button', { name: 'KR' }).click();
    await expect(page.getByRole('button', { name: 'KR' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('퍼포먼스 인텔리전스');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  });

  test('distribution slots move with the keyboard and reach reacts to pages', async ({ page }) => {
    await page.goto('/pulse/distribution');
    await expect(page.getByText(/outside the local peak/)).toBeVisible();
    const slot = page.getByRole('button', { name: /chorus · EN at 13:00/ });
    await slot.focus();
    for (let i = 0; i < 7; i += 1) await page.keyboard.press('ArrowRight');
    await expect(page.getByText(/outside the local peak/)).toBeHidden();
    const reach = await page.locator('.pl-reach strong').textContent();
    await page.getByRole('checkbox').first().uncheck();
    await expect(page.locator('.pl-reach strong')).not.toHaveText(reach!);
  });

  test('roster: billboard, moment modal, hover-expand card and an approved pitch', async ({ page }) => {
    await page.goto('/pulse');
    await expect(page.getByRole('heading', { level: 1, name: 'Hana Rae' })).toBeVisible();
    await page.getByRole('button', { name: '▶ Watch the moment' }).click();
    await expect(page.getByRole('dialog', { name: 'The moment · Afterglow 0:24' })).toBeVisible();
    await page.keyboard.press('Escape');
    const card = page.locator('[data-anchor="pr-row"] .pr-card').first();
    await card.getByRole('link').focus();
    await expect(card).toHaveClass(/is-open/);
    await expect(card.getByText('Brand fit · Maré Summer 27')).toBeVisible();
    await card.getByRole('button', { name: 'Pitch to brand' }).click();
    const pitch = page.getByRole('dialog', { name: 'Pitch Hana Rae to a brand' });
    await pitch.getByRole('combobox', { name: 'Brand' }).selectOption('atlas-pro');
    await expect(pitch.getByText('Brand fit · 77%')).toBeVisible();
    await pitch.getByRole('button', { name: 'Approve and send' }).click();
    await expect(pitch.getByText(/Sent to Atlas · Pro campaign/)).toBeVisible();
  });

  test('roster: a filter with no matches shows a designed empty row', async ({ page }) => {
    await page.goto('/pulse?state=empty');
    await expect(page.getByRole('button', { name: 'Hip-hop' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('No tokyo crossover in Hip-hop this week.')).toBeVisible();
    await page.getByRole('button', { name: 'Clear the filter' }).first().click();
    await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('audio: play on the shared bar, keep playing across Pulse pages, approve a cut', async ({ page }) => {
    await page.goto('/pulse/audio/afterglow');
    await expect(page.getByRole('heading', { level: 1, name: 'Afterglow' })).toBeVisible();
    await page.getByRole('button', { name: '▶ Play' }).click();
    const bar = page.getByRole('region', { name: 'Now playing' });
    await expect(bar.getByText('Afterglow', { exact: true })).toBeVisible();
    await page.getByRole('navigation', { name: 'Pulse' }).getByRole('link', { name: 'Roster' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Hana Rae' })).toBeVisible();
    await expect(bar.getByRole('button', { name: 'Pause' })).toBeVisible();
    await bar.getByRole('link', { name: 'Open Afterglow' }).click();
    await page.getByRole('button', { name: 'Review the cut' }).click();
    const cut = page.getByRole('dialog', { name: 'Tokyo vertical · 1:04–1:32' });
    await cut.getByRole('button', { name: 'Approve the draft' }).click();
    await expect(cut.getByText(/Draft added to Distribution/)).toBeVisible();
  });

  test('audio: a pre-release track shows forecasts only', async ({ page }) => {
    await page.goto('/pulse/audio/afterglow?state=empty');
    await expect(page.getByText('Forecast · week 1')).toBeVisible();
    await expect(page.getByText(/Pre-release · no listening data yet/)).toBeVisible();
  });

  test('street teams: replay on the world clock, dispatch, re-route and brief', async ({ page }) => {
    await page.goto('/pulse/street-teams?t=16:40&live=paused');
    await expect(page.getByText('Seoul 18:42 KST · replay 22 of 50 min')).toBeVisible();
    await expect(page.getByText('Needs 6 creators · 2 on site · 2 en route')).toBeVisible();
    await page.getByRole('button', { name: 'Dispatch 1 more' }).click();
    await expect(page.getByText('Needs 6 creators · 2 on site · 3 en route')).toBeVisible();
    await page.getByRole('button', { name: 'Accept re-route' }).click();
    await expect(page.getByText('Taeyang is now heading to Hongdae exit 9.')).toBeVisible();
    await expect(page.getByText('Needs 6 creators · 2 on site · 4 en route')).toBeVisible();
    await page.getByRole('button', { name: 'Broadcast brief' }).click();
    const brief = page.getByRole('dialog', { name: 'Brief for 6 creators' });
    await brief.getByRole('button', { name: 'Send to 6 creators' }).click();
    await expect(brief.getByText(/Brief sent to 6 creators/)).toBeVisible();
  });

  test('street teams: a weather cancellation releases and pays every creator', async ({ page }) => {
    await page.goto('/pulse/street-teams?state=error');
    await expect(page.getByText(/Canceled for heavy rain at 18:05 KST/)).toBeVisible();
    await expect(page.getByText('released · paid').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dispatch 1 more' })).toBeDisabled();
  });

  test('wallet: private by default, a split everyone signed, and a payout with an FX lock', async ({ page }) => {
    await page.goto('/pulse/wallet?t=16:18&live=paused');
    const home = page.getByRole('region', { name: 'Home screen' });
    await expect(home.getByText('amount hidden')).toBeAttached();
    await home.getByRole('button', { name: 'Show amounts' }).click();
    await expect(home.getByText('$18,420.55')).toBeVisible();
    await expect(page.getByRole('img', { name: /Artist 45%, Label 25%, Producers 20%, Songwriter 10%/ })).toBeVisible();
    await home.getByRole('button', { name: 'Pay out' }).click();
    const sheet = page.getByRole('dialog', { name: 'Pay out to KRW' });
    await expect(sheet.getByText(/Rate locked for \d+ s/)).toBeVisible();
    await expect(sheet.getByText('₩25,361,953')).toBeVisible();
    await sheet.getByRole('button', { name: 'Confirm with Face ID' }).click();
    await expect(sheet.getByText('₩25,361,953 sent')).toBeVisible();
  });

  test('wallet: an unsigned split blocks the payout', async ({ page }) => {
    await page.goto('/pulse/wallet?state=locked');
    await expect(page.getByText('awaiting Seo-yeon')).toBeVisible();
    const phone = page.getByRole('region', { name: 'Payout screen' });
    await expect(phone.getByText(/Payout blocked/)).toBeVisible();
    await expect(phone.getByRole('button', { name: 'Confirm with Face ID' })).toBeDisabled();
  });

  test('campaign wrapped: story cards, hidden earnings, share with the label and export', async ({ page }) => {
    await page.goto('/pulse/distribution');
    await page.getByRole('link', { name: /Wrapped is ready/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Afterglow, wrapped' })).toBeVisible();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    for (let step = 0; step < 3; step += 1) await page.keyboard.press('ArrowRight');
    await expect(page.getByText('amount hidden')).toBeAttached();
    await page.getByRole('button', { name: 'Tap to reveal earnings' }).click();
    await expect(page.getByRole('heading', { level: 2, name: '$6,380.25' })).toBeVisible();
    await page.getByRole('button', { name: 'Export as deck' }).click();
    await expect(page.getByRole('link', { name: 'Download deck (PNG)' })).toHaveAttribute('download', 'afterglow-wrapped-deck.png');
    await page.getByRole('button', { name: 'Share with the label' }).click();
    const share = page.getByRole('dialog', { name: 'Share with Haneul Records' });
    await expect(share.getByText('$6,380.25')).toBeVisible();
    await share.getByRole('button', { name: 'Share', exact: true }).click();
    await expect(share.getByText(/Shared with Haneul Records/)).toBeVisible();
  });

  test('campaign wrapped: a campaign younger than seven days says when it arrives', async ({ page }) => {
    await page.goto('/pulse/distribution/campaigns/afterglow/wrapped?state=empty');
    await expect(page.getByRole('heading', { name: 'Wrapped arrives on day 7' })).toBeVisible();
  });
});
