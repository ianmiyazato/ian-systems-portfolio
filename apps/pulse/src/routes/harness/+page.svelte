<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n.svelte';
  import { view } from '$lib/view.svelte';
  import { failuresToReview, providerFor, questions, runs } from '$lib/data';
  import type { Chunk, EvalResult } from '@portfolio/ai-sim';

  const stages = [
    { id: 'query', label: 'query', detail: 'normalise · detect market + language', ms: 12 },
    { id: 'retrieve', label: 'retrieve', detail: 'hybrid BM25 + embeddings · k=20', ms: 84 },
    { id: 'rerank', label: 'rerank', detail: 'cross-encoder · keep 5', ms: 31 },
    { id: 'generate', label: 'generate', detail: 'ft-analyst-v2 · cite every claim', ms: 412 },
    { id: 'judge', label: 'judge', detail: 'faithfulness · citations · relevance', ms: 126 }
  ];
  const GATE = { faithfulness: 0.9, citations: 0.95 };

  let query = $state<string>(questions[0]);
  let stage = $state(0);
  let chunks = $state<Chunk[]>([]);
  let verdict = $state<EvalResult | null>(null);
  let evalDone = $state(32);
  let canary = $state(20);

  async function run() {
    const provider = providerFor(i18n.lang);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    stage = 0;
    verdict = null;
    for (let index = 1; index <= stages.length; index += 1) {
      if (!reduce) await new Promise((resolve) => setTimeout(resolve, 450));
      stage = index;
      if (index === 2) chunks = await provider.rerank(query, await provider.retrieve(query, 5));
    }
    let answer = '';
    for await (const token of provider.generateStream(query)) answer += token;
    verdict = await provider.judge(answer, chunks);
  }

  onMount(() => {
    query = new URLSearchParams(location.search).get('q') ?? questions[0];
    void run();
    const id = setInterval(() => (evalDone = Math.min(40, evalDone + 1)), 900);
    return () => clearInterval(id);
  });
</script>

<svelte:head><title>Pulse · AI harness</title><meta name="description" content="RAG trace, retrieved chunks, eval gate and fine-tuning for Pulse's analyst model." /></svelte:head>

<main class="pl-main">
  <section class="pl-hero small" data-anchor="pl-harness-head">
    <span class="pl-kicker">Simulated AI · evaluation harness</span>
    <h1>{i18n.t('harness')}</h1>
    <form class="pl-query" onsubmit={(event) => { event.preventDefault(); void run(); }}>
      <label class="visually-hidden" for="pl-hq">Question</label>
      <input id="pl-hq" bind:value={query} />
      <button type="submit" class="pl-btn primary">Re-run trace</button>
    </form>
  </section>
  {#if view.state === 'error'}<p class="pl-banner risk">Judge model timed out on 3 scenarios · the gate stays closed until they re-run.</p>{/if}

  <section class="pl-panel" aria-labelledby="trace-title" data-anchor="pl-pipeline">
    <header><h2 id="trace-title">{i18n.t('pipeline')}</h2><span class="pl-muted">total {stages.reduce((sum, item) => sum + item.ms, 0)} ms</span></header>
    <ol class="pl-pipeline">
      {#each stages as item, index}
        <li class:done={index < stage} class:active={index === stage}>
          <b>{item.label}</b><small>{item.detail}</small><em>{index < stage ? `${item.ms} ms` : index === stage ? '…' : ''}</em>
        </li>
      {/each}
    </ol>
  </section>

  <div class="pl-grid">
    <section class="pl-panel span-2" aria-labelledby="chunks-title" data-anchor="pl-chunks">
      <header><h2 id="chunks-title">{i18n.t('chunks')}</h2></header>
      <ol class="pl-chunks">
        {#each chunks as chunk, index (chunk.id)}
          <li style="--i:{index}"><span class="rank">{index + 1}</span><p>{chunk.text}<small>{chunk.source}</small></p><b>{chunk.score.toFixed(3)}</b></li>
        {:else}
          <li class="pl-muted">retrieving…</li>
        {/each}
      </ol>
    </section>
    <section class="pl-panel ai-surface" data-anchor="pl-verdict">
      <header class="ai-head"><span class="ai-spark" aria-hidden="true"></span><span class="ai-badge">Simulated AI</span><span class="ai-meta">judge · ft-judge-v1</span></header>
      <h2 class="ai-title">Verdict</h2>
      {#if verdict}
        <dl class="pl-verdict">
          <div><dt>faithfulness</dt><dd>{verdict.faithfulness.toFixed(2)}</dd></div>
          <div><dt>citations</dt><dd>{verdict.citations.toFixed(2)}</dd></div>
          <div><dt>relevance</dt><dd>{verdict.relevance.toFixed(2)}</dd></div>
        </dl>
        <p class="pl-gate" class:pass={verdict.passed}>{verdict.passed ? 'Gate: pass' : 'Gate: fail'} · thresholds faithfulness ≥ {GATE.faithfulness}, citations ≥ {GATE.citations}</p>
      {:else}<p class="ai-body caret">judging</p>{/if}
    </section>

    <section class="pl-panel span-2" aria-labelledby="runs-title" data-anchor="pl-runs">
      <header><h2 id="runs-title">{i18n.t('runs')}</h2><span class="pl-muted">40 scenarios · EN/KR/JP</span></header>
      <table class="pl-table">
        <thead><tr><th>model</th><th>faithfulness</th><th>citation accuracy</th><th>relevance</th><th>latency p50</th><th>cost / 1k q</th><th>gate</th></tr></thead>
        <tbody>
          {#each runs as row}
            {@const pass = row.faithfulness >= GATE.faithfulness && row.citations >= GATE.citations}
            <tr class:champion={row.model === 'ft-analyst-v2'}>
              <td><b>{row.model}</b></td><td>{row.faithfulness.toFixed(2)}</td><td>{row.citations.toFixed(2)}</td><td>{row.relevance.toFixed(2)}</td><td>{row.latency} ms</td><td>${row.cost.toFixed(2)}</td>
              <td><span class="pl-pill" class:pass>{pass ? 'pass' : 'fail'}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="pl-panel" data-anchor="pl-running-eval">
      <header><h2>{i18n.t('running')}</h2><span class="pl-muted">{evalDone}/40</span></header>
      <div class="pl-progress" role="progressbar" aria-valuemin="0" aria-valuemax="40" aria-valuenow={evalDone} aria-label="Scenarios evaluated"><i style="transform:scaleX({evalDone / 40})"></i></div>
      <p class="pl-muted">{evalDone < 40 ? 'ft-analyst-v2 vs base-8b · KR slice running' : 'complete · gate evaluated'}</p>
    </section>

    <section class="pl-panel" data-anchor="pl-finetune">
      <header><h2>{i18n.t('finetune')} · ft-analyst-v2</h2></header>
      <p class="pl-muted">2,400 curated traces · 3 epochs · evaluated on a held-out 40-scenario suite</p>
      <label class="pl-split">Canary routing <output>{100 - canary}% base · {canary}% ft</output>
        <input type="range" min="0" max="50" step="5" bind:value={canary} />
      </label>
      <div class="pl-split-bar" aria-hidden="true"><i style="flex:{100 - canary}">base-8b</i><i class="ft" style="flex:{canary}">ft</i></div>
    </section>

    <section class="pl-panel" data-anchor="pl-failures">
      <header><h2>{i18n.t('failures')}</h2><span class="pl-muted">3 of 40</span></header>
      <ul class="pl-failures">
        {#each failuresToReview as failure}<li><b>{failure.id}</b><p>{failure.reason}</p><small>{failure.metric}</small></li>{/each}
      </ul>
    </section>
  </div>
</main>
