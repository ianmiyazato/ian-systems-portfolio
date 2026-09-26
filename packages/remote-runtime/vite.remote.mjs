// Shared build for every Maré Ops remote: an independent ES module entry (remote.js), its own
// CSS and fonts with relative URLs, and an mf-manifest.json the host reads at runtime.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

function manifestPlugin({ name, theme }) {
  return {
    name: 'portfolio-remote-manifest',
    generateBundle(_options, bundle) {
      const entry = Object.values(bundle).find((item) => item.type === 'chunk' && item.isEntry);
      if (!entry) throw new Error(`${name}: no entry chunk`);
      const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
      const manifest = {
        name,
        version: pkg.version,
        builtAt: new Date().toISOString(),
        contract: 'mount(el, ctx) -> unmount',
        entry: `./${entry.fileName}`,
        css: [...(entry.viteMetadata?.importedCss ?? [])].map((file) => `./${file}`),
        theme,
        runtime: `preact@${pkg.dependencies?.preact ?? 'workspace'}`
      };
      this.emitFile({ type: 'asset', fileName: 'mf-manifest.json', source: `${JSON.stringify(manifest, null, 2)}\n` });
    }
  };
}

export function remoteConfig({ name, theme }) {
  return defineConfig(({ mode }) => ({
    plugins: [preact({ prefreshEnabled: false }), manifestPlugin({ name, theme })],
    base: './',
    publicDir: false,
    build: {
      outDir: process.env.REMOTE_OUT_DIR ? resolve(process.env.REMOTE_OUT_DIR, name) : 'dist',
      emptyOutDir: true,
      sourcemap: true,
      target: 'es2022',
      minify: mode !== 'development',
      cssCodeSplit: true,
      rollupOptions: {
        input: 'src/index.tsx',
        preserveEntrySignatures: 'exports-only',
        output: { entryFileNames: 'remote-[hash].js', chunkFileNames: 'chunks/[name]-[hash].js', assetFileNames: 'assets/[name]-[hash][extname]' }
      }
    }
  }));
}
