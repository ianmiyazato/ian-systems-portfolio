<script lang="ts">
  import { base } from '$app/paths';
  import { i18n } from '$lib/i18n.svelte';
  import { view } from '$lib/view.svelte';
  import { live } from '$lib/world.svelte';
  import { completion, MOMENT_HOUR, providerFor, questionsFor, talent } from '$lib/data';
  import type { Chunk } from '@portfolio/ai-sim';

  const W = 720;
  const H = 260;
  const x = (hour: number) => 40 + (hour / 23) * (W - 60);
  const y = (value: number) => H - 30 - ((value - 25) / 45) * (H - 60);
  const path = (values: number[]) => values.map((value, hour) => `${hour ? 'L' : 'M'}${x(hour).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  const lines = [
    { id: 'LA', values: completion.LA, cls: 'la' },
    { id: 'Seoul', values: completion.Seoul, cls: 'seoul' },
    { id: 'Tokyo', values: completion.Tokyo, cls: 'tokyo' }
  ];

  const questions = $derived(questionsFor(i18n.lang));
  let question = $state<string>(questionsFor('EN')[0]);
  $effect(() => { question = questions[0]; });
  let answer = $state('');
  let sources = $state<Chunk[]>([]);
  let streaming = $state(false);
  let asked = $state<string | null>(null);
  // Views roll while you watch; 90 s of sim time in, Tokyo's bridge moment triggers.
  const reach = $derived(18.4 + live.elapsed * 0.0021);
  const tokyoMoment = $derived(live.elapsed >= 90);

  async function ask(text = question) {
    if (!text.trim() || streaming) return;
    asked = text;
    streaming = true;
    answer = '';
    const provider = providerFor(i18n.lang);
    sources = await provider.rerank(text, await provider.retrieve(text, 3));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    for await (const token of provider.generateStream(text)) {
      answer += token;
      if (!reduce) await new Promise((resolve) => setTimeout(resolve, 24));
    }
    streaming = false;
  }
</script>

<svelte:head>
  <title>Pulse · Performance intelligence</title>
  <meta name="description" content="Synthetic entertainment performance intelligence across LA, Seoul and Tokyo." />
</svelte:head>

<main class="pl-main">
  <section class="pl-hero" data-anchor="pl-hero">
    <span class="pl-kicker">Pulse · LA · Seoul · Tokyo</span>
    <h1>{i18n.t('headline')}</h1>
    <p>{i18n.t('sub')}</p>
  </section>

  {#if view.state === 'offline'}<p class="pl-banner warn" data-anchor="pl-offline">Offline · showing the 16:10 snapshot. Ask Pulse queues questions until you reconnect.</p>{/if}
  {#if view.state === 'error'}<p class="pl-banner risk" data-anchor="pl-error">Tokyo signal feed delayed 12 min · Tokyo lines are dashed until it catches up.</p>{/if}
  {#if view.state === 'locked'}<p class="pl-banner info" data-anchor="pl-locked">Tokyo data is embargoed until the label's release at 00:00 JST · request early access.</p>{/if}

  {#if tokyoMoment}
    <p class="pl-banner info pl-moment-live" role="status" data-anchor="pl-moment-live">Moment detected · Tokyo · bridge 01:18 completion +9% in 20 min · the JP fan pages are cutting it</p>
  {/if}
  <div class="pl-kpis" data-anchor="pl-kpis">
    <div><span>{i18n.t('reach')}</span><strong>{reach.toFixed(2)}M</strong><small>+24% Seoul · rolling</small></div>
    <div><span>{i18n.t('moment')}</span><strong>0.91</strong><small>chorus · 00:42–00:57</small></div>
    <div><span>{i18n.t('pages')}</span><strong>18</strong><small>6 per market</small></div>
    <div><span>{i18n.t('gate')}</span><strong class="ok">{i18n.t('pass')}</strong><small>ft-analyst-v2</small></div>
  </div>

  <div class="pl-grid">
    <section class="pl-panel span-2" aria-labelledby="chart-title" data-anchor="pl-chart">
      <header><h2 id="chart-title">{i18n.t('chart')}</h2><ul class="pl-legend">{#each lines as line}<li class={line.cls}>{line.id}</li>{/each}</ul></header>
      {#if view.state === 'loading'}
        <div class="skeleton pl-chart-sk" aria-hidden="true"></div>
      {:else if view.state === 'empty'}
        <div class="pl-empty"><strong>No signal yet for this release</strong><p>Pulse needs about 2 hours of plays per market before a comparison means anything.</p></div>
      {:else}
        <svg class="pl-chart" viewBox="0 0 {W} {H}" role="img" aria-label="Completion rate over 24 hours; Seoul rises sharply at the chorus moment">
          {#each [0, 1, 2, 3] as row}<line class="grid" x1="40" x2={W - 20} y1={30 + row * 67} y2={30 + row * 67} />{/each}
          <rect class="moment-band" x={x(MOMENT_HOUR) - 6} y="20" width={x(MOMENT_HOUR + 3) - x(MOMENT_HOUR) + 12} height={H - 50} rx="6" />
          {#each lines as line, index}
            <path class="line {line.cls}" class:delayed={view.state === 'error' && line.id === 'Tokyo'} d={path(line.values)} style="animation-delay:{index * 180}ms" />
          {/each}
          <line class="moment" x1={x(MOMENT_HOUR)} x2={x(MOMENT_HOUR)} y1="16" y2={H - 26} />
          <circle class="moment-dot" cx={x(MOMENT_HOUR)} cy={y(completion.Seoul[MOMENT_HOUR]!)} r="6" />
          <text class="moment-label" x={x(MOMENT_HOUR) + 10} y="32">moment · chorus lift 0.91</text>
          <text class="axis" x="40" y={H - 8}>00:00</text><text class="axis" x={x(12) - 14} y={H - 8}>12:00</text><text class="axis" x={W - 60} y={H - 8}>23:00</text>
        </svg>
      {/if}
    </section>

    <section class="pl-panel pl-ask ai-surface" aria-labelledby="ask-title" data-anchor="pl-ask">
      <header class="ai-head"><span class="ai-spark" aria-hidden="true"></span><span class="ai-badge">Simulated AI</span><span class="ai-meta">retrieve → rerank → generate</span></header>
      <h2 id="ask-title" class="ai-title">{i18n.t('ask')}</h2>
      <form onsubmit={(event) => { event.preventDefault(); void ask(); }}>
        <label class="visually-hidden" for="pl-q">{i18n.t('askPlaceholder')}</label>
        <input id="pl-q" bind:value={question} placeholder={i18n.t('askPlaceholder')} />
        <button type="submit" class="ai-approve" disabled={streaming}>{i18n.t('send')}</button>
      </form>
      <div class="pl-suggest">
        {#each questions as suggestion}<button type="button" onclick={() => { question = suggestion; void ask(suggestion); }}>{suggestion}</button>{/each}
      </div>
      {#if asked}
        <p class="ai-stream" class:caret={streaming} aria-live="polite">{answer}</p>
        {#if sources.length}
          <ul class="ai-sources">{#each sources as source, index}<li class="ai-source">[{index + 1}] {source.source}<b>{source.score.toFixed(2)}</b></li>{/each}</ul>
        {/if}
        {#if !streaming}<a class="pl-trace" href="{base}/harness?q={encodeURIComponent(asked)}" data-anchor="pl-show-trace">{i18n.t('trace')} →</a>{/if}
      {/if}
    </section>

    <section class="pl-panel span-3" aria-labelledby="lb-title" data-anchor="pl-leaderboard">
      <header><h2 id="lb-title">{i18n.t('leaderboard')}</h2><span class="pl-muted">entity resolution v12 · EN / 한국어 / 日本語</span></header>
      <table class="pl-table">
        <thead><tr><th>#</th><th>Artist</th><th>Also known as</th><th>Platforms</th><th>7-day momentum</th><th>Markets</th></tr></thead>
        <tbody>
          {#each talent as artist}
            <tr>
              <td>{artist.rank}</td><td><b>{artist.name}</b></td><td class="cjk">{artist.local}</td><td>{artist.platforms} identities</td>
              <td><span class="pl-bar" style="--v:{Math.max(artist.momentum, 0) / 24}"><i></i></span><span class:neg={artist.momentum < 0}>{artist.momentum > 0 ? '+' : ''}{artist.momentum}%</span></td>
              <td>{artist.markets}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  </div>
</main>
