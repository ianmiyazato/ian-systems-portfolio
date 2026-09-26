import type { RemoteContext, RemoteManifest, RemoteModule } from '@portfolio/remote-runtime/types';

export type Environment = RemoteContext['environment'];
export type RemoteEntry = { name: string; label: string; job: string; manifest: string };
export type RemoteDirectory = { baseUrl: Record<Environment, string>; remotes: RemoteEntry[] };
export type LoadedRemote = { manifest: RemoteManifest; module: RemoteModule; manifestUrl: string };

declare const __VERCEL_ENV__: string;
declare const __DEPLOYMENT_URL__: string;
declare const __HOST_VERSION__: string;

export const hostVersion = __HOST_VERSION__;

export function environment(): Environment {
  if (import.meta.env.DEV || __VERCEL_ENV__ === 'development') return 'development';
  return __VERCEL_ENV__ === 'preview' ? 'preview' : 'production';
}

export function dataConfig(): RemoteContext['data'] {
  const mode = import.meta.env.PUBLIC_DATA_MODE === 'supabase' ? 'supabase' : 'local';
  return { mode, supabaseUrl: import.meta.env.PUBLIC_SUPABASE_URL, supabaseKey: import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY };
}

let directory: Promise<RemoteDirectory> | null = null;

export function loadDirectory(): Promise<RemoteDirectory> {
  directory ??= fetch(`${import.meta.env.BASE_URL}remotes.config.json`).then((response) => {
    if (!response.ok) throw new Error(`Remote directory returned ${response.status}`);
    return response.json() as Promise<RemoteDirectory>;
  });
  return directory;
}

export function manifestUrl(dir: RemoteDirectory, entry: RemoteEntry) {
  const base = dir.baseUrl[environment()].replace('{deployment}', __DEPLOYMENT_URL__ || location.origin);
  return new URL(entry.manifest.replace('{base}', base), location.href).href;
}

const cache = new Map<string, Promise<LoadedRemote>>();

function loadStyles(urls: string[]) {
  return Promise.all(
    urls.map(
      (href) =>
        new Promise<void>((resolve, reject) => {
          if (document.querySelector(`link[data-remote-css="${CSS.escape(href)}"]`)) return resolve();
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = href;
          link.dataset.remoteCss = href;
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Stylesheet failed: ${href}`));
          document.head.append(link);
        })
    )
  );
}

/** Fetch manifest → load the remote's own CSS → import its entry at runtime. */
export function loadRemote(dir: RemoteDirectory, entry: RemoteEntry, attempt = 0): Promise<LoadedRemote> {
  const key = `${entry.name}:${attempt}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const promise = (async () => {
    const url = manifestUrl(dir, entry);
    const response = await fetch(attempt ? `${url}?retry=${attempt}` : url, { cache: attempt ? 'reload' : 'default' });
    if (!response.ok) throw new Error(`${entry.name} manifest returned HTTP ${response.status}`);
    const manifest = (await response.json()) as RemoteManifest;
    if (manifest.contract !== 'mount(el, ctx) -> unmount') throw new Error(`${entry.name} exposes an unknown contract`);
    await loadStyles(manifest.css.map((file) => new URL(file, url).href));
    const module = (await import(/* @vite-ignore */ new URL(manifest.entry, url).href)) as RemoteModule;
    if (typeof module.mount !== 'function') throw new Error(`${entry.name} does not export mount()`);
    return { manifest, module, manifestUrl: url };
  })();
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}

/** Lightweight health probe for the switcher: manifest reachable + version. */
export async function probe(dir: RemoteDirectory, entry: RemoteEntry): Promise<{ ok: boolean; version?: string; builtAt?: string }> {
  try {
    const response = await fetch(manifestUrl(dir, entry));
    if (!response.ok) return { ok: false };
    const manifest = (await response.json()) as RemoteManifest;
    return { ok: true, version: manifest.version, builtAt: manifest.builtAt };
  } catch {
    return { ok: false };
  }
}
