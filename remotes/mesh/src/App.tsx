import type { RemoteContext } from '@portfolio/remote-runtime';
import { Link, useSegments } from '@portfolio/remote-runtime';

const tabs = ['topology', 'partners', 'events', 'dlq', 'invoices', 'contracts'] as const;
const hrefs: Record<string, string> = { topology: '/mare/ops/mesh', partners: '/mare/ops/mesh/partners/ligeiro-log', events: '/mare/ops/mesh?view=events', dlq: '/mare/ops/mesh/dlq', invoices: '/mare/ops/mesh/invoices/MR-904117', contracts: '/mare/ops/mesh?view=contracts' };

export function MonoNav({ active }: { active: string }) {
  return (
    <header class="ms-nav" data-anchor="ms-nav">
      <Link class="ms-logo" href="/mare/ops/mesh">integration mesh</Link>
      <nav aria-label="Integration mesh">{tabs.map((tab) => <Link key={tab} href={hrefs[tab]!} aria-current={tab === active ? 'page' : undefined}>{tab}</Link>)}</nav>
      <dl class="ms-counters" data-anchor="ms-counters">
        <div><dt>throughput</dt><dd>1.8k/s</dd></div>
        <div><dt>p95</dt><dd>182ms</dd></div>
        <div class="warn"><dt>dlq</dt><dd>18</dd></div>
      </dl>
    </header>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  const segments = useSegments(ctx.basePath);
  if (ctx.mode === 'tile') return <Tile />;
  const active = segments[0] === 'partners' ? 'partners' : segments[0] === 'dlq' ? 'dlq' : segments[0] === 'invoices' ? 'invoices' : 'topology';
  return (
    <div class="ms-app">
      <MonoNav active={active} />
      <main class="ms-main"><h1>live topology</h1></main>
    </div>
  );
}

function Tile() {
  return (
    <div class="ms-tile">
      <small>integrations console · lowercase mono</small>
      <strong>1 circuit half-open</strong>
      <svg viewBox="0 0 300 120" aria-hidden="true">
        <path id="ms-t1" d="M20 60 C90 10 150 10 280 40" /><path id="ms-t2" class="warn" d="M20 60 C100 110 180 110 280 90" />
        <circle r="4"><animateMotion dur="2.4s" repeatCount="indefinite"><mpath href="#ms-t1" /></animateMotion></circle>
        <circle r="4" class="warn"><animateMotion dur="3.6s" repeatCount="indefinite"><mpath href="#ms-t2" /></animateMotion></circle>
        <rect x="8" y="48" width="24" height="24" rx="4" /><rect x="268" y="28" width="24" height="24" rx="4" /><rect x="268" y="78" width="24" height="24" rx="4" class="warn" />
      </svg>
    </div>
  );
}
