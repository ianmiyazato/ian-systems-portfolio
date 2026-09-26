'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { onUrlChange, pushLayer, readParams, setParams } from '@portfolio/overlays';

/** URL search params as React state; the URL is the single source of overlay truth. */
export function useParams() {
  const [params, setState] = useState(() => new URLSearchParams());
  useEffect(() => {
    setState(readParams());
    return onUrlChange(() => setState(readParams()));
  }, []);
  return params;
}

export const openLayer = (patch: Record<string, string | null>) => setParams(patch);
export const closeLayers = (keys: string[]) => setParams(Object.fromEntries(keys.map((key) => [key, null])));

type Kind = 'modal' | 'sheet' | 'drawer' | 'sub' | 'sub-drawer';
const classFor: Record<Kind, string> = { modal: 'ov-modal', sheet: 'ov-sheet', drawer: 'ov-drawer', sub: 'ov-sub', 'sub-drawer': 'ov-sub ov-sub-drawer' };

type LayerProps = { kind: Kind; title: string; eyebrow?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number; anchor?: string; level?: 1 | 2; className?: string };

export function Layer({ kind, title, eyebrow, onClose, children, footer, width, anchor, level = 1, className = '' }: LayerProps) {
  const ref = useRef<HTMLElement>(null);
  const id = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => (ref.current ? pushLayer(ref.current, () => close.current()) : undefined), []);
  return (
    <>
      <div className="ov-scrim" data-level={level} onClick={onClose} />
      <section ref={ref} className={`${classFor[kind]} ${className}`} role="dialog" aria-modal="true" aria-labelledby={id} data-anchor={anchor}
        style={width ? ({ '--ov-width': `${width}px`, '--ov-sub-width': `${width}px` } as React.CSSProperties) : undefined}>
        <header className="ov-head">
          <div>{eyebrow && <span className="ov-eyebrow">{eyebrow}</span>}<h2 id={id} className="ov-title">{title}</h2></div>
          <button type="button" className="ov-close" aria-label={`Close ${title}`} onClick={onClose}>×</button>
        </header>
        <div className="ov-body">{children}</div>
        {footer && <footer className="ov-foot">{footer}</footer>}
      </section>
    </>
  );
}

export function AiSurface({ title, meta, children, sources = [], actions, anchor, className = '', inline }: { title: string; meta?: string; children?: ReactNode; sources?: Array<{ label: string; score?: number }>; actions?: ReactNode; anchor?: string; className?: string; inline?: boolean }) {
  return (
    <section className={`ai-surface ${inline ? 'ai-inline' : ''} ${className}`} data-anchor={anchor} aria-label={`Simulated AI: ${title}`}>
      <header className="ai-head"><span className="ai-spark" aria-hidden="true" /><span className="ai-badge">Simulated AI</span>{meta && <span className="ai-meta">{meta}</span>}</header>
      <h3 className="ai-title">{title}</h3>
      {children && <div className="ai-body">{children}</div>}
      {sources.length > 0 && <ul className="ai-sources" aria-label="Sources">{sources.map((source) => <li className="ai-source" key={source.label}>{source.label}{source.score !== undefined && <b>{source.score.toFixed(2)}</b>}</li>)}</ul>}
      {actions && <div className="ai-actions">{actions}</div>}
    </section>
  );
}

export function useDemoState() {
  return useParams().get('state') ?? 'live';
}
