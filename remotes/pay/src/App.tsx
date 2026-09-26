import type { RemoteContext } from '@portfolio/remote-runtime';
import { Link, useSegments } from '@portfolio/remote-runtime';

const items = ['Applications', 'Accounts', 'Disputes', 'Collections', 'Fraud', 'Models', 'Policies'] as const;

export function SideNav({ active }: { active: string }) {
  return (
    <aside class="py-side" data-anchor="py-side">
      <Link class="py-logo" href="/mare/ops/pay"><span aria-hidden="true" />maré pay</Link>
      <nav aria-label="Maré Pay">
        {items.map((item) => (
          <Link key={item} href={item === 'Applications' ? '/mare/ops/pay' : `/mare/ops/pay?view=${item.toLowerCase()}`} aria-current={item === active ? 'page' : undefined}>{item}</Link>
        ))}
      </nav>
      <div class="py-side-foot"><span>ft-risk-v3</span><small>policy 44 · current</small></div>
    </aside>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  useSegments(ctx.basePath);
  if (ctx.mode === 'tile') return <Tile />;
  return (
    <div class="py-app">
      <SideNav active="Applications" />
      <main class="py-main"><h1>Applications</h1></main>
    </div>
  );
}

function Tile() {
  return (
    <div class="py-tile">
      <small>Credit operations · explainable decisions</small>
      <strong>37 in review</strong>
      <div class="py-tile-cards" aria-hidden="true">
        <div class="py-card credito"><b>Maré Pay</b><span>Crédito</span><i /></div>
        <div class="py-card loja"><b>Maré Pay</b><span>Loja</span><i /></div>
      </div>
    </div>
  );
}
