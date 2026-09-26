import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

const types: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.map': 'application/json', '.svg': 'image/svg+xml' };

/** Dev only: serve each remote's independently built dist (vite build --watch) at its runtime URL. */
function serveRemotes(): Plugin {
  return {
    name: 'serve-remotes',
    configureServer(server) {
      server.middlewares.use('/mare/ops/remotes', (req, res, next) => {
        const [name, ...rest] = (req.url ?? '').split('?')[0]!.split('/').filter(Boolean);
        const file = resolve(__dirname, '../../remotes', name ?? '', 'dist', ...rest);
        if (!name || !file.startsWith(resolve(__dirname, '../../remotes')) || !existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(file));
      });
    }
  };
}

// Output is nested under the zone prefix so the shell can proxy /mare/ops/* unchanged.
export default defineConfig({
  plugins: [react(), serveRemotes()],
  base: '/mare/ops/',
  envPrefix: 'PUBLIC_',
  define: {
    __VERCEL_ENV__: JSON.stringify(process.env.VERCEL_ENV ?? 'development'),
    __DEPLOYMENT_URL__: JSON.stringify(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''),
    __HOST_VERSION__: JSON.stringify(pkg.version)
  },
  build: { outDir: 'dist/mare/ops', emptyOutDir: true, sourcemap: true, target: 'es2022' },
  server: { port: 3001, strictPort: true, host: '127.0.0.1' },
  preview: { port: 3001, strictPort: true, host: '127.0.0.1' }
});
