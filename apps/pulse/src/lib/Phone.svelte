<script lang="ts">
  import type { Snippet } from 'svelte';
  let { label, anchor, children }: { label: string; anchor?: string; children: Snippet } = $props();
</script>

<section class="pw-phone" aria-label={label} data-anchor={anchor}>
  <div class="pw-notch" aria-hidden="true"></div>
  <div class="pw-screen">{@render children()}</div>
</section>
