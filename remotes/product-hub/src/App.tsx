import type { RemoteContext, ViewTable } from '@portfolio/remote-runtime';
import { Link, ViewRouter, useNav } from '@portfolio/remote-runtime';
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

function Nav({ basePath }: { basePath: string }) {
  const nav = useNav('product-hub', basePath);
  return (
    <header class="ph-nav" data-anchor="ph-nav">
      <Link class="ph-logo" href="/mare/ops/product-hub"><span aria-hidden="true" />Product Hub</Link>
      <nav aria-label="Product Hub">
        {nav.map((item) => <Link key={item.id} href={item.href} aria-current={item.current ? 'page' : undefined}>{item.title}</Link>)}
      </nav>
      <label class="ph-search"><span class="visually-hidden">Search catalog</span><input placeholder="Search SKU, name, owner…" /><kbd>/</kbd></label>
      <span class="ph-user" aria-label="Signed in as Lara, merchandising">LA</span>
    </header>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  if (ctx.mode === 'tile') return <Tile />;
  return (
    <div class="ph-app">
      <Nav basePath={ctx.basePath} />
      <ViewRouter remote="product-hub" basePath={ctx.basePath} views={views} label="Product Hub" />
    </div>
  );
}
