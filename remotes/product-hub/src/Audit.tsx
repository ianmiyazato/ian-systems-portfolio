import { Banner, Layer, LiveControl, ProvenancePanel, closeLayers, openLayer, useDemoState, useLiveEvents, useLocation, type Provenance } from '@portfolio/remote-runtime';
import { brl } from '@portfolio/mocks';
import { clock } from '@portfolio/world';
import { useMemo, useState } from 'preact/hooks';

type Entry = {
  id: string;
  when: string;
  action: string;
  actor: 'agent' | 'human';
  agent?: string;
  model?: string;
  approver: string;
  decision: 'Approved' | 'Edited, then approved' | 'Rejected' | 'Auto-applied (policy)';
  outcome: string;
  outcomeTone: 'ok' | 'bad' | 'pending';
  provenance?: Provenance;
};

const pricing = (price: string, evalScore: number): Provenance => ({
  sources: [{ label: 'sales · 28 days', score: 0.93 }, { label: 'competitor prices · 6 sellers', score: 0.88 }, { label: 'price rules v12', score: 0.97 }],
  tools: [
    { tool: 'fetch_sales_history', ms: 84, output: '412 units · sell-through 52% → 44%' },
    { tool: 'get_competitor_prices', ms: 212, output: `median R$231 · proposal ${price}` },
    { tool: 'forecast_elasticity', ms: 356, output: '+18% units ± 4%' },
    { tool: 'check_guardrails', ms: 31, output: 'pass 4/4' }
  ],
  route: 'ft-pricing-v2 · fine-tuned, no escalation',
  evalScore,
  tokens: { input: 3_412, output: 286 },
  cost: 0.0019,
  trace: '/pulse/harness?trace=7f3a'
});

/** The last week of AI-assisted catalog decisions and what happened afterwards. */
const entries: Entry[] = [
  { id: 'AU-9121', when: 'Sep 26 · 15:02', action: 'Price · Natural linen shirt R$249 → R$219 until Oct 12', actor: 'agent', agent: 'Pricing agent', model: 'ft-pricing-v2', approver: 'Lara', decision: 'Edited, then approved', outcome: 'measuring · first read Oct 3', outcomeTone: 'pending', provenance: pricing('R$219', 0.91) },
  { id: 'AU-9114', when: 'Sep 25 · 11:40', action: 'Mapping · 212 Linho & Co rows (color, size, care)', actor: 'agent', agent: 'Mapping agent', model: 'ft-mapping-v4', approver: 'Nina', decision: 'Approved', outcome: '0 errors in the next feed', outcomeTone: 'ok', provenance: { ...pricing('—', 0.94), route: 'ft-mapping-v4 · fine-tuned', tools: [{ tool: 'sample_feed', ms: 120, output: '212 rows' }, { tool: 'match_attributes', ms: 480, output: '198 auto · 14 review' }, { tool: 'check_taxonomy', ms: 66, output: 'pass' }], tokens: { input: 9_880, output: 1_204 }, cost: 0.0061, trace: '/pulse/harness?trace=5c11' } },
  { id: 'AU-9109', when: 'Sep 24 · 17:22', action: 'Price · Pleated midi skirt R$239 → R$199', actor: 'agent', agent: 'Pricing agent', model: 'ft-pricing-v2', approver: 'Rui', decision: 'Rejected', outcome: 'margin would fall to 27% (floor 30%)', outcomeTone: 'bad', provenance: pricing('R$199', 0.78) },
  { id: 'AU-9102', when: 'Sep 23 · 09:15', action: 'Bulk tag · 38 SKUs “Summer 27 · swim”', actor: 'human', approver: 'Lara', decision: 'Auto-applied (policy)', outcome: 'campaign pages built', outcomeTone: 'ok' },
  { id: 'AU-9096', when: 'Sep 22 · 16:48', action: 'Price · Leather everyday sneakers R$389 → R$359', actor: 'agent', agent: 'Pricing agent', model: 'ft-pricing-v2', approver: 'Otavio', decision: 'Approved', outcome: 'sell-through +6 pts in 7 days', outcomeTone: 'ok', provenance: pricing('R$359', 0.9) },
  { id: 'AU-9088', when: 'Sep 21 · 10:05', action: 'Copy · 12 product descriptions (EN)', actor: 'agent', agent: 'Content agent', model: 'large · escalated: brand voice', approver: 'Nina', decision: 'Edited, then approved', outcome: 'returns “not as pictured” −2 pts', outcomeTone: 'ok', provenance: { ...pricing('—', 0.88), route: 'large model · escalated from ft-content-v1 (brand voice)', tools: [{ tool: 'fetch_product_facts', ms: 90, output: '12 products' }, { tool: 'draft_copy', ms: 2_140, output: '12 drafts' }, { tool: 'brand_voice_judge', ms: 610, output: '11 pass · 1 rewrite' }], tokens: { input: 14_220, output: 3_960 }, cost: 0.0412, trace: '/pulse/harness?trace=3e90' } }
];

type Filter = 'all' | 'agent' | 'human' | 'rejected';

export function Audit() {
  const state = useDemoState();
  const { params } = useLocation();
  const [filter, setFilter] = useState<Filter>('all');
  // Approvals made on a product page in any tab arrive here as price.changed events.
  const live = useLiveEvents(['price.changed'], { limit: 10 });
  const recent = useMemo<Entry[]>(() => live.items.map((event) => ({
    id: `AU-${event.id.slice(-4).toUpperCase()}`,
    when: `Today · ${clock(Date.parse(event.at))}`,
    action: `Price · ${event.payload.name} ${brl(event.payload.fromCents / 100)} → ${brl(event.payload.toCents / 100)} for ${event.payload.untilDays} days`,
    actor: event.payload.source,
    agent: event.payload.source === 'agent' ? 'Pricing agent' : undefined,
    model: event.payload.model,
    approver: event.payload.approvedBy,
    decision: event.payload.reason.startsWith('Edited') ? 'Edited, then approved' : 'Approved',
    outcome: 'measuring · first read in 7 days',
    outcomeTone: 'pending',
    provenance: event.payload.source === 'agent' ? pricing(brl(event.payload.toCents / 100), 0.91) : undefined
  })), [live.items]);
  const all = state === 'empty' ? [] : [...recent, ...entries];
  const rows = all.filter((entry) => filter === 'all' || (filter === 'rejected' ? entry.decision === 'Rejected' : entry.actor === filter));
  const selected = params.get('drawer') === 'audit' ? all.find((entry) => entry.id === params.get('entry')) : undefined;
  const agentShare = all.length ? Math.round((all.filter((entry) => entry.actor === 'agent').length / all.length) * 100) : 0;

  return (
    <main class="ph-main" id="product-hub-audit">
      <div class="ph-title-row" data-anchor="ph-audit-head">
        <div>
          <h1>Audit</h1>
          <p class="ph-muted">Every catalog change: who proposed it, which model, who approved it, and what happened afterwards</p>
        </div>
        <LiveControl anchor="ph-audit-live" />
      </div>
      {state === 'error' && <Banner tone="risk" icon="!" title="Audit store read-only · new entries queue" anchor="ph-audit-error">Changes still write their audit events; this view catches up when the store returns.</Banner>}

      <div class="ph-kpis" data-anchor="ph-audit-kpis">
        <div><span>Changes · 7 days</span><strong>{all.length + 312}</strong><small>catalog-wide</small></div>
        <div><span>Proposed by agents</span><strong>{agentShare}%</strong><small>of the entries below</small></div>
        <div><span>Rejected or edited</span><strong>{all.filter((entry) => entry.decision !== 'Approved' && entry.decision !== 'Auto-applied (policy)').length}</strong><small>people changed the agent's mind</small></div>
        <div><span>Outcomes measured</span><strong>{all.filter((entry) => entry.outcomeTone !== 'pending').length}/{all.length}</strong><small>the rest are still in their window</small></div>
      </div>

      <section class="ph-table-wrap" aria-labelledby="audit-title" data-anchor="ph-audit-log">
        <header class="ph-table-head">
          <h2 id="audit-title">AI audit log</h2>
          <div class="ph-seg" role="group" aria-label="Filter entries">
            {([['all', 'All'], ['agent', 'Agent proposals'], ['human', 'Human edits'], ['rejected', 'Rejected']] as Array<[Filter, string]>).map(([id, label]) => (
              <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
        </header>
        <table class="ph-table">
          <thead><tr><th>When</th><th>Change</th><th>Proposed by</th><th>Decision</th><th>Outcome later</th><th /></tr></thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id} class={recent.includes(entry) && live.fresh.length ? 'is-arriving' : ''}>
                <td class="mono">{entry.when}</td>
                <td>{entry.action}</td>
                <td>{entry.actor === 'agent' ? <><b>{entry.agent}</b><small class="mono"> {entry.model}</small></> : <b>{entry.approver}</b>}</td>
                <td>{entry.decision}<small class="ph-muted"> · {entry.approver}</small></td>
                <td><span class={`ph-tag ${entry.outcomeTone === 'ok' ? 'ok' : entry.outcomeTone === 'bad' ? 'bad' : 'run'}`}>{entry.outcome}</span></td>
                <td>{entry.provenance ? <button type="button" class="ph-btn" onClick={() => openLayer({ drawer: 'audit', entry: entry.id })}>How this was made</button> : <span class="ph-muted">no AI</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div class="ph-empty"><strong>No entries</strong><p>Every approved change writes an entry here within a second.</p></div>}
      </section>

      {selected?.provenance && (
        <Layer kind="drawer" title="How this was made" eyebrow={`${selected.id} · ${selected.action}`} onClose={() => closeLayers(['drawer', 'entry'])} width={560} anchor="ph-provenance">
          <p class="ph-note"><b>{selected.decision}</b> by {selected.approver} · {selected.when}. Outcome: {selected.outcome}.</p>
          <ProvenancePanel provenance={selected.provenance} />
        </Layer>
      )}
    </main>
  );
}
