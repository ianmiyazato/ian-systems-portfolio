import { defineConfig } from 'astro/config';

// One Astro project serves /mare/shop/* and /mare/apps/*; output is nested under /mare
// so the shell can proxy both prefixes (and /mare/_astro assets) without path rewriting.
export default defineConfig({
  base: '/mare',
  outDir: './dist/mare',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  server: { port: 3002, host: '127.0.0.1' },
  vite: { envPrefix: 'PUBLIC_' }
});
