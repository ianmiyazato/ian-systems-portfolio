import { Link } from '@portfolio/remote-runtime';
import { store } from '@portfolio/mocks';

const tabs = [
  ['Orders', '/mare/ops/balcao'],
  ['Picking', '/mare/ops/balcao/pick/MR-904117'],
  ['Returns', '/mare/ops/balcao?view=returns'],
  ['Stock lookup', '/mare/ops/balcao?view=stock']
] as const;

export function TopBar({ active }: { active: string }) {
  return (
    <header class="bc-bar" data-anchor="bc-topbar">
      <Link class="bc-wordmark" href="/mare/ops/balcao">balcão</Link>
      <span class="bc-store">{store.name} · {store.code}</span>
      <nav class="bc-tabs" aria-label="Balcão">
        {tabs.map(([label, href]) => (
          <Link key={label} href={href} aria-current={label === active ? 'page' : undefined}>{label}</Link>
        ))}
      </nav>
      <span class="bc-cutoff" data-anchor="bc-cutoff"><i aria-hidden="true" />Carrier {store.cutoff} · {store.cutoffIn}</span>
      <span class="bc-staff" aria-label="Signed in as Ana, shift lead">AN</span>
    </header>
  );
}
