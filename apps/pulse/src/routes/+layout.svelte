<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { base } from '$app/paths';
  import '@portfolio/tokens/styles.css';
  import '@portfolio/motion/motion.css';
  import '@portfolio/tokens/fonts/pulse';
  import '@portfolio/overlays/overlays.css';
  import '@portfolio/ai-surface/ai-surface.css';
  import '../app.css';
  import { i18n, type Lang } from '$lib/i18n.svelte';
  import { clock, view } from '$lib/view.svelte';
  import { live } from '$lib/world.svelte';
  import { params } from '$lib/params.svelte';
  import { markets } from '$lib/data';

  let { children } = $props();
  const nav = [
    { href: `${base}`, key: 'roster' },
    { href: `${base}/intelligence`, key: 'intelligence' },
    { href: `${base}/distribution`, key: 'distribution' },
    { href: `${base}/audio/afterglow`, key: 'audio' },
    { href: `${base}/street-teams`, key: 'streetTeams' },
    { href: `${base}/wallet`, key: 'wallet' },
    { href: `${base}/harness`, key: 'harness' }
  ] as const;
  const current = (href: string) => (page.url.pathname.replace(/\/$/, '') || base) === href;

  onMount(() => {
    i18n.init();
    void import('@portfolio/chrome').then(({ defineChrome }) => defineChrome());
    // CJK faces load after first paint; unicode-range means only the glyph chunks in use download.
    requestAnimationFrame(() => void import('@portfolio/tokens/fonts/pulse-cjk'));
    const stopWorld = live.start();
    const stopView = view.start();
    const stopParams = params.start();
    return () => { stopWorld(); stopView(); stopParams(); };
  });
</script>

<im-portfolio-bar context="Pulse"></im-portfolio-bar>
<header class="pl-nav" data-anchor="pl-nav">
  <a class="pl-logo" href={base}><i aria-hidden="true"></i>pulse</a>
  <nav aria-label="Pulse">
    {#each nav as item}
      <a href={item.href} aria-current={current(item.href) ? 'page' : undefined}>{i18n.t(item.key)}</a>
    {/each}
  </nav>
  <ul class="pl-clocks" aria-label="Market clocks" data-anchor="pl-clocks">
    {#each markets as market}
      <li><span>{market.id}</span><time>{clock(live.now, market.zone)}</time></li>
    {/each}
  </ul>
  <div class={`live-control ${live.paused ? 'is-paused' : ''}`} data-anchor="pl-live" data-live={live.paused ? 'paused' : 'running'}>
    <i class="live-dot" aria-hidden="true"></i>
    <span class="live-label">{live.paused ? 'Paused' : 'Live'}</span>
    <time class="live-clock">{live.clock}</time>
    <button type="button" class="live-pause" aria-pressed={live.paused} onclick={() => live.toggle()}>{live.paused ? 'Resume live updates' : 'Pause live updates'}</button>
  </div>
  <div class="pl-lang" role="group" aria-label="Language" data-anchor="pl-lang">
    {#each ['EN', 'KR', 'JP'] as const as lang}
      <button type="button" class:active={i18n.lang === lang} aria-pressed={i18n.lang === lang} onclick={() => i18n.set(lang as Lang)}>{lang}</button>
    {/each}
  </div>
</header>
{@render children()}
<!-- The shared now-playing bar (from @portfolio/chrome) keeps playing across Pulse pages. -->
<im-now-playing source="pulse"></im-now-playing>
<footer class="im-footer">All names are fictitious · data is synthetic · AI behavior is simulated in v0.1</footer>
<im-decision-lens></im-decision-lens>
<im-command-palette></im-command-palette>
