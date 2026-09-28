import { AiSurface, Banner, Layer, Tween, closeLayers, openLayer, useDemoState, useLocation } from '@portfolio/remote-runtime';
import { useEffect, useState } from 'preact/hooks';
import { brl } from './ui';

const versions = [
  { id: 'v8', label: 'v8 · draft', note: 'Rui · today 15:40', status: 'draft' },
  { id: 'v7', label: 'v7 · current', note: 'published Aug 18', status: 'current' },
  { id: 'v6', label: 'v6', note: 'Jun 3 → Aug 18', status: 'retired' },
  { id: 'v5', label: 'v5', note: 'Mar 21 → Jun 3', status: 'retired' }
];

const bands = [
  { range: 'Below 560', v7: 'Decline', v8: 'Decline' },
  { range: '560–619', v7: 'Manual review · up to R$4,000', v8: 'Manual review · up to R$4,000' },
  { range: '620–699', v7: 'Auto-approve · up to R$6,000', v8: 'Auto-approve · up to R$7,000' },
  { range: '700 and above', v7: 'Auto-approve · up to R$12,000', v8: 'Auto-approve · up to R$12,000' }
];

type Change = { kind: 'changed' | 'added' | 'removed'; rule: string; before?: string; after?: string };
const changes: Change[] = [
  { kind: 'changed', rule: 'Limit band 620–699', before: 'up to R$6,000', after: 'up to R$7,000' },
  { kind: 'added', rule: 'Utilization ≥ 90% on existing limits', after: 'route to manual review' },
  { kind: 'changed', rule: 'Maré Pay Credit installments', before: 'up to 10×, interest from 4×', after: 'up to 12×, interest from 7×' },
  { kind: 'removed', rule: 'Exception: second card within 30 days', before: 'always decline' }
];
const conflictChange: Change = { kind: 'added', rule: 'Score ≥ 600 with tenure over 2 years', after: 'auto-approve · up to R$5,000' };

const impact = [
  { label: 'Approvals', value: 3.1, unit: 'pts', detail: '+2,940 customers approved', good: true },
  { label: 'Expected losses', value: 0.18, unit: 'pts', detail: '+R$212k over 12 months', good: false },
  { label: 'Manual reviews', value: -6, unit: '%', detail: '−410 reviews a month', good: true }
];

type Approval = 'none' | 'sent' | 'approved' | 'published';

export function Policies() {
  const state = useDemoState();
  const { params } = useLocation();
  const conflict = state === 'conflict';
  const [simulated, setSimulated] = useState(false);
  const [running, setRunning] = useState(false);
  const [approval, setApproval] = useState<Approval>('none');
  const draftChanges = conflict ? [...changes, conflictChange] : changes;

  // Simulated second approver: Lara reviews the diff and the replay, then signs.
  useEffect(() => {
    if (approval !== 'sent') return;
    const id = setTimeout(() => setApproval('approved'), 2200);
    return () => clearTimeout(id);
  }, [approval]);

  const run = () => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setSimulated(true); }, 1400);
  };

  return (
    <main class="py-main" id="pay-policies">
      <header class="py-page-head" data-anchor="py-policies-head">
        <div>
          <span class="py-eyebrow">Maré Pay · Credit policy</span>
          <h1>Policies</h1>
          <p>Credit policy is versioned like code: readable rules, a diff, a replay of the last 30 days, and two people to publish.</p>
        </div>
      </header>
      {conflict && (
        <Banner tone="risk" icon="!" title="Draft v8b conflicts with itself · 2 rules match scores 600–619" anchor="py-policy-conflict">
          “560–619 → manual review” and “score ≥ 600 with tenure over 2 years → auto-approve” both match 1,120 applications a month. Pick an order or narrow one rule; publishing is blocked until then.
        </Banner>
      )}
      {approval === 'published' && <Banner tone="success" icon="✓" title="v8 published · effective for new applications now" anchor="py-policy-published">v7 stays available for rollback; decisions record which version made them.</Banner>}

      <div class="py-policies">
        <nav class="py-versions" aria-label="Policy versions" data-anchor="py-policy-versions">
          {versions.map((version) => (
            <a key={version.id} href="#diff" class={`py-version ${version.status}`} aria-current={version.id === 'v8' ? 'true' : undefined}><b>{conflict && version.id === 'v8' ? 'v8b · draft' : version.label}</b><small>{version.note}</small></a>
          ))}
        </nav>

        <div class="py-policy-body">
          <section class="py-rule-cards" data-anchor="py-rule-cards">
            <article class="py-panel">
              <header><h2>Limit bands by score</h2><span class="py-pill ok">v7</span></header>
              <dl class="py-bands">
                {bands.map((band) => <div key={band.range} class={conflict && band.range === '560–619' ? 'conflict' : ''}><dt>{band.range}</dt><dd>{band.v7}</dd></div>)}
              </dl>
            </article>
            <article class="py-panel">
              <header><h2>Installments</h2><span class="py-pill ok">v7</span></header>
              <ul class="py-rules"><li><b>Maré Pay Credit</b> up to 10×, interest from 4×</li><li><b>Maré Pay Store</b> 3× interest-free at Maré</li><li><b>Minimum installment</b> R$40</li></ul>
            </article>
            <article class="py-panel">
              <header><h2>Exceptions</h2><span class="py-pill ok">v7</span></header>
              <ul class="py-rules"><li><b>Thin file</b> → manual review</li><li><b>Address mismatch</b> → document check</li><li><b>Second card within 30 days</b> → decline</li></ul>
            </article>
          </section>

          <section class="py-panel" id="diff" aria-labelledby="diff-title" data-anchor="py-policy-diff">
            <header><h2 id="diff-title">v7 → {conflict ? 'v8b' : 'v8'} · {draftChanges.length} changes</h2><span class="py-muted">authored by Rui · today 15:40</span></header>
            <ul class="py-diff">
              {draftChanges.map((change) => (
                <li key={change.rule} class={`${change.kind} ${conflict && change === conflictChange ? 'conflict' : ''}`}>
                  <span class="py-diff-kind">{change.kind}</span>
                  <b>{change.rule}</b>
                  {change.before && <del>{change.before}</del>}
                  {change.after && <ins>{change.after}</ins>}
                </li>
              ))}
            </ul>
          </section>

          <div class="py-grid">
            <section class="py-panel span-2" aria-labelledby="impact-title" data-anchor="py-policy-impact">
              <header><h2 id="impact-title">Impact on the last 30 days</h2><button type="button" class="py-btn" disabled={running} onClick={run}>{running ? 'Replaying 94,210 decisions…' : simulated ? 'Run again' : 'Run simulation'}</button></header>
              <div class="py-impact">
                {impact.map((item) => (
                  <div key={item.label} class={item.good ? 'good' : 'bad'}>
                    <span>{item.label}</span>
                    <strong>{simulated ? <Tween value={item.value} format={(value) => `${value > 0 ? '+' : ''}${item.unit === 'pts' ? value.toFixed(2) : Math.round(value)} ${item.unit}`} /> : '—'}</strong>
                    <small>{simulated ? item.detail : 'run to see'}</small>
                    <i style={{ '--w': simulated ? Math.min(Math.abs(item.value) / 6, 1) : 0 }} />
                  </div>
                ))}
              </div>
              {running && <div class="py-progress" role="progressbar" aria-label="Replaying decisions" aria-valuemin={0} aria-valuemax={100}><i /></div>}
            </section>

            <section class="py-panel" aria-labelledby="approve-title" data-anchor="py-policy-approval">
              <header><h2 id="approve-title">Two-person approval</h2></header>
              <ol class="py-approvals">
                <li class="done"><span aria-hidden="true">✓</span>Rui · author · signed 15:40</li>
                <li class={approval === 'approved' || approval === 'published' ? 'done' : approval === 'sent' ? 'now' : ''}><span aria-hidden="true">{approval === 'approved' || approval === 'published' ? '✓' : '2'}</span>{approval === 'none' ? 'Second approver' : approval === 'sent' ? 'Lara · reviewing…' : 'Lara · approved just now'}</li>
              </ol>
              {approval === 'approved'
                ? <button type="button" class="py-btn gold wide" onClick={() => setApproval('published')}>Publish v8</button>
                : <button type="button" class="py-btn primary wide" disabled={conflict || !simulated || approval !== 'none'} onClick={() => openLayer({ modal: 'approve-policy' })}>Request approval</button>}
              <p class="py-muted">{conflict ? 'Resolve the conflict first.' : !simulated ? 'Run the simulation first; approvers see its results.' : 'The author cannot approve their own change.'}</p>
            </section>
          </div>

          <AiSurface inline title="Losses rise less than approvals · safe to trial" meta="policy simulator · 0.88" anchor="py-policy-ai" sources={[{ label: 'decisions · 30 days', score: 0.95 }, { label: 'loss curves by band', score: 0.87 }]}>
            Most of the added approvals sit at scores 640–699 with low utilization. Consider 7 days at 25% of traffic before full rollout.
          </AiSurface>
        </div>
      </div>

      {params.get('modal') === 'approve-policy' && <ApproveModal onSent={() => { setApproval('sent'); closeLayers(['modal']); }} />}
    </main>
  );
}

function ApproveModal({ onSent }: { onSent: () => void }) {
  const [approver, setApprover] = useState('Lara');
  return (
    <Layer kind="modal" title="Request approval for v8" eyebrow="Credit policy · two-person rule" onClose={() => closeLayers(['modal'])} width={520} anchor="py-approve-policy"
      footer={<button type="button" class="py-btn primary wide" onClick={onSent}>Send to {approver}</button>}>
      <fieldset class="py-radios">
        <legend class="visually-hidden">Approver</legend>
        {[['Lara', 'Head of credit risk · online'], ['Renata', 'Credit policy lead · in a meeting']].map(([name, role]) => (
          <label key={name} class={approver === name ? 'checked' : ''}><input type="radio" name="approver" checked={approver === name} onChange={() => setApprover(name!)} /><strong>{name}</strong><small>{role}</small></label>
        ))}
      </fieldset>
      <p class="py-muted">They see the diff, the 30-day replay ({brl(212_000)} added expected losses) and your note. Rui cannot approve: authors never approve their own policy.</p>
    </Layer>
  );
}
