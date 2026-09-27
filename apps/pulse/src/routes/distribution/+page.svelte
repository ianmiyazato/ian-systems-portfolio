<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { openFeed, startDemoDriver } from '@portfolio/remote-runtime/realtime';
  import { i18n } from '$lib/i18n.svelte';
  import { view } from '$lib/view.svelte';
  import { feed as script, pages } from '$lib/data';

  type Slot = { id: string; lane: number; hour: number; label: string };
  type Post = { id: string; market: string; text: string; score: number; at?: string };
  const lanes = ['LA · PT', 'Seoul · KST', 'Tokyo · JST'];
  const peaks = [[19, 22], [19, 22], [19, 22]];

  let slots = $state<Slot[]>([
    { id: 'kr', lane: 1, hour: 20, label: 'chorus · KR' },
    { id: 'jp', lane: 2, hour: 21, label: 'bridge · JP' },
    { id: 'en', lane: 0, hour: 13, label: 'chorus · EN' }
  ]);
  let selected = $state(pages.slice(0, 4).map((page) => page.handle));
  let posts = $state<Post[]>(script.slice(0, 2));
  let status = $state('local');
  let dragging = $state<string | null>(null);

  const reach = $derived(Math.round(pages.filter((page) => selected.includes(page.handle)).reduce((sum, page) => sum + page.followers * page.fit * 0.18, 0)));
  const offPeak = $derived(slots.filter((slot) => slot.hour < peaks[slot.lane]![0]! || slot.hour > peaks[slot.lane]![1]!));

  function toggle(handle: string) {
    selected = selected.includes(handle) ? selected.filter((item) => item !== handle) : [...selected, handle];
  }

  function move(id: string, lane: number, hour: number) {
    slots = slots.map((slot) => (slot.id === id ? { ...slot, lane: Math.max(0, Math.min(2, lane)), hour: Math.max(0, Math.min(23, hour)) } : slot));
  }

  function pointer(event: PointerEvent, slot: Slot) {
    const board = (event.currentTarget as HTMLElement).closest('.pl-schedule') as HTMLElement;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragging = slot.id;
    const onMove = (next: PointerEvent) => {
      const rect = board.getBoundingClientRect();
      const lane = Math.floor(((next.clientY - rect.top) / rect.height) * 3);
      const hour = Math.round(((next.clientX - rect.left - 110) / (rect.width - 110)) * 23);
      move(slot.id, lane, hour);
    };
    const onUp = () => {
      dragging = null;
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
    };
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
  }

  function keys(event: KeyboardEvent, slot: Slot) {
    const delta = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[event.key];
    if (!delta) return;
    event.preventDefault();
    move(slot.id, slot.lane + delta[0]!, slot.hour + delta[1]!);
  }

  onMount(() => {
    const data = { mode: import.meta.env.PUBLIC_DATA_MODE === 'supabase' ? 'supabase' as const : 'local' as const, supabaseUrl: import.meta.env.PUBLIC_SUPABASE_URL, supabaseKey: import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY };
    const channel = openFeed<Post>('pulse-posting-feed', data, (message) => {
      if (message.event === 'post') posts = [message.payload, ...posts].slice(0, 6);
    }, (next) => (status = next));
    let n = 2;
    const stop = startDemoDriver('pulse-posting-feed', 6000, () => {
      const next = script[n % script.length]!;
      channel.send('post', { ...next, id: `${next.id}-${n}`, at: new Date().toISOString().slice(11, 16) });
      n += 1;
    });
    return () => { stop(); channel.close(); };
  });
</script>

<svelte:head><title>Pulse · Distribution</title><meta name="description" content="Moment detected to campaign across LA, Seoul and Tokyo." /></svelte:head>

<main class="pl-main">
  <section class="pl-hero small">
    <span class="pl-kicker">Moment → campaign · one evidence trail</span>
    <h1>{i18n.t('distribution')}</h1>
  </section>
  <section class="pl-moment" data-anchor="pl-moment">
    <span class="pl-live"><i></i>{i18n.t('detected')}</span>
    <div><strong>AERA · “Tidal” · chorus lift 00:42–00:57</strong><p>Seoul completion +24% in 40 min · confidence 0.91 · LA usually follows in 9–14 h</p></div>
    <a class="pl-btn primary" href="#schedule">{i18n.t('build')}</a>
  </section>
  {#if view.state === 'locked'}<p class="pl-banner info">Posting is locked until the label approves the clip · request sent 16:02.</p>{/if}
  {#if view.state === 'error'}<p class="pl-banner risk">Tokyo scheduler rejected 1 slot · token expired · reconnect the page.</p>{/if}

  <div class="pl-grid">
    <section class="pl-panel pl-asset" data-anchor="pl-asset">
      <div class="pl-clip" aria-hidden="true">
        <div class="pl-eq">{#each Array(14) as _, index}<i style="--i:{index}"></i>{/each}</div>
        <span>00:42 → 00:57 · 9:16</span>
      </div>
      <h2>Chorus cut · 15 s</h2>
      <ul class="pl-captions"><li>EN · “the tide comes back for you”</li><li class="cjk">KR · “파도는 너에게 돌아와”</li><li class="cjk">JP · 「波はきみに戻ってくる」</li></ul>
    </section>

    <section class="pl-panel span-2" id="schedule" aria-labelledby="schedule-title" data-anchor="pl-schedule">
      <header><h2 id="schedule-title">{i18n.t('schedule')}</h2><span class="pl-muted">shaded = local peak 19:00–22:00</span></header>
      <div class="pl-schedule">
        {#each lanes as lane, index}
          <div class="pl-lane"><span>{lane}</span><div class="pl-track"><i class="peak" style="left:calc({peaks[index]![0]! / 23 * 100}% );width:calc({(peaks[index]![1]! - peaks[index]![0]!) / 23 * 100}%)"></i></div></div>
        {/each}
        {#each slots as slot (slot.id)}
          <button type="button" class="pl-slot" class:dragging={dragging === slot.id} class:off={offPeak.includes(slot)} style="--lane:{slot.lane};--hour:{slot.hour}" aria-label="{slot.label} at {String(slot.hour).padStart(2, '0')}:00 {lanes[slot.lane]}; drag or use arrow keys" onpointerdown={(event) => pointer(event, slot)} onkeydown={(event) => keys(event, slot)}>
            {slot.label}<small>{String(slot.hour).padStart(2, '0')}:00</small>
          </button>
        {/each}
        <div class="pl-hours" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
      </div>
      {#if offPeak.length}<p class="pl-hint">⚠ {offPeak.map((slot) => slot.label).join(', ')} outside the local peak · drag into the shaded window</p>{/if}
    </section>

    <section class="pl-panel" aria-labelledby="pages-title" data-anchor="pl-pages">
      <header><h2 id="pages-title">{i18n.t('matched')}</h2></header>
      <ul class="pl-pages">
        {#each pages as page}
          <li>
            <label><input type="checkbox" checked={selected.includes(page.handle)} onchange={() => toggle(page.handle)} /><b>{page.handle}</b><small>{page.market} · {page.lang}</small></label>
            <span class="pl-fit" style="--v:{page.fit}"><i></i></span><em>{page.fit.toFixed(2)}</em>
          </li>
        {/each}
      </ul>
    </section>

    <section class="pl-panel pl-reach" data-anchor="pl-reach">
      <span class="pl-muted">{i18n.t('projected')}</span>
      <strong>{(reach / 1000).toFixed(0)}k</strong>
      <small>{selected.length} pages · fit-weighted · 18% view-through</small>
    </section>

    <section class="pl-panel" aria-labelledby="feed-title" data-anchor="pl-feed">
      <header><h2 id="feed-title">{i18n.t('feed')}</h2><span class="pl-live small" data-realtime-status={status}><i></i>{status === 'live' ? 'Supabase Broadcast' : 'local'}</span></header>
      <ol class="pl-feed" aria-live="polite">
        {#each posts as post (post.id)}<li><span class="mk">{post.market}</span><p>{post.text}</p><b>{post.score.toFixed(2)}</b></li>{/each}
      </ol>
      <a class="pl-trace" href="{base}/harness">Why these pages? {i18n.t('trace')} →</a>
    </section>
  </div>
</main>
