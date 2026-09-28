<script lang="ts">
  import { view } from '$lib/view.svelte';
  import { live } from '$lib/world.svelte';
  import { params } from '$lib/params.svelte';
  import Layer from '$lib/Layer.svelte';
  import { EVENT_AT, NEEDED, REPLAY_MINUTES, REPLAY_START, REROUTE_ID, SPEED, along, creators, districts, heat, kst, lengthOf, pathOf, reserve, river, roads, toHongdae, type Creator, type Point } from '$lib/streetteams';

  type Trip = { creator: Creator; route: Point[]; start: number; minutes: number; toVenue: boolean };

  const canceled = $derived(view.state === 'error');
  // Replay minute (0–50 after 18:20 KST), driven by sim time: pause, 10× and 60× apply.
  const minute = $derived((live.elapsed / 60) % REPLAY_MINUTES);
  const clockKst = $derived(kst(REPLAY_START + minute));

  let extra = $state<Trip[]>([]);
  let rerouted = $state<Trip | null>(null);
  let briefSent = $state(false);

  const base = $derived<Trip[]>(creators.map((creator) => ({ creator, route: creator.route, start: creator.start, minutes: creator.minutes, toVenue: creator.id !== REROUTE_ID })));
  const trips = $derived([...base.map((trip) => (rerouted && trip.creator.id === REROUTE_ID ? rerouted : trip)), ...extra]);
  const progress = (trip: Trip) => Math.max(0, Math.min(1, (minute - trip.start) / trip.minutes));
  const eta = (trip: Trip) => Math.max(0, Math.ceil(trip.start + trip.minutes - minute));
  const onSite = $derived(trips.filter((trip) => trip.toVenue && progress(trip) >= 1).length);
  const assigned = $derived(trips.filter((trip) => trip.toVenue).length);
  const posts = $derived(Math.round(trips.filter((trip) => trip.toVenue).reduce((sum, trip) => sum + Math.max(0, minute - (trip.start + trip.minutes)) * 0.6, 0) + minute * 0.4));
  const views = $derived(Math.round(posts * 3_850 + minute * 900));

  function dispatch() {
    if (extra.length) return;
    extra = [{ creator: reserve, route: reserve.route, start: minute, minutes: reserve.minutes, toVenue: true }];
  }
  function acceptReroute() {
    const trip = base.find((item) => item.creator.id === REROUTE_ID)!;
    const from = along(trip.route, progress(trip));
    const route: Point[] = [from, ...toHongdae];
    rerouted = { creator: trip.creator, route, start: minute, minutes: Math.max(4, Math.round(lengthOf(route) / SPEED)), toVenue: true };
  }
</script>

<svelte:head><title>Pulse · Street teams</title><meta name="description" content="Dispatch creators to a Seoul pop-up: fan-density heat, routes, ETAs and an AI re-route, replayed on the world clock." /></svelte:head>

<main class="pl-main st" data-anchor="st-main">
  <header class="st-head">
    <div><span class="pl-kicker">Street teams · replay of last night, on the world clock</span><h1>Street teams</h1></div>
    <p class="st-clock" data-anchor="st-clock"><span class="live-dot" aria-hidden="true"></span> Seoul <b>{clockKst}</b> KST · replay {Math.floor(minute)} of {REPLAY_MINUTES} min</p>
  </header>

  {#if canceled}<p class="pl-banner risk" role="status" data-anchor="st-canceled">Canceled for heavy rain at 18:05 KST · an automatic brief went to all {assigned} creators: “Stay dry, you're paid in full, reschedule vote at 20:00.”</p>{/if}

  <div class="st-layout">
    <section class="st-map" aria-label="Seoul map with fan density and creator routes" data-anchor="st-map">
      <svg viewBox="0 0 800 520" role="img" aria-label="Fan density is highest in Hongdae. {onSite} creators on site, {assigned - onSite} en route.">
        <defs>{#each heat as zone, index}<radialGradient id="heat-{index}"><stop offset="0" stop-color="var(--accent)" stop-opacity={zone.level * 0.7} /><stop offset="1" stop-color="var(--accent)" stop-opacity="0" /></radialGradient>{/each}</defs>
        <rect width="800" height="520" class="st-land" />
        {#each roads as d}<path {d} class="st-road" />{/each}
        <path d={river} class="st-river" />
        {#each heat as zone, index}<circle cx={zone.at[0]} cy={zone.at[1]} r={zone.r} fill="url(#heat-{index})" class="st-heat" />{/each}
        {#each districts as district}<text x={district.at[0]} y={district.at[1] - 16} class="st-label">{district.name}</text>{/each}
        <g class="st-pin" transform="translate(150 205)"><circle r="16" class="st-pulse" /><circle r="7" /></g>
        <g class="st-pin backup" transform="translate(600 222)"><circle r="6" /></g>
        {#each trips as trip (trip.creator.id)}
          {@const [x, y] = along(trip.route, progress(trip))}
          <path d={pathOf(trip.route)} class="st-route" class:off={canceled || !trip.toVenue} />
          <g class="st-creator" class:arrived={progress(trip) >= 1} class:off={canceled} style="transform:translate({x}px,{y}px)"><circle r="9" /><text y="4">{trip.creator.name[0]}</text></g>
        {/each}
      </svg>
    </section>

    <aside class="st-side">
      <section class="pl-panel st-event" aria-labelledby="st-event-title" data-anchor="st-event">
        <header><h2 id="st-event-title">Hongdae pop-up · {kst(EVENT_AT)}</h2>{#if !canceled}<span class="st-surge">Surge · 2.3× fans</span>{/if}</header>
        <p class="pl-muted">Needs {NEEDED} creators · {onSite} on site · {assigned - onSite} en route</p>
        <div class="st-fill" role="progressbar" aria-label="Creators on site" aria-valuemin={0} aria-valuemax={NEEDED} aria-valuenow={onSite}><i style="transform:scaleX({canceled ? 0 : onSite / NEEDED})"></i><i class="pending" style="transform:scaleX({canceled ? 0 : Math.min(1, assigned / NEEDED)})"></i></div>
        <ul class="st-list">
          {#each trips as trip (trip.creator.id)}
            <li class:muted={!trip.toVenue}>
              <span class="st-av">{trip.creator.name[0]}</span>
              <span><b>{trip.creator.name}</b> <span lang="ko">{trip.creator.local}</span><small>{trip.creator.followers} followers · from {trip.creator.from}</small></span>
              <span class="st-status">{canceled ? 'released · paid' : !trip.toVenue ? 'to Seongsu backup' : progress(trip) >= 1 ? 'on site' : progress(trip) <= 0 ? `leaves in ${Math.ceil(trip.start - minute)} min` : `${eta(trip)} min away`}</span>
            </li>
          {/each}
        </ul>
        <div class="st-actions">
          <button type="button" class="pl-btn primary" onclick={dispatch} disabled={canceled || extra.length > 0} data-anchor="st-dispatch">{extra.length ? 'Doyun dispatched' : 'Dispatch 1 more'}</button>
          <button type="button" class="pl-btn" onclick={() => params.open({ brief: '1' })} disabled={canceled}>Broadcast brief</button>
        </div>
      </section>

      <section class="pl-panel st-coverage" aria-labelledby="st-cov-title" data-anchor="st-coverage">
        <h2 id="st-cov-title">Live coverage · last 40 min</h2>
        <dl><div><dt>Posts</dt><dd>{canceled ? 0 : posts}</dd></div><div><dt>Views</dt><dd>{canceled ? 0 : views.toLocaleString('en-US')}</dd></div></dl>
        {#if !canceled}
          <section class="ai-surface ai-inline" aria-label="Simulated AI: re-route" data-anchor="st-reroute">
            <header class="ai-head"><span class="ai-spark" aria-hidden="true"></span><span class="ai-badge">Simulated AI</span><span class="ai-meta">density · routes · followers</span></header>
            <p class="ai-body">{rerouted ? 'Taeyang is now heading to Hongdae exit 9.' : 'Seongsu is quiet (0.55 density). Send Taeyang to Hongdae exit 9 instead: fans there are 2.3× and his 240k followers skew Seoul.'}</p>
            <ul class="ai-sources"><li class="ai-source">fan density · Hongdae <b>0.92</b></li><li class="ai-source">route time <b>0.88</b></li></ul>
            <div class="ai-actions"><button type="button" class="ai-approve" onclick={acceptReroute} disabled={Boolean(rerouted)}>{rerouted ? 'Re-routed' : 'Accept re-route'}</button></div>
          </section>
        {/if}
      </section>
    </aside>
  </div>
</main>

{#if params.get('brief') === '1'}
  <Layer title="Brief for {assigned} creators" eyebrow="Hongdae pop-up · {kst(EVENT_AT)} KST" onclose={() => params.close(['brief'])} width={560} anchor="st-brief">
    <ul class="st-brief">
      <li><b>Shot list</b> 3 verticals: the queue at exit 9, the Afterglow hook on the speakers, one reaction.</li>
      <li><b>Captions</b> Korean first, English second; tag #Afterglow and the venue.</li>
      <li><b>Timing</b> First post by 19:05, the rest before 19:40.</li>
      <li><b>Pay</b> Base fee plus a bonus above 50k views, paid through the Pulse wallet.</li>
    </ul>
    {#if briefSent}<p class="pl-banner info" role="status">Brief sent to {assigned} creators · read receipts arrive here</p>{/if}
    {#snippet footer()}
      <button type="button" class="pl-btn primary" onclick={() => (briefSent = true)} disabled={briefSent}>{briefSent ? 'Sent' : `Send to ${assigned} creators`}</button>
      <button type="button" class="pl-btn" onclick={() => params.close(['brief'])}>Close</button>
    {/snippet}
  </Layer>
{/if}
