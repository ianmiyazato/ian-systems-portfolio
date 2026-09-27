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

/** What produced an AI suggestion: the "How this was made" record every AI card links to. */
export type Provenance = {
  sources: Source[];
  tools: Array<{ tool: string; ms: number; output: string }>;
  /** e.g. "ft-pricing-v2" (fine-tuned) or "large · escalated: low confidence". */
  route: string;
  evalScore: number;
  tokens: { input: number; output: number };
  /** Simulated USD cost of the run. */
  cost: number;
  trace: string;
};

export function ProvenancePanel({ provenance, anchor }: { provenance: Provenance; anchor?: string }) {
  const total = provenance.tools.reduce((sum, tool) => sum + tool.ms, 0);
  return (
    <section class="ai-provenance" data-anchor={anchor} aria-label="How this was made">
      <dl class="ai-prov-facts">
        <div><dt>Model route</dt><dd>{provenance.route}</dd></div>
        <div><dt>Eval score</dt><dd>{provenance.evalScore.toFixed(2)}</dd></div>
        <div><dt>Tokens</dt><dd>{provenance.tokens.input.toLocaleString('en-US')} in · {provenance.tokens.output.toLocaleString('en-US')} out</dd></div>
        <div><dt>Simulated cost</dt><dd>${provenance.cost.toFixed(4)}</dd></div>
      </dl>
      <h4>Tool calls · {total} ms</h4>
      <ol class="ai-prov-tools">
        {provenance.tools.map((tool) => (
          <li key={tool.tool}><code>{tool.tool}</code><span>{tool.output}</span><b>{tool.ms} ms</b><i style={{ '--w': tool.ms / total }} aria-hidden="true" /></li>
        ))}
      </ol>
      <h4>Retrieved sources</h4>
      <ul class="ai-sources">{provenance.sources.map((source) => <li class="ai-source" key={source.label}>{source.label}{source.score !== undefined && <b>{source.score.toFixed(2)}</b>}</li>)}</ul>
      <a class="ai-prov-trace" href={provenance.trace}>Open the trace in the AI harness →</a>
    </section>
  );
}
