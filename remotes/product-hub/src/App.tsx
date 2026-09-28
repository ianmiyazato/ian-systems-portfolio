import type { RemoteContext, ViewTable } from '@portfolio/remote-runtime';
import { DensityToggle, Link, ViewRouter, useDensity, useNav, type Density } from '@portfolio/remote-runtime';
import { Catalog } from './Catalog';
import { Detail } from './Detail';
import { Onboarding } from './Onboarding';
import { Availability } from './Availability';
import { Imports } from './Imports';
import { Audit } from './Audit';
import { Tile } from './Tile';

/** Every Product Hub view in routes.manifest.ts, and nothing else (TypeScript checks both ways). */
const views: ViewTable<'product-hub'> = {
  catalog: () => <Catalog />,
  product: ({ rest }) => <Detail id={rest[0] ?? '510233'} />,
  availability: () => <Availability />,
  marketplace: ({ rest }) => <Onboarding seller={rest[1] ?? 'linho-co'} />,
  imports: () => <Imports />,
  audit: () => <Audit />
};

function Nav({ basePath, density, setDensity }: { basePath: string; density: Density; setDensity: (density: Density) => void }) {
  const nav = useNav('product-hub', basePath);
  return (
    <header class="ph-nav" data-anchor="ph-nav">
      <Link class="ph-logo" href="/mare/ops/product-hub"><span aria-hidden="true" />Product Hub</Link>
      <nav aria-label="Product Hub" data-shortcut-nav>
        {nav.map((item) => <Link key={item.id} href={item.href} aria-current={item.current ? 'page' : undefined}>{item.title}</Link>)}
      </nav>
      <label class="ph-search"><span class="visually-hidden">Search catalog</span><input data-shortcut-search placeholder="Search SKU, name, owner…" /><kbd>/</kbd></label>
      <DensityToggle value={density} onChange={setDensity} />
      <span class="ph-user" aria-label="Signed in as Lara, merchandising">LA</span>
    </header>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  const [density, setDensity] = useDensity('product-hub');
  if (ctx.mode === 'tile') return <Tile />;
  return (
    <div class="ph-app" data-density={density}>
      <Nav basePath={ctx.basePath} density={density} setDensity={setDensity} />
      <ViewRouter remote="product-hub" basePath={ctx.basePath} views={views} label="Product Hub" />
    </div>
  );
}
