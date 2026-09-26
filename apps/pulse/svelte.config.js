import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** Pulse lives under /pulse on the shared domain; links to other zones are not prerendered here. */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    paths: { base: '/pulse', relative: false },
    prerender: {
      handleHttpError: ({ path, message }) => {
        if (!path.startsWith('/pulse')) return;
        throw new Error(message);
      }
    }
  }
};
