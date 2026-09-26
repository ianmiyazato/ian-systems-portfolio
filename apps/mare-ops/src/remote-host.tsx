import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { dataConfig, environment, hostVersion, loadRemote, type LoadedRemote, type RemoteDirectory, type RemoteEntry } from './federation';

type BoundaryProps = { entry: RemoteEntry; children: (retry: number) => ReactNode };
type BoundaryState = { error: Error | null; retry: number };

/** Each remote fails inside its own boundary; the host and the other remotes keep running. */
export class RemoteBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, retry: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced for operators; the designed fallback below is what users see.
    console.warn(`[mare-ops] remote "${this.props.entry.name}" isolated after failure:`, error.message, info.componentStack?.split('\n')[1]?.trim());
  }

  render() {
    const { error, retry } = this.state;
    if (error) return <RemoteFallback entry={this.props.entry} error={error} onRetry={() => this.setState({ error: null, retry: retry + 1 })} />;
    return this.props.children(retry);
  }
}

export function RemoteFallback({ entry, error, onRetry }: { entry: RemoteEntry; error: Error; onRetry: () => void }) {
  return (
    <article className="remote-fallback" data-remote-status="error" data-remote={entry.name} data-anchor="remote-fallback">
      <div className="fallback-mark" aria-hidden="true"><span /><span /><span /></div>
      <div>
        <span className="fallback-eyebrow">{entry.label} · remote unavailable</span>
        <h2>{entry.label} is isolated, not broken for everyone.</h2>
        <p>The {entry.label} bundle ({entry.job}) could not load, so the host kept it inside its boundary. Every other Maré system is still running.</p>
        <code>{error.message}</code>
        <div className="fallback-actions">
          <button type="button" onClick={onRetry}>Retry {entry.label}</button>
          <a href="/mare/ops">Open the other systems</a>
        </div>
      </div>
    </article>
  );
}

type SlotProps = { dir: RemoteDirectory; entry: RemoteEntry; mode: 'page' | 'tile'; retry: number; onReady?: (remote: LoadedRemote) => void };

export function RemoteSlot({ dir, entry, mode, retry, onReady }: SlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ status: 'loading' | 'ready'; remote?: LoadedRemote; error?: Error }>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let unmount: (() => void) | undefined;
    setState({ status: 'loading' });
    loadRemote(dir, entry, retry)
      .then((remote) => {
        if (cancelled || !ref.current) return;
        unmount = remote.module.mount(ref.current, {
          name: entry.name,
          basePath: `/mare/ops/${entry.name}`,
          mode,
          environment: environment(),
          locale: 'pt-BR',
          data: dataConfig(),
          hostVersion
        });
        setState({ status: 'ready', remote });
        onReady?.(remote);
      })
      .catch((error: Error) => !cancelled && setState({ status: 'loading', error }));
    return () => {
      cancelled = true;
      unmount?.();
    };
    // onReady is intentionally excluded: it only reports upward.
  }, [dir, entry, mode, retry]);

  // Throwing hands the failure to the nearest RemoteBoundary.
  if (state.error) throw state.error;
  return (
    <div className={`remote-slot remote-slot-${mode}`} data-remote={entry.name} data-remote-status={state.status} data-remote-version={state.remote?.manifest.version} aria-busy={state.status === 'loading'}>
      {state.status === 'loading' && <RemoteSkeleton label={entry.label} mode={mode} />}
      <div ref={ref} className="remote-mount" />
    </div>
  );
}

function RemoteSkeleton({ label, mode }: { label: string; mode: 'page' | 'tile' }) {
  return (
    <div className={`remote-skeleton skeleton-${mode}`} role="status">
      <span className="visually-hidden">Loading {label} remote</span>
      <i className="skeleton" /><i className="skeleton" /><i className="skeleton" />
    </div>
  );
}
