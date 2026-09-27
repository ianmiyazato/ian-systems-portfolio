import type { RemoteContext, ViewTable } from '@portfolio/remote-runtime';
import { Link, ViewRouter, useNav } from '@portfolio/remote-runtime';
import { Program } from './Program';
import { RuleBuilder } from './RuleBuilder';
import { Creators } from './Creators';
import { Campaigns } from './Campaigns';
import { Payouts } from './Payouts';

/** Every Circle view in routes.manifest.ts, and nothing else (TypeScript checks both ways). */
const views: ViewTable<'circle'> = {
  program: () => <Program />,
  creators: () => <Creators />,
  campaigns: () => <Campaigns />,
  rules: ({ rest }) => <RuleBuilder id={rest[0] ?? 'summer-swim'} />,
  payouts: () => <Payouts />
};

function PillNav({ basePath }: { basePath: string }) {
  const nav = useNav('circle', basePath);
  return (
    <header class="cc-nav" data-anchor="cc-nav">
      <Link class="cc-logo" href="/mare/ops/circle">circle<sup aria-hidden="true">✺</sup></Link>
      <nav aria-label="Circle">
        {nav.map((item) => <Link key={item.id} href={item.href} aria-current={item.current ? 'page' : undefined}>{item.title}</Link>)}
      </nav>
      <span class="cc-user" aria-label="Signed in as Bia, creator partnerships">BI</span>
    </header>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  if (ctx.mode === 'tile') return <Tile />;
  return (
    <div class="cc-app">
      <PillNav basePath={ctx.basePath} />
      <ViewRouter remote="circle" basePath={ctx.basePath} views={views} label="Circle" />
    </div>
  );
}

function Tile() {
  return (
    <div class="cc-tile">
      <small>Creator program · bouncy</small>
      <strong>318 creators sold <em>R$2.1M</em></strong>
      <span class="cc-sticker" aria-hidden="true">summer drop</span>
      <div class="cc-tile-avatars" aria-hidden="true">{['NC', 'JM', 'ML', 'TR', 'AK'].map((initials, index) => <i key={initials} style={{ '--i': index }}>{initials}</i>)}</div>
    </div>
  );
}
