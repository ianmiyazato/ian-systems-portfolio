import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { overlayParams, routes, systemOf, type RouteEntry } from './index';

const v01Checked = '2026-09-26';

export const checkedOn = (route: RouteEntry) => route.checked ?? (route.release === '0.1' ? v01Checked : undefined);

/** docs/agents/parity.md, generated from the manifest (WRITE_PARITY=1 pnpm --filter @portfolio/routes test). */
export function renderParity(root: string): string {
  const rows = routes.filter((route) => route.parity !== false);
  const shot = (route: RouteEntry) => `docs/screenshots/${route.system}/${route.id}.png`;
  const lines = rows.map((route, index) => {
    const overlays = Object.entries(overlayParams(route)).map(([key, value]) => `${key}=${value}`).join(' ');
    const file = shot(route);
    const checked = checkedOn(route);
    return `| ${index + 1} | \`${route.href}\` | ${route.board} | ${systemOf(route.system).title} | ${route.release} | ${overlays || '—'} | ${checked ? `✅ ${checked}` : '⏳'} | ${existsSync(resolve(root, file)) ? `\`${file}\`` : '—'} |`;
  });
  const done = rows.filter((route) => checkedOn(route)).length;
  return [
    '# Parity',
    '',
    '<!-- Generated from packages/routes/src/routes.manifest.ts. Regenerate: WRITE_PARITY=1 pnpm --filter @portfolio/routes test -->',
    '',
    'Every approved screen, the design board it is checked against, and its screenshot. "Checked" means the route was opened at 1440 × 900 in Chromium and compared with the board; the crawler (`tests/e2e/crawler.spec.ts`) separately proves every route renders its heading with zero console errors.',
    '',
    '| # | Route | Board | System | Release | Overlays | Checked | Screenshot |',
    '|---|---|---|---|---|---|---|---|',
    ...lines,
    '',
    `Parity: **${done}/${rows.length}**.`,
    ''
  ].join('\n');
}
