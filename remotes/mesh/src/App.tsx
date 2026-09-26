import type { RemoteContext } from '@portfolio/remote-runtime';
import { Link, useDemoState, useSegments } from '@portfolio/remote-runtime';
import { Topology } from './Topology';
import { Partner } from './Partner';
import { Dlq } from './Dlq';
import { Invoices } from './Invoices';
import { Tile } from './Tile';

const tabs = ['topology', 'partners', 'events', 'dlq', 'invoices', 'contracts'] as const;
const hrefs: Record<string, string> = { topology: '/mare/ops/mesh', partners: '/mare/ops/mesh/partners/ligeiro-log', events: '/mare/ops/mesh?view=events', dlq: '/mare/ops/mesh/dlq', invoices: '/mare/ops/mesh/invoices/MR-904117', contracts: '/mare/ops/mesh?view=contracts' };

function MonoNav({ active }: { active: string }) {
  const state = useDemoState();
  const dlq = state === 'calm' || state === 'replayed' ? '0' : state === 'down' ? '64' : '18';
  return (
    <header class="ms-nav" data-anchor="ms-nav">
      <Link class="ms-logo" href="/mare/ops/mesh">integration mesh</Link>
      <nav aria-label="Integration mesh">{tabs.map((tab) => <Link key={tab} href={hrefs[tab]!} aria-current={tab === active ? 'page' : undefined}>{tab}</Link>)}</nav>
      <dl class="ms-counters" data-anchor="ms-counters">
        <div><dt>throughput</dt><dd>1.8k/s</dd></div>
        <div><dt>p95</dt><dd>{state === 'down' ? '240ms' : '182ms'}</dd></div>
        <div class={dlq === '0' ? '' : 'warn'}><dt>dlq</dt><dd>{dlq}</dd></div>
        <div class={state === 'down' ? 'bad' : state === 'calm' || state === 'replayed' ? '' : 'warn'}><dt>circuits</dt><dd>{state === 'down' ? '1 open' : state === 'calm' || state === 'replayed' ? 'all closed' : '1 half-open'}</dd></div>
      </dl>
    </header>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  const segments = useSegments(ctx.basePath);
  if (ctx.mode === 'tile') return <Tile />;
  const section = segments[0] ?? 'topology';
  const active = ['partners', 'dlq', 'invoices'].includes(section) ? section : 'topology';
  return (
    <div class="ms-app">
      <MonoNav active={active} />
      {section === 'partners' ? <Partner id={segments[1] ?? 'ligeiro-log'} /> : section === 'dlq' ? <Dlq /> : section === 'invoices' ? <Invoices order={segments[1] ?? 'MR-904117'} /> : <Topology ctx={ctx} />}
    </div>
  );
}
