<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { nowPlaying, onNowPlaying, playQueue, togglePlay, type NowPlaying } from '@portfolio/chrome/now-playing';
  import { view } from '$lib/view.svelte';
  import { live } from '$lib/world.svelte';
  import { params } from '$lib/params.svelte';
  import Layer from '$lib/Layer.svelte';
  import audio from '$lib/afterglow.json';

  const HREF = `${base}/audio/afterglow`;
  const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const pre = $derived(view.state === 'empty');

  let player = $state<NowPlaying | null>(null);
  onMount(() => {
    const sync = () => (player = nowPlaying());
    sync();
    const stop = onNowPlaying(sync);
    const tick = setInterval(sync, 1000);
    return () => { stop(); clearInterval(tick); };
  });
  const ours = $derived(player?.source === 'pulse' && player.href === HREF ? player : null);
  const position = $derived(ours ? ours.position : 0);
  const play = () => (ours ? togglePlay() : playQueue('pulse', 'Afterglow', HREF, [{ id: 'afterglow', title: 'Afterglow', subtitle: 'Hana Rae', seconds: audio.seconds, cover: 'HR' }]));

  const streams = $derived(2_418_300 + Math.floor(live.elapsed * 3.4));
  const markets = [['Seoul', 1_120_000, 38], ['Tokyo', 640_000, 61], ['LA', 410_000, 19]] as const;
  const journey = [['Impressions', 9_800_000], ['Plays', 2_418_300], ['Past 30 s', 1_910_000], ['Saves', 343_000], ['Playlist adds', 58_000]] as const;
  const placements = [['K-Pop Rising', 4, 3], ['Late Night Seoul', 12, -1], ['Tokyo City Nights', 21, 9], ['New Music Friday · LA', 48, 0]] as const;
  const neighbors = ['Mika Sol · Night Swim', 'AERA · Tidal', 'Velvet Coast · Low Tide', 'Juno Park · Glass'];
  let approved = $state(false);
</script>

<svelte:head><title>Pulse · Afterglow audio</title><meta name="description" content="Audio intelligence for Hana Rae's Afterglow: waveform with replay and skip heat, markets, journey and playlists." /></svelte:head>

<main class="pl-main pa" data-anchor="pa-main">
  <header class="pa-head" data-anchor="pa-head">
    <div class="pa-record" class:spinning={ours?.playing} aria-hidden="true"><i></i></div>
    <div class="pa-title">
      <span class="pl-kicker">Audio intelligence · single · 3:12</span>
      <h1>Afterglow</h1>
      <p class="pl-muted">Hana Rae · 하나 레 · released Sep 19</p>
      <div class="pa-actions">
        <button type="button" class="pl-btn primary" onclick={play} data-anchor="pa-play" aria-pressed={Boolean(ours?.playing)}>{ours?.playing ? '❚❚ Pause' : '▶ Play'}</button>
        <a class="pl-btn" href="{base}/distribution">Open campaign</a>
      </div>
    </div>
    <dl class="pa-kpis" data-anchor="pa-kpis">
      {#if pre}
        <div><dt>Forecast · week 1</dt><dd>1.9M–2.6M</dd></div>
        <div><dt>Pre-saves</dt><dd>84,200</dd></div>
        <div><dt>Release</dt><dd>Oct 3 · 00:00 KST</dd></div>
      {:else}
        <div><dt>Streams</dt><dd>{streams.toLocaleString('en-US')}</dd></div>
        <div><dt>Save rate</dt><dd>14.2%</dd></div>
        <div><dt>Early skip</dt><dd class="neg">21%</dd></div>
      {/if}
    </dl>
  </header>

  {#if pre}<p class="pl-banner info" data-anchor="pa-pre">Pre-release · no listening data yet. Everything below is a forecast from the teaser, pre-saves and similar releases.</p>{/if}
  {#if view.state === 'error'}<p class="pl-banner risk">Tokyo stream counts are 2 h behind · Tokyo bars are estimates.</p>{/if}

  <section class="pl-panel pa-wave-panel" aria-labelledby="pa-wave-title" data-anchor="pa-wave">
    <header class="pa-wave-head"><h2 id="pa-wave-title">Where listeners replay and skip</h2><span class="pl-muted">{pre ? 'forecast from the 30 s teaser' : 'hook 1:04–1:32 replayed by 38%'}</span></header>
    <div class="pa-wave" role="img" aria-label="Waveform of Afterglow; the hook from 1:04 to 1:32 is replayed by 38% of listeners and the first 8 seconds are skipped by 21%">
      {#each audio.waveform as value, index}
        {@const at = (index / audio.waveform.length) * audio.seconds}
        <i class:played={at < position} class:hook={at >= audio.hook[0] && at < audio.hook[1]} style="transform:scaleY({pre ? value * 0.6 : value})"></i>
      {/each}
      {#if ours}<span class="pa-playhead" style="left:{(position / audio.seconds) * 100}%"></span>{/if}
    </div>
    <div class="pa-heat" aria-hidden="true">{#each audio.heat as value}<i class:replay={value > 0.05} class:skip={value < 0} style="--v:{Math.abs(value)}"></i>{/each}</div>
    <div class="pa-axis pl-muted" aria-hidden="true"><span>0:00</span><span>1:04 hook</span><span>1:32</span><span>3:12</span></div>
    <p class="pa-legend pl-muted"><span class="replay">replayed</span> <span class="skip">skipped</span></p>
  </section>

  <div class="pl-grid pa-grid">
    <section class="pl-panel" aria-labelledby="pa-markets-title" data-anchor="pa-markets">
      <h2 id="pa-markets-title">Streams by market</h2>
      <ul class="pa-bars">{#each markets as [market, count, growth]}<li><span>{market}</span><span class="pa-bar"><i style="transform:scaleX({count / markets[0][1]})"></i></span><b>{pre ? '—' : `${(count / 1000).toFixed(0)}k`}</b><small class="pr-up">{pre ? '' : `+${growth}%`}</small></li>{/each}</ul>
    </section>
    <section class="pl-panel" aria-labelledby="pa-journey-title" data-anchor="pa-journey">
      <h2 id="pa-journey-title">Listener journey</h2>
      <ol class="pa-funnel">{#each journey as [step, count], index}<li style="--w:{Math.max(0.12, count / journey[0][1])}"><span>{step}</span><b>{pre ? '—' : count >= 1_000_000 ? `${(count / 1_000_000).toFixed(1)}M` : `${Math.round(count / 1000)}k`}</b>{#if index > 0 && !pre}<small>{Math.round((count / journey[index - 1][1]) * 100)}%</small>{/if}</li>{/each}</ol>
    </section>
    <section class="pl-panel" aria-labelledby="pa-lists-title" data-anchor="pa-playlists">
      <h2 id="pa-lists-title">Playlist placements</h2>
      <ul class="pa-lists">{#each placements as [name, position, change]}<li><span>{name}</span><b>#{position}</b><small class:pr-up={change > 0} class:neg={change < 0}>{change > 0 ? `↑${change}` : change < 0 ? `↓${-change}` : '—'}</small></li>{/each}</ul>
      <h3 class="pa-sub">Sounds like</h3>
      <ul class="pa-chips">{#each neighbors as item}<li>{item}</li>{/each}</ul>
    </section>
  </div>

  <section class="ai-surface" aria-label="Simulated AI: next best cut" data-anchor="pa-ai">
    <header class="ai-head"><span class="ai-spark" aria-hidden="true"></span><span class="ai-badge">Simulated AI</span><span class="ai-meta">replay heat · Tokyo completion · caption test</span></header>
    <h3 class="ai-title">Cut a 28 s vertical of the hook for Tokyo</h3>
    <p class="ai-body">The 1:04–1:32 hook is replayed by 38% of listeners, and Tokyo completion favors longer cuts. A 28-second vertical with Japanese captions should hold past the 3-second mark.</p>
    <ul class="ai-sources"><li class="ai-source">replay heat · hook <b>0.94</b></li><li class="ai-source">Tokyo completion · 30d <b>0.86</b></li><li class="ai-source">caption experiment · Aug <b>0.81</b></li></ul>
    <div class="ai-actions"><button type="button" class="ai-approve" onclick={() => params.open({ cut: 'tokyo' })}>Review the cut</button></div>
  </section>
</main>

{#if params.get('cut') === 'tokyo'}
  <Layer title="Tokyo vertical · 1:04–1:32" eyebrow="28 s · 9:16 · Japanese captions" onclose={() => params.close(['cut'])} width={560} anchor="pa-cut">
    <div class="pa-cut" role="img" aria-label="Vertical preview: the hook section of the waveform with a Japanese caption">
      <div class="pa-wave small">{#each audio.waveform.slice(53, 77) as value}<i class="hook" style="transform:scaleY({value})"></i>{/each}</div>
      <span lang="ja">「この瞬間のために聴いてる」</span>
    </div>
    <p>Goes to the Distribution queue as a draft for the Tokyo 19:00 slot. Nothing posts until the label approves it there.</p>
    {#if approved}<p class="pl-banner info" role="status">Draft added to Distribution · Tokyo 19:00 · waiting for label approval</p>{/if}
    {#snippet footer()}
      <button type="button" class="ai-approve" onclick={() => (approved = true)} disabled={approved}>{approved ? 'Added to Distribution' : 'Approve the draft'}</button>
      <a class="pl-btn" href="{base}/distribution">Open Distribution</a>
    {/snippet}
  </Layer>
{/if}
