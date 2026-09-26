import type { ComponentChildren } from 'preact';

export type Source = { label: string; score?: number };

type AiSurfaceProps = {
  title: string;
  meta?: string;
  children?: ComponentChildren;
  sources?: Source[];
  actions?: ComponentChildren;
  anchor?: string;
  className?: string;
  inline?: boolean;
};

/** The one shared AI surface: sparkle, "Simulated AI", sources, explicit human action. */
export function AiSurface({ title, meta, children, sources = [], actions, anchor, className = '', inline }: AiSurfaceProps) {
  return (
    <section class={`ai-surface ${inline ? 'ai-inline' : ''} ${className}`} data-anchor={anchor} aria-label={`Simulated AI: ${title}`}>
      <header class="ai-head">
        <span class="ai-spark" aria-hidden="true" />
        <span class="ai-badge">Simulated AI</span>
        {meta && <span class="ai-meta">{meta}</span>}
      </header>
      <h3 class="ai-title">{title}</h3>
      {children && <div class="ai-body">{children}</div>}
      {sources.length > 0 && (
        <ul class="ai-sources" aria-label="Sources">
          {sources.map((source) => (
            <li class="ai-source" key={source.label}>
              {source.label}
              {source.score !== undefined && <b>{source.score.toFixed(2)}</b>}
            </li>
          ))}
        </ul>
      )}
      {actions && <div class="ai-actions">{actions}</div>}
    </section>
  );
}
