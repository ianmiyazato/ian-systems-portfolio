import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Output is nested under the zone prefix so the shell can proxy /mare/ops/* unchanged.
export default defineConfig({
  plugins: [react()],
  base: '/mare/ops/',
  envPrefix: 'PUBLIC_',
  build: { outDir: 'dist/mare/ops', emptyOutDir: true, sourcemap: true, target: 'es2022' },
  server: { port: 3001, strictPort: true },
  preview: { port: 3001, strictPort: true }
});
