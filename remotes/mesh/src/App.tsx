import type { RemoteContext, ViewTable } from '@portfolio/remote-runtime';
import { Link, ViewRouter, useDemoState, useNav } from '@portfolio/remote-runtime';
import { Topology } from './Topology';
import { Partner } from './Partner';
import { Dlq } from './Dlq';
import { Invoices } from './Invoices';
import { Events } from './Events';
import { Contracts } from './Contracts';
import { Tile } from './Tile';

function MonoNav({ basePath }: { basePath: string }) {
  const nav = useNav('mesh', basePath);
  const state = useDemoState();
  const dlq = state === 'calm' || state === 'replayed' ? '0' : state === 'down' ? '64' : '18';
  return (
    <header class="ms-nav" data-anchor="ms-nav">
      <Link class="ms-logo" href="/mare/ops/mesh">integration mesh</Link>
      <nav aria-label="Integration mesh">{nav.map((item) => <Link key={item.id} href={item.href} aria-current={item.current ? 'page' : undefined}>{item.title}</Link>)}</nav>
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
  if (ctx.mode === 'tile') return <Tile />;
  /** Every Mesh view in routes.manifest.ts, and nothing else (TypeScript checks both ways). */
  const views: ViewTable<'mesh'> = {
    topology: () => <Topology ctx={ctx} />,
    partners: ({ rest }) => <Partner id={rest[0] ?? 'ligeiro-log'} />,
    events: () => <Events />,
    dlq: () => <Dlq />,
    invoices: ({ rest }) => <Invoices order={rest[0] ?? 'MR-904117'} />,
    contracts: () => <Contracts />
  };
  return (
    <div class="ms-app">
      <MonoNav basePath={ctx.basePath} />
      <ViewRouter remote="mesh" basePath={ctx.basePath} views={views} label="Mesh" />
    </div>
  );
}
