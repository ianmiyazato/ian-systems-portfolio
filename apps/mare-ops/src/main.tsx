import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { defineChrome } from '@portfolio/chrome';
import '@portfolio/tokens/styles.css';
import '@portfolio/tokens/fonts/portfolio';
import './style.css';
import { environment, loadDirectory, probe, type RemoteDirectory } from './federation';
import { RemoteBoundary, RemoteSlot } from './remote-host';

type Health = Record<string, { ok: boolean; version?: string } | undefined>;

const themes: Record<string, string> = { counter: 'counter', 'product-hub': 'product-hub', pay: 'pay', circle: 'circle', mesh: 'mesh' };

function usePath() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const update = () => setPath(location.pathname);
    window.addEventListener('popstate', update);
    window.addEventListener('im:urlchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('im:urlchange', update);
    };
  }, []);
  return path;
}

function App() {
  const path = usePath();
  const [dir, setDir] = useState<RemoteDirectory | null>(null);
  const [dirError, setDirError] = useState<Error | null>(null);
  const [health, setHealth] = useState<Health>({});
  const active = path.split('/')[3] ?? '';
  const entry = dir?.remotes.find((remote) => remote.name === active);

  useEffect(() => {
    loadDirectory().then(setDir, setDirError);
  }, []);

  useEffect(() => {
    if (!dir) return;
    void Promise.all(dir.remotes.map(async (remote) => [remote.name, await probe(dir, remote)] as const)).then((items) => setHealth(Object.fromEntries(items)));
  }, [dir]);

  useEffect(() => {
    document.documentElement.dataset.theme = entry ? themes[entry.name] ?? 'portfolio' : 'portfolio';
    document.title = entry ? `${entry.label} · Maré Ops` : 'Maré Ops · five systems, five design languages';
  }, [entry]);

  const healthy = dir ? dir.remotes.filter((remote) => health[remote.name]?.ok).length : 0;

  return (
    <>
      <im-portfolio-bar context={entry ? `Maré Ops · ${entry.label}` : 'Maré Ops'} />
      <nav className="host-switcher" aria-label="Maré Ops systems" data-anchor="host-switcher">
        <a className="host-mark" href="/mare/ops" aria-current={!entry ? 'page' : undefined}>maré ops</a>
        {dir?.remotes.map((remote) => {
          const state = health[remote.name];
          return (
            <a key={remote.name} href={`/mare/ops/${remote.name}`} aria-current={remote.name === active ? 'page' : undefined} title={state?.version ? `${remote.label} · v${state.version}` : remote.label}>
              <i className={state === undefined ? 'dot' : state.ok ? 'dot ok' : 'dot down'} aria-hidden="true" />
              {remote.label}
            </a>
          );
        })}
        <span className="host-health" data-anchor="host-health">
          {dir ? `${healthy}/${dir.remotes.length} remotes healthy` : 'loading directory'} · {environment()}
        </span>
      </nav>
      <main className={entry ? 'host-page' : 'host-index'} id="main">
        {dirError && <p className="host-error" role="alert">The remote directory is unavailable. The host is up; reload to retry.</p>}
        {dir && entry && (
          <RemoteBoundary key={entry.name} entry={entry}>
            {(retry) => <RemoteSlot dir={dir} entry={entry} mode="page" retry={retry} />}
          </RemoteBoundary>
        )}
        {dir && !entry && active && <NotFound />}
        {dir && !active && <Index dir={dir} />}
      </main>
      <footer className="im-footer">All names are fictitious · data is synthetic · AI behavior is simulated in v0.1</footer>
      <im-decision-lens />
      <im-command-palette />
    </>
  );
}

function Index({ dir }: { dir: RemoteDirectory }) {
  return (
    <>
      <section className="index-head" data-anchor="index-head">
        <span className="eyebrow">Runtime federation · {dir.remotes.length} independent bundles</span>
        <h1>One operating platform, five teams, five design languages.</h1>
        <p>
          Each tile below is a separately built remote, fetched at runtime from its own <code>mf-manifest.json</code> and mounted through{' '}
          <code>mount(el, ctx) → unmount</code>. If one fails, its boundary shows a designed fallback and the other four keep working.
        </p>
      </section>
      <div className="remote-grid" data-anchor="remote-grid">
        {dir.remotes.map((remote) => (
          <RemoteBoundary key={remote.name} entry={remote}>
            {(retry) => (
              <a className="remote-tile" href={`/mare/ops/${remote.name}`} aria-label={`Open ${remote.label}`}>
                <RemoteSlot dir={dir} entry={remote} mode="tile" retry={retry} />
              </a>
            )}
          </RemoteBoundary>
        ))}
      </div>
    </>
  );
}

function NotFound() {
  return (
    <section className="index-head">
      <span className="eyebrow">404 · no remote owns this route</span>
      <h1>This Maré system does not exist.</h1>
      <p><a href="/mare/ops">Back to the five systems</a></p>
    </section>
  );
}

// v0.2 renamed Balcão to Counter. The shell and vercel.json redirect with a 308; this covers
// the zone's own preview server so old /mare/ops/balcao links never render a 404.
if (/^\/mare\/ops\/balcao(\/|$)/.test(location.pathname)) history.replaceState(null, '', location.href.replace('/mare/ops/balcao', '/mare/ops/counter'));

defineChrome();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
