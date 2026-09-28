import type { RemoteContext, ViewTable } from '@portfolio/remote-runtime';
import { DensityToggle, Link, ViewRouter, useDemoState, useDensity, useNav, useSimNow, useWorld, type Density } from '@portfolio/remote-runtime';
import { circuitFor, dlqDepth, perSecond, throughput } from './live';
import { Topology } from './Topology';
import { Partner } from './Partner';
import { Dlq } from './Dlq';
import { Invoices } from './Invoices';
import { Events } from './Events';
import { Contracts } from './Contracts';
import { Tile } from './Tile';

function MonoNav({ basePath, density, setDensity }: { basePath: string; density: Density; setDensity: (density: Density) => void }) {
  const nav = useNav('mesh', basePath);
  const state = useDemoState();
  const { world } = useWorld();
  const now = useSimNow(2000);
  const circuit = circuitFor('ligeiro-log', world, now);
  const outage = state === 'down' || circuit === 'open';
  const dlq = state === 'calm' || state === 'replayed' ? '0' : state === 'down' ? '64' : String(dlqDepth(world, now));
  const rate = throughput(world, now);
  return (
    <header class="ms-nav" data-anchor="ms-nav">
      <Link class="ms-logo" href="/mare/ops/mesh">integration mesh</Link>
      <nav aria-label="Integration mesh" data-shortcut-nav>{nav.map((item) => <Link key={item.id} href={item.href} aria-current={item.current ? 'page' : undefined}>{item.title}</Link>)}</nav>
      <dl class="ms-counters" data-anchor="ms-counters">
        <div><dt>throughput</dt><dd>{perSecond(rate)}</dd></div>
        <div><dt>p95</dt><dd>{outage ? '240ms' : '182ms'}</dd></div>
        <div class={dlq === '0' ? '' : 'warn'}><dt>dlq</dt><dd>{dlq}</dd></div>
        <div class={outage ? 'bad' : state === 'calm' || state === 'replayed' || circuit === 'closed' ? '' : 'warn'}><dt>circuits</dt><dd>{outage ? '1 open' : state === 'calm' || state === 'replayed' || circuit === 'closed' ? 'all closed' : '1 half-open'}</dd></div>
      </dl>
      <DensityToggle value={density} onChange={setDensity} />
    </header>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  const [density, setDensity] = useDensity('mesh');
  if (ctx.mode === 'tile') return <Tile />;
  /** Every Mesh view in routes.manifest.ts, and nothing else (TypeScript checks both ways). */
  const views: ViewTable<'mesh'> = {
    topology: () => <Topology />,
    partners: ({ rest }) => <Partner id={rest[0] ?? 'ligeiro-log'} />,
    events: () => <Events />,
    dlq: () => <Dlq />,
    invoices: ({ rest }) => <Invoices order={rest[0] ?? 'MR-904117'} />,
    contracts: () => <Contracts />
  };
  return (
    <div class="ms-app" data-density={density}>
      <MonoNav basePath={ctx.basePath} density={density} setDensity={setDensity} />
      <ViewRouter remote="mesh" basePath={ctx.basePath} views={views} label="Mesh" />
    </div>
  );
}
