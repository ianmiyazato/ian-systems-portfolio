import type { RemoteContext } from '@portfolio/remote-runtime';
import { Link, useSegments } from '@portfolio/remote-runtime';

const pills = [['Program', '/mare/ops/circle'], ['Creators', '/mare/ops/circle?view=creators'], ['Campaigns', '/mare/ops/circle?view=campaigns'], ['Rules', '/mare/ops/circle/rules/summer-swim'], ['Payouts', '/mare/ops/circle?view=payouts']] as const;

export function PillNav({ active }: { active: string }) {
  return (
    <header class="cc-nav" data-anchor="cc-nav">
      <Link class="cc-logo" href="/mare/ops/circle">circle<sup>✺</sup></Link>
      <nav aria-label="Circle">
        {pills.map(([label, href]) => <Link key={label} href={href} aria-current={label === active ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <span class="cc-user" aria-label="Signed in as Bia, creator partnerships">BI</span>
    </header>
  );
}

export function App({ ctx }: { ctx: RemoteContext }) {
  const segments = useSegments(ctx.basePath);
  if (ctx.mode === 'tile') return <Tile />;
  return (
    <div class="cc-app">
      <PillNav active={segments[0] === 'rules' ? 'Rules' : 'Program'} />
      <main class="cc-main"><h1>318 creators sold R$ 2.1M this month</h1></main>
    </div>
  );
}

function Tile() {
  return (
    <div class="cc-tile">
      <small>Creator program · bouncy</small>
      <strong>318 creators sold <em>R$ 2.1M</em></strong>
      <span class="cc-sticker" aria-hidden="true">summer drop</span>
      <div class="cc-tile-avatars" aria-hidden="true">{['NC', 'JM', 'LB', 'TR', 'AK'].map((initials, index) => <i key={initials} style={{ '--i': index }}>{initials}</i>)}</div>
    </div>
  );
}
