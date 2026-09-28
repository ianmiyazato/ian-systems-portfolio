import { provenanceFor } from '@portfolio/ai-sim';
import { escapeHtml } from './shared';

/**
 * Every AI card in every stack gets "How this was made": the one AI trust surface is a CSS contract,
 * so chrome can read any `.ai-surface` (title, sources) and add the disclosure after hydration.
 * Cards that already explain themselves (a [data-how] button or an .ai-provenance panel) are left alone.
 */
function sourcesOf(card: HTMLElement) {
  return [...card.querySelectorAll<HTMLElement>('.ai-source')].map((item) => {
    const score = item.querySelector('b')?.textContent?.trim();
    const label = (item.childNodes[0]?.textContent ?? item.textContent ?? '').replace(score ?? '', '').trim();
    const value = score ? Number.parseFloat(score) : undefined;
    return { label, score: value !== undefined && value <= 1 ? value : undefined };
  });
}

function enhance(card: HTMLElement) {
  card.dataset.provenance = 'on';
  if (card.querySelector('.ai-provenance, [data-how], .ai-how')) return;
  const title = (card.querySelector('.ai-title')?.textContent ?? card.getAttribute('aria-label')?.replace(/^Simulated AI:\s*/, '') ?? 'AI suggestion').trim();
  const provenance = provenanceFor(title, sourcesOf(card), card.dataset.model);
  const total = provenance.tools.reduce((sum, tool) => sum + tool.ms, 0);
  const details = document.createElement('details');
  details.className = 'ai-how';
  details.innerHTML = `<summary>How this was made</summary>
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
    <a class="ai-how-trace" href="/pulse/harness?q=${encodeURIComponent(title)}">Open the trace in the Pulse harness →</a>`;
  card.append(details);
}

let scheduled = false;
function scan() {
  scheduled = false;
  document.querySelectorAll<HTMLElement>('.ai-surface:not([data-provenance])').forEach(enhance);
}

export function enhanceAiSurfaces() {
  scan();
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  }).observe(document.body, { childList: true, subtree: true });
}
