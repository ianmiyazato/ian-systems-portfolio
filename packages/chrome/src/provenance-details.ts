import { provenanceFor } from '@portfolio/ai-sim';
import { escapeHtml } from './shared';

function sourcesOf(card: HTMLElement) {
  return [...card.querySelectorAll<HTMLElement>('.ai-source')].map((item) => {
    const score = item.querySelector('b')?.textContent?.trim();
    const label = (item.childNodes[0]?.textContent ?? item.textContent ?? '').replace(score ?? '', '').trim();
    const value = score ? Number.parseFloat(score) : undefined;
    return { label, score: value !== undefined && value <= 1 ? value : undefined };
  });
}

/** Render the expensive audit record only after its native details disclosure is opened. */
export function renderProvenance(details: HTMLDetailsElement, card: HTMLElement) {
  const title = (card.querySelector('.ai-title')?.textContent ?? card.getAttribute('aria-label')?.replace(/^Simulated AI:\s*/, '') ?? 'AI suggestion').trim();
  const provenance = provenanceFor(title, sourcesOf(card), card.dataset.model);
  const total = provenance.tools.reduce((sum, tool) => sum + tool.ms, 0);
  details.insertAdjacentHTML('beforeend', `
    <dl class="ai-prov-facts">
      <div><dt>Model route</dt><dd>${escapeHtml(provenance.route)}</dd></div>
      <div><dt>Eval score</dt><dd>${provenance.evalScore.toFixed(2)}</dd></div>
      <div><dt>Tokens</dt><dd>${provenance.tokens.input.toLocaleString('en-US')} in · ${provenance.tokens.output.toLocaleString('en-US')} out</dd></div>
      <div><dt>Simulated cost</dt><dd>$${provenance.cost.toFixed(4)}</dd></div>
    </dl>
    <h4>Retrieved sources</h4>
    <ul class="ai-prov-tools">${provenance.sources.map((source) => `<li><span>${escapeHtml(source.label)}</span><b>${source.score !== undefined ? source.score.toFixed(2) : '—'}</b></li>`).join('')}</ul>
    <h4>Tool calls · ${total} ms</h4>
    <ul class="ai-prov-tools">${provenance.tools.map((tool) => `<li><span>${escapeHtml(tool.tool)}</span><small>${escapeHtml(tool.output)}</small><b>${tool.ms} ms</b></li>`).join('')}</ul>
    <a class="ai-how-trace" href="/pulse/harness?q=${encodeURIComponent(title)}">Open the trace in the Pulse harness →</a>`);
}
