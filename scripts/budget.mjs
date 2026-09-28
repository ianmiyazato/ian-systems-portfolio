// pnpm budget — print the free-tier ledger: deploys used vs. budget, Supabase rows and size,
// static output per app. Live Supabase counts are read when SUPABASE_ACCESS_TOKEN is set.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { root } from './lib/servers.mjs';

const ledger = JSON.parse(readFileSync(resolve(root, 'docs/agents/free-tier-ledger.json'), 'utf8'));
const { limits } = ledger;
const production = ledger.vercel.deploys.filter((deploy) => deploy.kind === 'production');
const preview = ledger.vercel.deploys.filter((deploy) => deploy.kind === 'preview');
const status = (used, max) => (used <= max ? 'ok' : 'OVER');

function size(dir) {
  if (!existsSync(dir)) return null;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    total += entry.isDirectory() ? size(path) ?? 0 : entry.name.endsWith('.map') ? 0 : statSync(path).size;
  }
  return total;
}

async function liveRows() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) return null;
  const response = await fetch(`https://api.supabase.com/v1/projects/${ledger.supabase.projectRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: "select relname as t, n_live_tup as n from pg_stat_user_tables where schemaname = 'public'" })
  });
  if (!response.ok) return null;
  return Object.fromEntries((await response.json()).map((row) => [row.t, Number(row.n)]));
}

const snapshot = ledger.supabase.snapshots.at(-1);
const live = await liveRows();
const rows = live ?? snapshot.rows;
const totalRows = Object.values(rows).reduce((sum, value) => sum + value, 0);

console.log('Free-tier ledger · v0.2\n');
console.log(`Vercel production deploys  ${production.length}/${limits.productionDeploys}  ${status(production.length, limits.productionDeploys)}`);
console.log(`Vercel preview deploys     ${preview.length}/${limits.previewDeploys}  ${status(preview.length, limits.previewDeploys)}`);
for (const deploy of ledger.vercel.deploys) console.log(`  · ${deploy.date} ${deploy.kind} ${deploy.apps.join(', ')} — ${deploy.reason}`);
console.log(`Supabase rows              ${totalRows}/${limits.supabaseRows}  ${status(totalRows, limits.supabaseRows)} (${live ? 'live' : `snapshot ${snapshot.date}`})`);
for (const [table, count] of Object.entries(rows)) console.log(`  · ${table} ${count}`);
console.log(`Supabase database          ${snapshot.dbMb} MB/${limits.supabaseDbMb} MB  ${status(snapshot.dbMb, limits.supabaseDbMb)} · buckets ${snapshot.buckets} · edge functions ${snapshot.edgeFunctions} · pg_cron ${snapshot.pgCron ? 'on' : 'off'}`);
const created = ledger.created;
console.log(`Created resources          projects ${created.projects} · functions ${created.functions} · crons ${created.crons} · storage ${created.storage}`);
console.log('\nStatic output per app (source maps excluded)');
const outputs = { shell: 'apps/shell/.next/static', 'mare-ops': 'apps/mare-ops/dist', 'mare-shop': 'apps/mare-shop/dist', pulse: 'apps/pulse/.vercel/output/static' };
let over = production.length > limits.productionDeploys || preview.length > limits.previewDeploys || totalRows > limits.supabaseRows;
for (const [app, dir] of Object.entries(outputs)) {
  const bytes = size(resolve(root, dir));
  const mb = bytes === null ? null : bytes / 1024 / 1024;
  if (mb !== null && mb > limits.staticOutputMbPerApp) over = true;
  console.log(`  · ${app.padEnd(10)} ${mb === null ? 'not built' : `${mb.toFixed(1)} MB/${limits.staticOutputMbPerApp} MB  ${status(mb, limits.staticOutputMbPerApp)}`}`);
}
process.exit(over ? 1 : 0);
