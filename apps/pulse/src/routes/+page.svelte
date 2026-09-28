<script lang="ts">
  import { base } from '$app/paths';
  import { i18n } from '$lib/i18n.svelte';
  import { view } from '$lib/view.svelte';
  import { live } from '$lib/world.svelte';
  import { params } from '$lib/params.svelte';
  import Layer from '$lib/Layer.svelte';
  import { artists, billboardArtist, brands, fitBreakdown, genres, liveMomentum, rows, type Artist, type Genre } from '$lib/roster';

  const INTENT_MS = 300;
  let genre = $state<Genre | 'All'>('All');
  let expanded = $state<string | null>(null);
  let focused = $state<string | null>(null);
  let timer = 0;
  let brandId = $state(brands[0]!.id);
  let sent = $state(false);

  // The empty variation lands on a filter with no Tokyo crossovers, so the designed empty row shows.
  $effect(() => { if (view.state === 'empty') genre = 'Hip-hop'; });

  const pages = $derived(12 + Math.min(9, Math.floor(live.elapsed / 120)));
  const pitch = $derived(artists.find((artist) => artist.id === params.get('pitch')));
  const brand = $derived(brands.find((item) => item.id === brandId)!);
  const fit = $derived(pitch ? fitBreakdown(pitch, brand) : null);
  const visible = (artist: Artist) => genre === 'All' || artist.genre === genre;

  function hover(id: string) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => (expanded = id), INTENT_MS);
  }
  function leave(id: string) {
    window.clearTimeout(timer);
    if (expanded === id) expanded = null;
  }
  const isOpen = (id: string) => (focused ?? expanded) === id;
</script>

<svelte:head><title>Pulse · Roster</title><meta name="description" content="Pulse roster: the moment of the week and rising artists across Seoul, Tokyo and LA, with brand fit." /></svelte:head>

<main class="pl-main pr" data-anchor="pr-main">
  <section class="pr-billboard" aria-labelledby="pr-title" data-anchor="pr-billboard">
    <div class="pr-bb-art" aria-hidden="true">
      <div class="pr-eq big">{#each Array(24) as _, index}<i style="--i:{index}"></i>{/each}</div>
    </div>
    <div class="pr-bb-copy">
      <span class="pl-kicker">{i18n.t('rosterHeadline')} · Seoul → Tokyo → LA</span>
      <h1 id="pr-title">{billboardArtist.name}</h1>
      <p class="pr-local" lang="ko">{billboardArtist.local}</p>
      <p class="pr-facts"><b class="pr-up">+{liveMomentum(billboardArtist, live.elapsed)}%</b><span>streams this week</span><span>“Afterglow” · 0:24 fan edit posted by <b>{pages}</b> pages</span></p>
      <div class="pr-actions">
        <button type="button" class="pl-btn primary" onclick={() => params.open({ moment: billboardArtist.id })}>▶ Watch the moment</button>
        <a class="pl-btn" href="{base}/distribution">Build campaign</a>
      </div>
    </div>
  </section>

  {#if view.state === 'offline'}<p class="pl-banner warn" data-anchor="pr-offline">Offline · showing this morning's roster. Momentum resumes when you reconnect.</p>{/if}
  {#if view.state === 'error'}<p class="pl-banner risk" data-anchor="pr-error">LA streaming feed is 20 min behind · LA breakouts may lag.</p>{/if}
  {#if view.state === 'locked'}<p class="pl-banner info" data-anchor="pr-locked">Brand fit is a Pro workspace feature · ask your admin to upgrade.</p>{/if}

  <div class="pr-filters" role="group" aria-label="Filter by genre" data-anchor="pr-filters">
    {#each genres as item}<button type="button" aria-pressed={genre === item} onclick={() => (genre = item)}>{item}</button>{/each}
  </div>

  {#each rows as row}
    {@const list = artists.filter((artist) => row.pick(artist) && visible(artist))}
    <section class="pr-row" aria-labelledby="row-{row.id}" data-anchor={row.id === 'seoul' ? 'pr-row' : undefined}>
      <h2 id="row-{row.id}">{row.title}</h2>
      {#if view.state === 'loading'}
        <ul class="pr-track" aria-hidden="true">{#each Array(4) as _}<li class="pr-card skeleton pr-sk"></li>{/each}</ul>
      {:else if list.length === 0}
        <p class="pr-empty" data-anchor={row.id === 'tokyo' ? 'pr-empty' : undefined}>No {row.title.toLowerCase()} in {genre} this week. <button type="button" class="pl-link" onclick={() => (genre = 'All')}>Clear the filter</button></p>
      {:else}
        <ul class="pr-track">
          {#each list as artist (artist.id)}
            <li class="pr-card hue-{artist.hue}" class:is-open={isOpen(`${row.id}:${artist.id}`)}
              onpointerenter={(event) => event.pointerType === 'mouse' && hover(`${row.id}:${artist.id}`)}
              onpointerleave={() => leave(`${row.id}:${artist.id}`)}
              onfocusin={() => (focused = `${row.id}:${artist.id}`)}
              onfocusout={(event) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) focused = null; }}>
              <a class="pr-card-main" href={artist.id === 'hana-rae' ? `${base}/audio/afterglow` : `${base}/intelligence`} aria-label="{artist.name}, {artist.market}, momentum up {liveMomentum(artist, live.elapsed)}%">
                <span class="pr-art"><span class="pr-eq">{#each Array(7) as _, index}<i style="--i:{index}"></i>{/each}</span><b>{artist.name.slice(0, 1)}</b></span>
                <span class="pr-name">{artist.name}</span>
                <span class="pr-meta" lang="ko">{artist.local}</span>
                <span class="pr-stats"><span class="pr-up">+{liveMomentum(artist, live.elapsed)}%</span> · {artist.genre}{#if row.id === 'moments' && artist.moment} · {artist.moment}{/if}</span>
              </a>
              <div class="pr-more">
                <p class="pr-fit"><span>Brand fit · Maré Summer 27</span><b>{view.state === 'locked' ? 'Pro' : `${fitBreakdown(artist, brands[0]!).score}%`}</b></p>
                <div class="pr-more-actions">
                  <button type="button" class="pl-btn primary" onclick={() => { sent = false; params.open({ pitch: artist.id }); }} disabled={view.state === 'locked'}>Pitch to brand</button>
                  <a class="pl-btn" href={artist.id === 'hana-rae' ? `${base}/audio/afterglow` : `${base}/intelligence`}>Open</a>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/each}
</main>

{#if params.get('moment')}
  <Layer title="The moment · Afterglow 0:24" eyebrow="{billboardArtist.name} · fan edit · silent preview" onclose={() => params.close(['moment'])} width={620} anchor="pr-moment">
    <div class="pr-clip" role="img" aria-label="Silent preview of the Afterglow fan edit: waveform with the 0:24 hook highlighted">
      <div class="pr-eq big">{#each Array(32) as _, index}<i style="--i:{index}"></i>{/each}</div>
      <span class="pr-caption" lang="ko">“이 부분만 백 번 들었어” · “I've replayed this part a hundred times”</span>
    </div>
    <p>The 0:24 hook was cut by a Seoul fan page at 21:40 KST and reposted by {pages} pages in 26 hours. Tokyo picked it up with Japanese captions; LA is following on the usual 9–14 hour lag.</p>
    {#snippet footer()}
      <a class="pl-btn primary" href="{base}/distribution">Build campaign</a>
      <a class="pl-btn" href="{base}/audio/afterglow">Open audio intelligence</a>
    {/snippet}
  </Layer>
{/if}

{#if pitch && fit}
  <Layer title="Pitch {pitch.name} to a brand" eyebrow="Brand fit · {fit.score}%" onclose={() => params.close(['pitch'])} width={600} anchor="pr-pitch">
    <label class="pr-brand">Brand
      <select bind:value={brandId}>{#each brands as item}<option value={item.id}>{item.name}</option>{/each}</select>
    </label>
    <p class="pl-muted">{brand.audience}</p>
    <ul class="pr-fit-parts">
      {#each fit.parts as [label, value]}<li><span>{label}</span><span class="pr-fit-bar" aria-hidden="true"><i style="transform:scaleX({value / 100})"></i></span><b>{value}%</b></li>{/each}
    </ul>
    <section class="ai-surface ai-inline" aria-label="Simulated AI: pitch draft">
      <header class="ai-head"><span class="ai-spark" aria-hidden="true"></span><span class="ai-badge">Simulated AI</span><span class="ai-meta">grounded in 3 signals</span></header>
      <p class="ai-body">{pitch.name} is up {liveMomentum(pitch, live.elapsed)}% this week in {pitch.market}, and their audience overlaps {brand.name}'s by {fit.parts[0]![1]}%. A 3-week creator series timed to the next moment would reach the {brand.audience.split(' · ')[0]} audience where they already are.</p>
      <ul class="ai-sources"><li class="ai-source">momentum · {pitch.market} <b>0.93</b></li><li class="ai-source">audience overlap <b>0.88</b></li><li class="ai-source">brand safety scan <b>0.96</b></li></ul>
    </section>
    {#if sent}<p class="pl-banner info" role="status">Sent to {brand.name}'s partnerships lead · you'll see replies in Distribution.</p>{/if}
    {#snippet footer()}
      <button type="button" class="ai-approve" onclick={() => (sent = true)} disabled={sent}>{sent ? 'Pitch sent' : 'Approve and send'}</button>
      <button type="button" class="pl-btn" onclick={() => params.close(['pitch'])}>Not now</button>
    {/snippet}
  </Layer>
{/if}
