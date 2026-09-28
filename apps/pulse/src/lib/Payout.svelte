<script lang="ts">
  import { onMount } from 'svelte';
  import { artist, fx, krw, usd } from '$lib/wallet';

  // Payout sheet: KRW destination, a 30-second FX lock that can expire, and a biometric-style confirm.
  let { amount, blocked = false }: { amount: number; blocked?: boolean } = $props();
  const LOCK = 30;
  let left = $state(LOCK);
  let phase = $state<'ready' | 'scanning' | 'sent'>('ready');
  const rate = fx.KRW * (1 - fx.spread);
  const received = $derived(amount * rate);

  onMount(() => {
    const id = setInterval(() => { if (phase === 'ready' && left > 0) left -= 1; }, 1000);
    return () => clearInterval(id);
  });
  function confirm() {
    phase = 'scanning';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => (phase = 'sent'), reduce ? 0 : 1100);
  }
</script>

<div class="pw-payout" data-anchor="pw-payout">
  <span class="pw-grab" aria-hidden="true"></span>
  {#if phase === 'sent'}
    <div class="pw-sent" role="status"><span aria-hidden="true">✓</span><b>{krw(received)} sent</b><small>to {artist.bank} · arrived instantly</small></div>
  {:else}
    <p class="pw-label">You pay out</p>
    <p class="pw-big">{usd(amount)}</p>
    <dl class="pw-rows">
      <div><dt>They receive</dt><dd>{krw(received)}</dd></div>
      <div><dt>Rate</dt><dd>₩{rate.toFixed(1)} per $ · fixture {fx.asOf}</dd></div>
      <div><dt>To</dt><dd>{artist.bank}</dd></div>
      <div><dt>Arrives</dt><dd>Instantly</dd></div>
    </dl>
    {#if blocked}
      <p class="pl-banner risk" data-anchor="pw-blocked">Payout blocked · Seo-yeon hasn't signed the new producer split. It unlocks when all parties sign.</p>
    {:else}
      <div class="pw-lock" role="timer" aria-live="off" aria-label="Rate locked for {left} more seconds">
        <span>{left > 0 ? `Rate locked for ${left} s` : 'Rate lock expired'}</span>
        <i style="transform:scaleX({left / LOCK})"></i>
      </div>
    {/if}
    {#if left > 0 || blocked}
      <button type="button" class="pw-confirm" onclick={confirm} disabled={blocked || phase === 'scanning'}>
        <span class="pw-face" class:scanning={phase === 'scanning'} aria-hidden="true"></span>{phase === 'scanning' ? 'Confirming…' : 'Confirm with Face ID'}
      </button>
    {:else}
      <button type="button" class="pw-confirm" onclick={() => (left = LOCK)}>Get a fresh rate</button>
    {/if}
  {/if}
</div>
