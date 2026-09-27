import { AiSurface, Banner, Layer, LiveControl, Tween, closeLayers, openLayer, useDemoState, useLocation, useWorldEvents } from '@portfolio/remote-runtime';
import { seedOf } from '@portfolio/mocks';
import { useState } from 'preact/hooks';

const registry = [
  { id: 'ft-risk-v4', role: 'Challenger', auc: '0.83', trained: 'Sep 14, 2026', data: 'Jan–Aug 2026 · 1.9M applications', owner: 'Risk DS · Lara' },
  { id: 'ft-risk-v3', role: 'Champion', auc: '0.81', trained: 'Jun 2, 2026', data: 'Oct 2025–May 2026 · 1.6M', owner: 'Risk DS · Rui' },
  { id: 'ft-risk-v2', role: 'Retired', auc: '0.78', trained: 'Jan 9, 2026', data: 'Jun–Dec 2025 · 1.1M', owner: 'Risk DS · Rui' }
];

/** Expected bad rate (%) at each approval rate (%) on the holdout; lower is better. */
const approvals = [40, 50, 60, 70, 80, 90];
const champion = [0.9, 1.3, 1.9, 2.7, 3.9, 5.8];
const challenger = [0.8, 1.1, 1.6, 2.3, 3.4, 5.2];

type Gate = { label: string; detail: string; value: string; status: 'pass' | 'pending' | 'fail' };

/** Feature drift for utilization_ratio: share of applications per bucket, training vs last 7 days. */
const buckets = ['0–20%', '20–40%', '40–60%', '60–80%', '80–100%'];
const training = [0.24, 0.27, 0.22, 0.17, 0.1];
const recent = [0.2, 0.24, 0.23, 0.2, 0.13];
const drifted = [0.12, 0.18, 0.22, 0.26, 0.22];

export function Models() {
  const state = useDemoState();
  const { params } = useLocation();
  const drift = state === 'drift';
  const [split, setSplit] = useState(20);
  const [scored, setScored] = useState({ champion: 12_408, challenger: 3_101 });
  const [scheduled, setScheduled] = useState(false);

  // Each scored authorization is routed by a stable hash, so the split is sticky per customer.
  useWorldEvents(['auth.scored'], (event) => {
    const toChallenger = !drift && seedOf(event.payload.account) % 100 < split;
    setScored((current) => (toChallenger ? { ...current, challenger: current.challenger + 1 } : { ...current, champion: current.champion + 1 }));
  });

  const gates: Gate[] = [
    { label: 'Backtest on holdout', detail: 'AUC 0.83 vs 0.81 · KS 0.46', value: '+0.02 AUC', status: 'pass' },
    { label: 'Fairness across 4 cohorts', detail: 'approval-rate ratio ≥ 0.80 for age, region, gender, income band', value: '0.87 min ratio', status: 'pass' },
    { label: 'Approval band stability', detail: 'share routed to manual review within ±2 pts', value: '+0.6 pts', status: 'pass' },
    { label: '60-day delinquency', detail: 'first challenger cohort matures on Nov 26', value: '[value]', status: 'pending' },
    { label: 'Human agreement', detail: 'reviewers blind-label 200 challenger decisions; 142 done', value: '[value]', status: 'pending' }
  ];
  const promotable = gates.every((gate) => gate.status === 'pass');
  const shown = drift ? drifted : recent;
  const psi = drift ? 0.27 : 0.08;
  const x = (approval: number) => 40 + ((approval - 40) / 50) * 460;
  const y = (bad: number) => 190 - (bad / 6) * 170;
  const line = (values: number[]) => values.map((value, index) => `${index ? 'L' : 'M'}${x(approvals[index]!)},${y(value)}`).join(' ');

  return (
    <main class="py-main" id="pay-models">
      <header class="py-page-head" data-anchor="py-models-head">
        <div>
          <span class="py-eyebrow">Maré Pay · Model registry</span>
          <h1>Models</h1>
          <p>Credit models ship like code: a challenger earns traffic through release gates, and nothing unmeasured is reported as measured.</p>
        </div>
        <LiveControl anchor="py-models-live" />
      </header>
      {drift && (
        <Banner tone="warn" icon="!" title="Drift · PSI 0.27 on utilization_ratio (warning at 0.20)" anchor="py-models-drift">
          Challenger routing is paused and 18–24 applications go to manual review until the risk team signs off on a retrain.
        </Banner>
      )}

      <section class="py-panel" aria-labelledby="registry-title" data-anchor="py-registry">
        <header>
          <h2 id="registry-title">Registry</h2>
          <button type="button" class="py-btn" disabled={drift} onClick={() => openLayer({ modal: 'traffic' })}>Shift challenger traffic</button>
        </header>
        <table class="py-table">
          <thead><tr><th>Model</th><th>Role</th><th>Traffic</th><th>AUC</th><th>Trained</th><th>Training data</th><th>Owner</th></tr></thead>
          <tbody>
            {registry.map((model) => {
              const traffic = model.role === 'Champion' ? (drift ? 100 : 100 - split) : model.role === 'Challenger' ? (drift ? 0 : split) : 0;
              return (
                <tr key={model.id} class={model.role === 'Challenger' ? 'highlight' : ''}>
                  <td><b class="py-mono">{model.id}</b></td>
                  <td><span class={`py-status ${model.role === 'Champion' ? 'ok' : model.role === 'Challenger' ? 'late' : 'frozen'}`}>{model.role}</span></td>
                  <td><span class="py-split" style={{ '--u': traffic / 100 }}><i /></span><small class="py-muted"> {traffic}%</small></td>
                  <td>{model.auc}</td>
                  <td>{model.trained}</td>
                  <td class="py-muted">{model.data}</td>
                  <td>{model.owner}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p class="py-muted" data-anchor="py-scored">Scored today · champion <b><Tween value={scored.champion} /></b> · challenger <b><Tween value={scored.challenger} /></b></p>
      </section>

      <div class="py-grid">
        <section class="py-panel span-2" aria-labelledby="curve-title" data-anchor="py-curve">
          <header><h2 id="curve-title">Champion vs challenger · approval rate vs expected bad rate</h2><ul class="py-legend"><li class="champion">ft-risk-v3</li><li class="challenger">ft-risk-v4</li></ul></header>
          <svg class="py-curve" viewBox="0 0 520 220" role="img" aria-label="At every approval rate from 40% to 90%, ft-risk-v4 has a lower expected bad rate than ft-risk-v3; at 70% approval, 2.3% versus 2.7%">
            <defs><clipPath id="py-reveal"><rect class="py-reveal" x="0" y="0" width="520" height="220" /></clipPath></defs>
            {[0, 2, 4, 6].map((tick) => <g key={tick}><line class="grid" x1="40" x2="500" y1={y(tick)} y2={y(tick)} /><text x="32" y={y(tick) + 4} text-anchor="end">{tick}%</text></g>)}
            {approvals.map((approval) => <text key={approval} x={x(approval)} y="210" text-anchor="middle">{approval}%</text>)}
            <g clip-path="url(#py-reveal)">
              <path class="champion" d={line(champion)} />
              <path class="challenger" d={line(challenger)} />
            </g>
            <line class="marker" x1={x(70)} x2={x(70)} y1="20" y2="190" />
            <text class="marker-label" x={x(70) + 6} y="30">today's cut · 70% approval</text>
          </svg>
        </section>

        <section class="py-panel" aria-labelledby="gates-title" data-anchor="py-gates">
          <header><h2 id="gates-title">Release gates · ft-risk-v4</h2></header>
          <ul class="py-gates">
            {gates.map((gate) => (
              <li key={gate.label} class={gate.status}>
                <span aria-hidden="true">{gate.status === 'pass' ? '✓' : gate.status === 'pending' ? '◷' : '!'}</span>
                <div><b>{gate.label}</b><small>{gate.detail}</small></div>
                <em title={gate.value === '[value]' ? 'Not measured yet' : undefined}>{gate.value}</em>
              </li>
            ))}
          </ul>
          <button type="button" class="py-btn primary wide" disabled={!promotable}>Promote to champion</button>
          {!promotable && <p class="py-muted">Blocked until 60-day delinquency and human agreement are measured.</p>}
        </section>
      </div>

      <div class="py-grid">
        <section class="py-panel span-2" aria-labelledby="drift-title" data-anchor="py-drift-hist">
          <header><h2 id="drift-title">Feature drift · utilization_ratio</h2><span class={`py-pill ${psi > 0.2 ? 'decline' : 'ok'}`}>PSI {psi.toFixed(2)}</span></header>
          <div class="py-drift" role="img" aria-label={`Training versus last 7 days: ${buckets.map((bucket, index) => `${bucket} ${Math.round(training[index]! * 100)}% vs ${Math.round(shown[index]! * 100)}%`).join(', ')}`}>
            {buckets.map((bucket, index) => (
              <div key={bucket} class="py-drift-col">
                <div class="py-drift-bars"><i class="train" style={{ '--h': training[index]! / 0.3 }} /><i class="now" style={{ '--h': shown[index]! / 0.3, '--i': index }} /></div>
                <small>{bucket}</small>
              </div>
            ))}
          </div>
          <ul class="py-legend"><li class="train">training</li><li class="now">last 7 days</li></ul>
        </section>

        <AiSurface title="Retraining plan" meta="proposed by the model-ops agent" anchor="py-retrain"
          sources={[{ label: 'PSI monitor · 7 days', score: 0.92 }, { label: 'outcome labels · Aug cohort', score: 0.86 }]}
          actions={<button type="button" class="ai-approve" disabled={scheduled} onClick={() => setScheduled(true)}>{scheduled ? 'Scheduled for Oct 3' : 'Schedule retraining'}</button>}>
          <ol class="py-plan">
            <li>Label 60-day outcomes for the August cohort</li>
            <li>Retrain with utilization in 5 buckets (drift-robust)</li>
            <li>7 days in shadow, then fairness review</li>
            <li>Challenger at 10% → 20% through the same gates</li>
          </ol>
        </AiSurface>
      </div>

      {params.get('modal') === 'traffic' && <TrafficShift split={split} onDone={(next) => { setSplit(next); closeLayers(['modal']); }} />}
    </main>
  );
}

function TrafficShift({ split, onDone }: { split: number; onDone: (split: number) => void }) {
  const [next, setNext] = useState(split);
  return (
    <Layer kind="modal" title="Shift challenger traffic" eyebrow="ft-risk-v4 · canary" onClose={() => closeLayers(['modal'])} width={520} anchor="py-traffic"
      footer={<button type="button" class="py-btn primary wide" onClick={() => onDone(next)}>Route {next}% to the challenger</button>}>
      <div class="py-limit">
        <label for="py-split">Challenger share <output>{next}%</output></label>
        <div class="py-slider"><input id="py-split" type="range" min={0} max={50} step={5} value={next} style={{ '--fill': `${(next / 50) * 100}%` }} onInput={(event) => setNext(Number(event.currentTarget.value))} /></div>
      </div>
      <p class="py-muted">Capped at 50% until every release gate passes. Routing hashes the account, so a customer always sees the same model; the change applies to new decisions within a minute.</p>
    </Layer>
  );
}
