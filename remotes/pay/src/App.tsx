import type { RemoteContext, ViewTable } from '@portfolio/remote-runtime';
import { DensityToggle, Link, ViewRouter, useDensity, useNav, type Density } from '@portfolio/remote-runtime';
import { Applications } from './Applications';
import { Detail } from './Detail';
import { PayCard } from './PayCard';
import { Accounts } from './Accounts';
import { Disputes } from './Disputes';
import { Collections } from './Collections';
import { Fraud } from './Fraud';
import { Models } from './Models';
import { Policies } from './Policies';

/** Every Pay view in routes.manifest.ts, and nothing else (TypeScript checks both ways). */
const views: ViewTable<'pay'> = {
  applications: () => <Applications />,
  application: ({ rest }) => <Detail id={rest[0] ?? 'AP-77118'} />,
  accounts: () => <Accounts />,
  disputes: () => <Disputes />,
  collections: () => <Collections />,
  fraud: () => <Fraud />,
  models: () => <Models />,
  policies: () => <Policies />
};

const badges: Partial<Record<string, string>> = { applications: '37', collections: '6' };

function SideNav({ basePath, density, setDensity }: { basePath: string; density: Density; setDensity: (density: Density) => void }) {
  const nav = useNav('pay', basePath);
  return (
    <aside class="py-side" data-anchor="py-side">
      <Link class="py-logo" href="/mare/ops/pay"><span aria-hidden="true" />maré pay</Link>
      <nav aria-label="Maré Pay" data-shortcut-nav>
        {nav.map((item) => (
          <Link key={item.id} href={item.href} aria-current={item.current ? 'page' : undefined}>
            {item.title}{badges[item.id] && <b>{badges[item.id]}</b>}
          </Link>
        ))}
      </nav>
      <div class="py-side-foot"><DensityToggle value={density} onChange={setDensity} /><span>ft-risk-v3 · champion</span><small>policy v7 · current</small></div>
    </aside>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  const [density, setDensity] = useDensity('pay');
  if (ctx.mode === 'tile') return <Tile />;
  return (
    <div class="py-app" data-density={density}>
      <SideNav basePath={ctx.basePath} density={density} setDensity={setDensity} />
      <ViewRouter remote="pay" basePath={ctx.basePath} views={views} label="Pay" />
    </div>
  );
}

function Tile() {
  return (
    <div class="py-tile">
      <small>Credit operations · explainable decisions</small>
      <strong>37 in review</strong>
      <div class="py-tile-cards" aria-hidden="true">
        <PayCard kind="credit" />
        <PayCard kind="store" />
      </div>
    </div>
  );
}
