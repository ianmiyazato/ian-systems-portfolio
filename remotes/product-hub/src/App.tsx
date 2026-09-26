import type { RemoteContext } from '@portfolio/remote-runtime';
import { Link, useSegments } from '@portfolio/remote-runtime';
import { Catalog } from './Catalog';
import { Detail } from './Detail';
import { Onboarding } from './Onboarding';
import { Tile } from './Tile';

const tabs = [
  ['Catalog', '/mare/ops/product-hub'],
  ['Pricing', '/mare/ops/product-hub/products/510233?tab=pricing'],
  ['Availability', '/mare/ops/product-hub/products/510233?tab=stock'],
  ['Marketplace', '/mare/ops/product-hub/marketplace/onboarding/linho-co?step=mapping'],
  ['Imports', '/mare/ops/product-hub?view=imports'],
  ['Audit', '/mare/ops/product-hub/products/510233?tab=audit']
] as const;

function Nav({ active }: { active: string }) {
  return (
    <header class="ph-nav" data-anchor="ph-nav">
      <Link class="ph-logo" href="/mare/ops/product-hub"><span aria-hidden="true" />Product Hub</Link>
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
  const section = segments[0];
  return (
    <div class="ph-app">
      <Nav active={section === 'marketplace' ? 'Marketplace' : section === 'products' ? 'Pricing' : 'Catalog'} />
      {section === 'products' ? <Detail id={segments[1] ?? '510233'} /> : section === 'marketplace' ? <Onboarding seller={segments[2] ?? 'linho-co'} /> : <Catalog />}
    </div>
  );
}
