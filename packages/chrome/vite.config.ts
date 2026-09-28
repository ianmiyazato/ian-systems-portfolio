import { defineConfig } from 'vite';

// Library build: decisions/*.json become lazy chunks, so every zone's bundler can consume them.
export default defineConfig({
  build: {
    lib: { entry: { index: 'src/index.ts', registry: 'src/registry.ts', 'now-playing': 'src/now-playing-store.ts' }, formats: ['es'] },
    rollupOptions: { output: { chunkFileNames: 'chunks/[name]-[hash].js' } },
    emptyOutDir: true,
    target: 'es2022'
  }
});
