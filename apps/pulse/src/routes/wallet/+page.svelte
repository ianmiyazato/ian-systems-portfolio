<script lang="ts">
  import { view } from '$lib/view.svelte';
  import { live } from '$lib/world.svelte';
  import { params } from '$lib/params.svelte';
  import Layer from '$lib/Layer.svelte';
  import Phone from '$lib/Phone.svelte';
  import Payout from '$lib/Payout.svelte';
  import { artist, available, fx, jpy, krw, sources, split, splitLock, usd } from '$lib/wallet';

  let shown = $state(false);
  const balance = $derived(available(live.elapsed));
  const blocked = $derived(view.state === 'locked');
  const parties = $derived(split.map((part) => (blocked && part.role === 'Producers' ? { ...part, signed: false } : part)));
  // Donut: each share becomes a stroke-dasharray segment on one circle (r = 60, circumference ≈ 377).
  const C = 2 * Math.PI * 60;
  const segments = $derived(parties.reduce<Array<{ part: (typeof parties)[number]; offset: number }>>((list, part) => [...list, { part, offset: list.reduce((sum, item) => sum + item.part.share, 0) }], []));
</script>

<svelte:head><title>Pulse · Talent wallet</title><meta name="description" content="Talent wallet: earnings private by default in USD, KRW and JPY, split sheets, and instant KRW payouts with an FX lock." /></svelte:head>

<main class="pl-main pw" data-anchor="pw-main">
  <header class="pw-head">
    <span class="pl-kicker">Talent wallet · three screens</span>
    <h1>Wallet</h1>
    <p class="pl-muted">What an artist sees: earnings private until you tap the eye, a split sheet everyone signed, and a payout that locks its exchange rate.</p>
  </header>

  <div class="pw-phones">
    <Phone label="Home screen" anchor="pw-home">
      <div class="pw-top"><span>{artist.name}</span><button type="button" class="pw-eye" aria-pressed={shown} aria-label={shown ? 'Hide amounts' : 'Show amounts'} onclick={() => (shown = !shown)}>{shown ? '◉' : '◎'}</button></div>
      <p class="pw-label">Available to pay out</p>
      <p class="pw-big">{#if shown}{usd(balance)}{:else}<span aria-hidden="true">$ ••••••</span><span class="visually-hidden">amount hidden</span>{/if}</p>
      <p class="pw-fx">{#if shown}≈ {krw(balance * fx.KRW)} · {jpy(balance * fx.JPY)}{:else}≈ ₩ •••• · ¥ ••••{/if}</p>
      <div class="pw-quick">
        <button type="button" onclick={() => params.open({ payout: '1' })}><i>↗</i>Pay out</button>
        <a href="#split"><i>◔</i>Splits</a>
        <button type="button" disabled><i>¤</i>Currencies</button>
        <button type="button" disabled><i>≡</i>Statements</button>
      </div>
      <p class="pw-label">Earnings by source · September</p>
      <ul class="pw-sources">{#each sources as source}<li><span>{source.label}</span><span class="pw-src-bar" aria-hidden="true"><i style="transform:scaleX({source.share})"></i></span><b>{shown ? usd(source.amount) : '••••'}</b></li>{/each}</ul>
    </Phone>

    <Phone label="Split sheet screen" anchor="pw-split">
      <p class="pw-label" id="split">Split sheet · Afterglow</p>
      <div class="pw-donut-wrap">
      <svg class="pw-donut" viewBox="0 0 160 160" role="img" aria-label="Split: {parties.map((part) => `${part.role} ${part.share}%`).join(', ')}">
          {#each segments as { part, offset }, index}
            <circle cx="80" cy="80" r="60" class="seg hue-{part.hue}" style="stroke-dasharray:{(part.share / 100) * C - 2} {C};stroke-dashoffset:{-(offset / 100) * C};animation-delay:{index * 120}ms" />
          {/each}
        </svg>
        <p class="pw-donut-label" aria-hidden="true"><b>100%</b><small>4 parties</small></p>
      </div>
      <ul class="pw-parties">{#each parties as part}<li><i class="dot hue-{part.hue}" aria-hidden="true"></i><span><b>{part.party}</b><small>{part.role}</small></span><b>{part.share}%</b><span class="pw-sign" class:unsigned={!part.signed}>{part.signed ? 'signed' : 'awaiting Seo-yeon'}</span></li>{/each}</ul>
      <p class="pw-lockdate">{blocked ? 'Unlocked Sep 25 · producers proposed 22% / 18%' : splitLock}</p>
    </Phone>

    <Phone label="Payout screen" anchor="pw-payout-phone">
      <div class="pw-behind" aria-hidden="true"><p class="pw-label">Pay out</p><p class="pw-big">{usd(balance)}</p></div>
      <Payout amount={Math.floor(balance)} {blocked} />
    </Phone>
  </div>
</main>

{#if params.get('payout') === '1'}
  <Layer kind="sheet" title="Pay out to KRW" eyebrow="{artist.name} · instant" onclose={() => params.close(['payout'])} width={460} anchor="pw-sheet">
    <Payout amount={Math.floor(balance)} {blocked} />
  </Layer>
{/if}
