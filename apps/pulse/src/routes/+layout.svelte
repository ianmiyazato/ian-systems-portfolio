<script lang="ts">
  import { onMount } from 'svelte';
  import '@portfolio/tokens/styles.css';
  import '@portfolio/tokens/fonts/pulse';

  let { children } = $props();
  onMount(() => {
    void import('@portfolio/chrome').then(({ defineChrome }) => defineChrome());
  });
</script>

<im-portfolio-bar context="Pulse"></im-portfolio-bar>
{@render children()}
<footer class="im-footer">All names are fictitious · data is synthetic · AI behavior is simulated in v0.1</footer>
<im-decision-lens></im-decision-lens>
<im-command-palette></im-command-palette>
