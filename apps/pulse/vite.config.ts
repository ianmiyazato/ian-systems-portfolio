import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  envPrefix: ['VITE_', 'PUBLIC_'],
  server: { port: 3003, strictPort: true, host: '127.0.0.1' },
  preview: { port: 3003, strictPort: true, host: '127.0.0.1' }
});
