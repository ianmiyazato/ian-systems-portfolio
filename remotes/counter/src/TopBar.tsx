import { Link, useNav, useSimNow } from '@portfolio/remote-runtime';
import { duration } from '@portfolio/world';
import { nextCutoff } from './live';
import { store } from '@portfolio/mocks';

/** Tabs come from routes.manifest.ts, so every tab is a real screen. */
export function TopBar({ basePath }: { basePath: string }) {
  const nav = useNav('counter', basePath);
  const now = useSimNow();
  const cutoff = nextCutoff(now);
  return (
    <header class="ct-bar" data-anchor="ct-topbar">
      <Link class="ct-wordmark" href="/mare/ops/counter">counter</Link>
      <span class="ct-store">{store.name} · {store.code}</span>
      <nav class="ct-tabs" aria-label="Counter">
        {nav.map((item) => (
          <Link key={item.id} href={item.href} aria-current={item.current ? 'page' : undefined}>{item.title}</Link>
        ))}
      </nav>
      <span class="ct-cutoff" data-anchor="ct-cutoff"><i aria-hidden="true" />Carrier {cutoff.at} · {duration(cutoff.ms - now)}</span>
      <span class="ct-staff" aria-label="Signed in as Ana, shift lead">AN</span>
    </header>
  );
}
