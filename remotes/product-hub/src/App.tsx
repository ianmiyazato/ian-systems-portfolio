import type { RemoteContext } from '@portfolio/remote-runtime';
import { Link, useSegments } from '@portfolio/remote-runtime';

const tabs = [
  ['Catalog', '/mare/ops/product-hub'],
  ['Pricing', '/mare/ops/product-hub/products/510233?tab=pricing'],
  ['Availability', '/mare/ops/product-hub?view=availability'],
  ['Marketplace', '/mare/ops/product-hub/marketplace/onboarding/linho-co?step=mapping'],
  ['Imports', '/mare/ops/product-hub?view=imports'],
  ['Audit', '/mare/ops/product-hub?view=audit']
] as const;

export function Nav({ active }: { active: string }) {
  return (
    <header class="ph-nav" data-anchor="ph-nav">
      <Link class="ph-logo" href="/mare/ops/product-hub"><span aria-hidden="true">◧</span>Product Hub</Link>
      <nav aria-label="Product Hub">
        {tabs.map(([label, href]) => <Link key={label} href={href} aria-current={label === active ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <label class="ph-search"><span class="visually-hidden">Search catalog</span><input placeholder="Search SKU, name, owner…" /><kbd>/</kbd></label>
      <span class="ph-user" aria-label="Signed in as Lara, merchandising">LA</span>
    </header>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  const segments = useSegments(ctx.basePath);
  if (ctx.mode === 'tile') return <Tile />;
  return (
    <div class="ph-app">
      <Nav active={segments[0] === 'marketplace' ? 'Marketplace' : segments[0] === 'products' ? 'Pricing' : 'Catalog'} />
      <main class="ph-main"><h1>Summer · needs action</h1></main>
    </div>
  );
}

const rows = [['Camisa linho natural', 'R$ 249', '42%', 'Review price'], ['Calça costa pedra', 'R$ 289', '48%', 'Healthy'], ['Tricô sal', 'R$ 199', '39%', 'Low stock'], ['Bolsa lona', 'R$ 129', '51%', 'Missing offer'], ['Vestido maré', 'R$ 319', '44%', 'Healthy']];

function Tile() {
  return (
    <div class="ph-tile">
      <div class="ph-tile-nav"><b>Product Hub</b><span>Catalog</span><span>Pricing</span><span>Audit</span></div>
      <div class="ph-tile-body">
        <small>HQ merchandising · dense tables</small>
        <strong>Summer · needs action</strong>
        <table>
          <tbody>
            {rows.map(([name, price, margin, status], index) => (
              <tr key={name}><td><i class={`sw sw${index}`} />{name}</td><td>{price}</td><td>{margin}</td><td><em class={status === 'Healthy' ? 'ok' : 'warn'}>{status}</em></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
