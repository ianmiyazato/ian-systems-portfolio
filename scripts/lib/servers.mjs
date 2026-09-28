// Start (or reuse) production previews of all four zones; the shell on :3000 proxies the rest,
// exactly like Vercel. Shared by verify:route, shots and budget checks. Run `pnpm build` first.
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const zones = [
  { name: 'mare-ops', filter: '@portfolio/mare-ops', command: 'vite preview', url: 'http://127.0.0.1:3001/mare/ops/' },
  { name: 'mare-shop', filter: '@portfolio/mare-shop', command: 'astro preview --port 3002 --host 127.0.0.1', url: 'http://127.0.0.1:3002/mare/shop' },
  { name: 'pulse', filter: '@portfolio/pulse', command: 'vite preview', url: 'http://127.0.0.1:3003/pulse/' },
  { name: 'shell', filter: '@portfolio/shell', command: 'next start -p 3000 -H 127.0.0.1', url: 'http://127.0.0.1:3000' }
];

export const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

async function up(url) {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    return response.status < 500;
  } catch {
    return false;
  }
}

/** Resolves once every zone answers; returns a stop() that kills only the servers it started. */
export async function ensureServers() {
  if (process.env.BASE_URL) return () => {};
  const started = [];
  for (const zone of zones) {
    if (await up(zone.url)) continue;
    const child = spawn('corepack', ['pnpm', '--filter', zone.filter, 'exec', ...zone.command.split(' ')], { cwd: root, stdio: 'ignore', detached: true });
    started.push(child);
  }
  const deadline = Date.now() + 120_000;
  for (const zone of zones) {
    while (!(await up(zone.url))) {
      if (Date.now() > deadline) throw new Error(`${zone.name} did not start at ${zone.url}; run pnpm build first`);
      await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    }
  }
  return () => started.forEach((child) => { try { process.kill(-child.pid); } catch { /* already gone */ } });
}
