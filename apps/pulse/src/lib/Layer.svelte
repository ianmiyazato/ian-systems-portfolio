<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { pushLayer } from '@portfolio/overlays';

  // One overlay on the shared stack: Esc closes the top-most layer, focus is trapped and restored.
  let { kind = 'modal', title, eyebrow, onclose, width = 560, anchor, children, footer }: { kind?: 'modal' | 'sheet' | 'drawer'; title: string; eyebrow?: string; onclose: () => void; width?: number; anchor?: string; children: Snippet; footer?: Snippet } = $props();
  let dialog: HTMLElement;
  const id = `layer-${Math.random().toString(36).slice(2, 8)}`;
  onMount(() => pushLayer(dialog, () => onclose()));
</script>

<div class="ov-scrim" data-level="1" onclick={() => onclose()} role="presentation"></div>
<div bind:this={dialog} class="ov-{kind}" role="dialog" aria-modal="true" aria-labelledby={id} data-anchor={anchor} style="--ov-width:{width}px">
  <header class="ov-head">
    <div>{#if eyebrow}<span class="ov-eyebrow">{eyebrow}</span>{/if}<h2 id={id} class="ov-title">{title}</h2></div>
    <button type="button" class="ov-close" aria-label="Close {title}" onclick={() => onclose()}>×</button>
  </header>
  <div class="ov-body">{@render children()}</div>
  {#if footer}<footer class="ov-foot">{@render footer()}</footer>{/if}
</div>
