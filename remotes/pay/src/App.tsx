import type { RemoteContext } from '@portfolio/remote-runtime';
import { Link, useSegments } from '@portfolio/remote-runtime';
import { Applications } from './Applications';
import { Detail } from './Detail';
import { PayCard } from './PayCard';

const items = ['Applications', 'Accounts', 'Disputes', 'Collections', 'Fraud', 'Models', 'Policies'] as const;

function SideNav() {
  return (
    <aside class="py-side" data-anchor="py-side">
      <Link class="py-logo" href="/mare/ops/pay"><span aria-hidden="true" />maré pay</Link>
      <nav aria-label="Maré Pay">
        {items.map((item) => (
          <Link key={item} href={item === 'Applications' ? '/mare/ops/pay' : `/mare/ops/pay?view=${item.toLowerCase()}`} aria-current={item === 'Applications' ? 'page' : undefined}>
            {item}{item === 'Applications' && <b>37</b>}
          </Link>
        ))}
      </nav>
      <div class="py-side-foot"><span>ft-risk-v3 · champion</span><small>policy 44 · current</small></div>
    </aside>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  const segments = useSegments(ctx.basePath);
  if (ctx.mode === 'tile') return <Tile />;
  return (
    <div class="py-app">
      <SideNav />
      {segments[0] === 'applications' ? <Detail id={segments[1] ?? 'AP-77118'} /> : <Applications />}
    </div>
  );
}

function Tile() {
  return (
    <div class="py-tile">
      <small>Credit operations · explainable decisions</small>
      <strong>37 in review</strong>
      <div class="py-tile-cards" aria-hidden="true">
        <PayCard kind="credito" />
        <PayCard kind="loja" />
      </div>
    </div>
  );
}
