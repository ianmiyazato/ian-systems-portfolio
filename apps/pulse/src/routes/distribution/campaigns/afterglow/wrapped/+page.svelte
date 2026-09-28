<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { view } from '$lib/view.svelte';
  import { live } from '$lib/world.svelte';
  import { params } from '$lib/params.svelte';
  import Layer from '$lib/Layer.svelte';
  import { usd } from '$lib/wallet';

  const FRAME_MS = 6000;
  const early = $derived(view.state === 'empty');
  const views = $derived(18_400_000 + Math.floor(live.elapsed * 42));
  const earnings = 6_380.25;
  const stops = [
    { city: 'Seoul', at: 'Day 1 · 21:40 KST', views: '9.1M', x: 70, y: 40 },
    { city: 'Tokyo', at: 'Day 2 · 08:15 JST', views: '5.8M', x: 190, y: 70 },
    { city: 'LA', at: 'Day 3 · 19:00 PT', views: '3.5M', x: 60, y: 150 }
  ];
  const cards = ['views', 'moment', 'travel', 'earnings'] as const;
  const tones = { views: 'pink', moment: 'cyan', travel: 'gold', earnings: 'ink' } as const;

  let index = $state(0);
  let paused = $state(false);
  let held = $state(false);
  let reduce = $state(false);
  let revealed = $state(false);
  let sent = $state(false);
  let deckUrl = $state<string | null>(null);
  onMount(() => { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; });

  const stopped = $derived(paused || held || reduce || Boolean(params.get('share')));
  $effect(() => {
    if (stopped || early || index >= cards.length - 1) return;
    const timer = setTimeout(() => (index += 1), FRAME_MS);
    return () => clearTimeout(timer);
  });
  function key(event: KeyboardEvent) {
    if (params.get('share')) return;
    if (event.key === 'ArrowRight') index = Math.min(cards.length - 1, index + 1);
    if (event.key === 'ArrowLeft') index = Math.max(0, index - 1);
  }

  /** "Export as deck": four slides drawn on one canvas, client-side, as a PNG (no upload). */
  function exportDeck() {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const context = canvas.getContext('2d')!;
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    const font = css.getPropertyValue('--font-display').trim();
    const tiles: Array<[string, string, string]> = [
      ['--accent', `${(views / 1_000_000).toFixed(1)}M views`, 'Afterglow · 7 days'],
      ['--ai', '0:24 fan edit', 'posted by 12 pages'],
      ['--warn', 'Seoul → Tokyo → LA', '9.1M · 5.8M · 3.5M'],
      ['--surface-2', revealed ? usd(earnings) : 'Earnings: ask the artist', 'shared with the label']
    ];
    tiles.forEach(([color, big, small], tile) => {
      const x = (tile % 2) * 800;
      const y = Math.floor(tile / 2) * 450;
      context.fillStyle = token(color);
      context.fillRect(x, y, 800, 450);
      context.fillStyle = tile === 3 ? token('--ink') : token('--accent-ink');
      context.font = `700 64px ${font}`;
      context.fillText(big, x + 48, y + 250);
      context.font = `500 30px ${font}`;
      context.fillText(small, x + 48, y + 310);
    });
    canvas.toBlob((blob) => { if (blob) deckUrl = URL.createObjectURL(blob); }, 'image/png');
  }
</script>

<svelte:window onkeydown={key} />
<svelte:head><title>Pulse · Afterglow campaign wrapped</title><meta name="description" content="Campaign Wrapped for Afterglow: views, the moment, where it traveled and earnings, generated on day 7." /></svelte:head>

<main class="pl-main pcw" data-anchor="pcw-main">
  <header class="pcw-head">
    <span class="pl-kicker">Campaign Wrapped · generated on day 7 from the same evidence as the dashboards</span>
    <h1>Afterglow, wrapped</h1>
  </header>

  {#if early}
    <section class="pl-panel pcw-early" data-anchor="pcw-early">
      <h2>Wrapped arrives on day 7</h2>
      <p>This campaign is on day 4. Pulse builds the recap on day 7 at 06:00 KST, once the Tokyo and LA waves have had time to land.</p>
      <a class="pl-btn" href="{base}/distribution">Back to the campaign</a>
    </section>
  {:else}
    <section class="pcw-story t-{tones[cards[index]]}" aria-roledescription="story" aria-label="Card {index + 1} of {cards.length}" data-anchor="pcw-story">
      <div class="pcw-bars" aria-hidden="true">{#each cards as card, position}<span><i class:done={position < index} class:now={position === index && !stopped} class:hold={position === index && stopped} style="animation-duration:{FRAME_MS}ms"></i></span>{/each}</div>
      {#key index}
        <div class="pcw-card" aria-live="polite">
          {#if cards[index] === 'views'}
            <span class="pcw-kicker">Seven days of Afterglow</span>
            <h2>{(views / 1_000_000).toFixed(1)}M views</h2>
            <div class="pr-eq big pcw-eq" aria-hidden="true">{#each Array(20) as _, bar}<i style="--i:{bar}"></i>{/each}</div>
          {:else if cards[index] === 'moment'}
            <span class="pcw-kicker">The moment that did it</span>
            <h2>A 0:24 fan edit, posted by 12 pages.</h2>
            <p>A Seoul fan page cut the hook at 21:40 KST. Every page that reposted it doubled the Tokyo wave the next morning.</p>
          {:else if cards[index] === 'travel'}
            <span class="pcw-kicker">Where it traveled</span>
            <h2>Seoul → Tokyo → LA</h2>
            <svg class="pcw-route" viewBox="0 0 260 190" role="img" aria-label="Seoul day 1, 9.1M views; Tokyo day 2, 5.8M; LA day 3, 3.5M">
              <path d="M70 40 Q 150 20 190 70 Q 150 150 60 150" pathLength="1" />
              {#each stops as stop}<g transform="translate({stop.x} {stop.y})"><circle r="8" /><text x="14" y="4">{stop.city} · {stop.views}</text></g>{/each}
            </svg>
          {:else}
            <span class="pcw-kicker">What it earned</span>
            <h2>{#if revealed}{usd(earnings)}{:else}<span aria-hidden="true">$ ••••</span><span class="visually-hidden">amount hidden</span>{/if}</h2>
            <button type="button" class="pcw-reveal" aria-pressed={revealed} onclick={() => (revealed = !revealed)}>{revealed ? 'Hide earnings' : 'Tap to reveal earnings'}</button>
            <p>Streaming, short-form royalties and the Maré sync, split by the signed sheet in the wallet.</p>
          {/if}
        </div>
      {/key}
      <button type="button" class="pcw-hit prev" aria-label="Previous card" onclick={() => (index = Math.max(0, index - 1))} onpointerdown={() => (held = true)} onpointerup={() => (held = false)} onpointerleave={() => (held = false)}></button>
      <button type="button" class="pcw-hit next" aria-label="Next card" onclick={() => (index = Math.min(cards.length - 1, index + 1))} onpointerdown={() => (held = true)} onpointerup={() => (held = false)} onpointerleave={() => (held = false)}></button>
      <div class="pcw-controls">
        <button type="button" class="pcw-pause" aria-pressed={paused} onclick={() => (paused = !paused)}>{paused ? 'Play' : 'Pause'}</button>
        <span>{index + 1} / {cards.length}</span>
      </div>
    </section>

    <div class="pcw-actions" data-anchor="pcw-actions">
      <button type="button" class="pl-btn primary" onclick={() => params.open({ share: 'label' })}>Share with the label</button>
      <button type="button" class="pl-btn" onclick={exportDeck}>Export as deck</button>
      {#if deckUrl}<a class="pl-btn" href={deckUrl} download="afterglow-wrapped-deck.png">Download deck (PNG)</a>{/if}
    </div>
  {/if}
</main>

{#if params.get('share') === 'label'}
  <Layer title="Share with Haneul Records" eyebrow="Campaign Wrapped · Afterglow" onclose={() => params.close(['share'])} width={520} anchor="pcw-share">
    <p>Sends the four cards and the evidence links (dashboards, fan-edit trail, split sheet) to the label's A&amp;R lead. Earnings are included only if you revealed them.</p>
    <ul class="st-brief"><li><b>Views</b> {(views / 1_000_000).toFixed(1)}M in 7 days</li><li><b>Moment</b> 0:24 fan edit · 12 pages</li><li><b>Travel</b> Seoul → Tokyo → LA</li><li><b>Earnings</b> {revealed ? usd(earnings) : 'not shared'}</li></ul>
    {#if sent}<p class="pl-banner info" role="status">Shared with Haneul Records · they'll see it in their Pulse inbox</p>{/if}
    {#snippet footer()}
      <button type="button" class="pl-btn primary" onclick={() => (sent = true)} disabled={sent}>{sent ? 'Shared' : 'Share'}</button>
      <button type="button" class="pl-btn" onclick={() => params.close(['share'])}>Cancel</button>
    {/snippet}
  </Layer>
{/if}
