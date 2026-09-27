import { remoteViews, routes, systems, type RemoteName, type RouteEntry, type System, type SystemId, type ViewDef, type ViewId } from './routes.manifest';

export * from './routes.manifest';

export const opsBase = '/mare/ops';
export const overlayKeys = ['modal', 'drawer', 'sheet', 'sub'] as const;

export const parityRoutes = routes.filter((route) => route.parity !== false);

export function systemOf(id: SystemId): System {
  return systems.find((system) => system.id === id) ?? systems[0]!;
}

export function routeById(id: string): RouteEntry | undefined {
  return routes.find((route) => route.id === id);
}

/** Overlay params a deep link opens, e.g. { modal: 'handover', sub: 'third-party' }. */
export function overlayParams(route: RouteEntry): Record<string, string> {
  const url = new URL(route.href, 'https://portfolio.invalid');
  return Object.fromEntries(overlayKeys.filter((key) => url.searchParams.has(key)).map((key) => [key, url.searchParams.get(key)!]));
}

/** Resolve the route for a location: same path, then the most specific overlay match. */
export function resolveScreen(pathname: string, search = ''): RouteEntry | undefined {
  const path = normalise(pathname);
  const params = new URLSearchParams(search);
  const candidates = routes
    .map((route) => {
      const url = new URL(route.href, 'https://portfolio.invalid');
      if (!pathMatches(normalise(url.pathname), path)) return null;
      const required = overlayKeys.filter((key) => url.searchParams.has(key));
      const satisfied = required.every((key) => params.get(key) === url.searchParams.get(key));
      const exact = normalise(url.pathname) === path;
      return { route, score: (satisfied ? required.length * 10 : -required.length) + (exact ? 5 : 0) };
    })
    .filter((candidate): candidate is { route: RouteEntry; score: number } => candidate !== null)
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.route;
}

export function normalise(path: string) {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Segments after these collections are ids or slugs, so any value resolves to the artboard. */
const collections = new Set(['pick', 'products', 'onboarding', 'applications', 'rules', 'partners', 'invoices', 'companies', 'session', 'sessions', 'academy']);

function pathMatches(pattern: string, path: string) {
  if (pattern === path) return true;
  const a = pattern.split('/');
  const b = path.split('/');
  if (a.length !== b.length) return false;
  return a.every((segment, index) => segment === b[index] || collections.has(a[index - 1] ?? ''));
}

/* Remote views ------------------------------------------------------------------------------ */

export function viewsOf<R extends RemoteName>(remote: R): readonly ViewDef[] {
  return remoteViews[remote];
}

export function viewHref(remote: RemoteName, view: ViewDef): string {
  const path = view.navPath ?? view.segment;
  return path ? `${opsBase}/${remote}/${path}` : `${opsBase}/${remote}`;
}

/** Nav items for a remote, in manifest order. */
export function navItems<R extends RemoteName>(remote: R): Array<{ id: ViewId<R>; title: string; href: string }> {
  return viewsOf(remote)
    .filter((view) => view.nav)
    .map((view) => ({ id: view.id as ViewId<R>, title: view.title, href: viewHref(remote, view) }));
}

/** The nav item to highlight for a view (itself, or its parent for detail views). */
export function navIdFor<R extends RemoteName>(remote: R, id: ViewId<R>): ViewId<R> {
  const view = viewsOf(remote).find((item) => item.id === id);
  return (view?.parent ?? id) as ViewId<R>;
}

export type ViewMatch<R extends RemoteName> =
  | { kind: 'view'; id: ViewId<R>; rest: string[] }
  | { kind: 'redirect'; href: string }
  | { kind: 'not-found'; segment: string };

/**
 * Map a location to a view. Legacy `?view=<id>` links (v0.1 nav) redirect to the path route so
 * old links survive; an unknown segment is a designed not-found, never a blank screen.
 */
export function matchView<R extends RemoteName>(remote: R, segments: string[], params: URLSearchParams): ViewMatch<R> {
  const views = viewsOf(remote);
  const legacy = params.get('view');
  if (legacy !== null && segments.length === 0) {
    const target = views.find((view) => view.id === legacy || view.segment === legacy);
    const next = new URLSearchParams(params);
    next.delete('view');
    const query = next.toString();
    if (target) return { kind: 'redirect', href: `${viewHref(remote, target).split('?')[0]}${query ? `?${query}` : ''}` };
    return { kind: 'not-found', segment: legacy };
  }
  const [first = '', ...rest] = segments;
  const view = views.find((item) => item.segment === first);
  return view ? { kind: 'view', id: view.id as ViewId<R>, rest } : { kind: 'not-found', segment: first };
}
