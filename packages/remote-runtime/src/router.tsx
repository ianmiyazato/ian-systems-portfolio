import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { navigate, onUrlChange, readParams, setParams } from '@portfolio/overlays';

export { navigate, setParams };

export type Location = { pathname: string; params: URLSearchParams };

const snapshot = (): Location => ({ pathname: location.pathname.replace(/\/+$/, '') || '/', params: readParams() });

/** Re-renders on pushState/popstate; the URL is the only router state. */
export function useLocation(): Location {
  const [value, setValue] = useState(snapshot);
  useEffect(() => onUrlChange(() => setValue(snapshot())), []);
  return value;
}

/** Path segments below the remote's base, e.g. ['pick', 'MR-904117']. */
export function useSegments(basePath: string): string[] {
  const { pathname } = useLocation();
  return pathname.startsWith(basePath) ? pathname.slice(basePath.length).split('/').filter(Boolean) : [];
}

export function useParam(key: string): string | null {
  return useLocation().params.get(key);
}

type LinkProps = Omit<JSX.HTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; children?: ComponentChildren; replace?: boolean };

/** In-zone navigation without a reload; modified clicks keep native behaviour. */
export function Link({ href, children, replace, ...rest }: LinkProps) {
  return (
    <a
      {...rest}
      href={href}
      onClick={(event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!href.startsWith('/mare/ops')) return;
        event.preventDefault();
        navigate(href, { replace });
      }}
    >
      {children}
    </a>
  );
}

/** Open or close URL-addressable overlays: openLayer({ modal: 'handover', order: 'MR-904112' }). */
export function openLayer(patch: Record<string, string | null>) {
  setParams(patch);
}

export function closeLayers(keys: string[]) {
  setParams(Object.fromEntries(keys.map((key) => [key, null])));
}
