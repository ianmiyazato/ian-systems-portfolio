import type { ComponentType } from 'preact';
import { useEffect } from 'preact/hooks';
import { matchView, navIdFor, navItems, type RemoteName, type ViewId } from '@portfolio/routes';
import { Link, navigate, useLocation, useSegments } from './router';

export type ViewProps = { rest: string[] };

/**
 * The remote's views, keyed by the manifest's view ids. TypeScript requires exactly one
 * component per view in routes.manifest.ts, so a nav item can never exist without a screen.
 */
export type ViewTable<R extends RemoteName> = { [K in ViewId<R>]: ComponentType<ViewProps> };

/** Which manifest view the current URL is on (after legacy ?view= redirects). */
export function useView<R extends RemoteName>(remote: R, basePath: string) {
  const segments = useSegments(basePath);
  const { params } = useLocation();
  const match = matchView(remote, segments, params);
  useEffect(() => {
    // Old ?view=… links survive: replace, so Back does not bounce through the redirect.
    if (match.kind === 'redirect') navigate(match.href, { replace: true });
  }, [match.kind === 'redirect' ? match.href : '']);
  return match;
}

/** Nav items for the remote with the active one resolved; each remote styles its own nav. */
export function useNav<R extends RemoteName>(remote: R, basePath: string) {
  const match = useView(remote, basePath);
  const active = match.kind === 'view' ? navIdFor(remote, match.id) : null;
  return navItems(remote).map((item) => ({ ...item, current: item.id === active }));
}

export function ViewRouter<R extends RemoteName>({ remote, basePath, views, label }: { remote: R; basePath: string; views: ViewTable<R>; label: string }) {
  const match = useView(remote, basePath);
  if (match.kind === 'redirect') return <div class="view-redirect" role="status">Opening {label}…</div>;
  if (match.kind === 'not-found') return <NotFound remote={remote} label={label} segment={match.segment} />;
  const View = views[match.id] as ComponentType<ViewProps>;
  return <View rest={match.rest} />;
}

/** A designed, in-system "not found": the remote's own chrome stays up and offers every real view. */
export function NotFound({ remote, label, segment }: { remote: RemoteName; label: string; segment: string }) {
  return (
    <main class="view-not-found" data-not-found data-anchor="view-not-found">
      <span class="view-not-found-code" aria-hidden="true">404</span>
      <h1>{label} has no “{segment}” view</h1>
      <p>The link may be from an older version of Maré Ops. These are the views {label} ships today:</p>
      <ul>
        {navItems(remote).map((item) => (
          <li key={item.id}><Link href={item.href}>{item.title}</Link></li>
        ))}
      </ul>
    </main>
  );
}
