import { Link } from '@portfolio/remote-runtime';
import { store } from '@portfolio/mocks';

const tabs = [
  ['Orders', '/mare/ops/counter'],
  ['Picking', '/mare/ops/counter/pick/MR-904117'],
  ['Returns', '/mare/ops/counter?view=returns'],
  ['Stock lookup', '/mare/ops/counter?view=stock']
] as const;

export function TopBar({ active }: { active: string }) {
  return (
    <header class="ct-bar" data-anchor="ct-topbar">
      <Link class="ct-wordmark" href="/mare/ops/counter">counter</Link>
      <span class="ct-store">{store.name} · {store.code}</span>
      <nav class="ct-tabs" aria-label="Counter">
        {tabs.map(([label, href]) => (
          <Link key={label} href={href} aria-current={label === active ? 'page' : undefined}>{label}</Link>
        ))}
      </nav>
      <span class="ct-cutoff" data-anchor="ct-cutoff"><i aria-hidden="true" />Carrier {store.cutoff} · {store.cutoffIn}</span>
      <span class="ct-staff" aria-label="Signed in as Ana, shift lead">AN</span>
    </header>
  );
}
