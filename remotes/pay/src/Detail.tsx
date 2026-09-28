import { AiSurface, Banner, Layer, Link, closeLayers, openLayer, useDemoState, useLocation, useTween } from '@portfolio/remote-runtime';
import { useState } from 'preact/hooks';
import { applications, BASE_SCORE, brl, factors, POLICY_MAX_REVIEW } from './data';

export function Detail({ id }: { id: string }) {
  const { params } = useLocation();
  const state = useDemoState();
  const app = applications.find((item) => item.id === id) ?? applications[0]!;
  const [outcome, setOutcome] = useState<'approved' | 'pending' | null>(state === 'approved' ? 'approved' : null);
  const sweep = useTween(1, 1600);
  const max = Math.max(...factors.map((factor) => Math.abs(factor.points)));
  const declined = state === 'declined';

  return (
    <main class="py-main">
      <Link class="py-back" href="/mare/ops/pay">← Applications</Link>
      <header class="py-detail-head" data-anchor="py-detail-head">
        <div>
          <span class="py-eyebrow">{app.id} · {app.product} · applied 14:02 in the app</span>
          <h1>{app.name} · {brl(app.amount)} requested</h1>
        </div>
        <div class="py-gauge" aria-label={`Score ${app.score}, manual review band`}>
          <svg viewBox="0 0 120 70" aria-hidden="true">
            <path class="track" d="M10 62 A50 50 0 0 1 110 62" />
            <path class="fill" d="M10 62 A50 50 0 0 1 110 62" style={{ strokeDashoffset: 157 - 157 * ((app.score - 400) / 400) * sweep }} />
          </svg>
          <strong>{Math.round(400 + (app.score - 400) * sweep)}</strong>
          <small>review band 560–620</small>
        </div>
        <div class="py-head-actions">
          <button type="button" class="py-btn">Request document</button>
          <button type="button" class="py-btn primary" onClick={() => openLayer({ modal: 'decision' })} data-anchor="py-decide">Decide</button>
        </div>
      </header>

      {outcome === 'approved' && <Banner tone="success" icon="✓" title="Approved · Credit + Store · R$4,000 limit" anchor="py-approved">Bruno gets the virtual card in the app now; the physical card ships tomorrow. Decision, factors and reviewer are in the audit log.</Banner>}
      {outcome === 'pending' && <Banner tone="warn" icon="◷" title="Sent for approval · Renata A. · SLA 2 h" anchor="py-pending">The R$6,000 limit is above the review-band maximum. Bruno sees "in review" until Renata decides.</Banner>}
      {declined && <DeclineLetter />}

      <div class="py-grid">
        <section class="py-panel span-2" aria-labelledby="why-title" data-anchor="py-contributions">
          <header><h2 id="why-title">Why the score is {app.score}</h2><span class="py-muted">base {BASE_SCORE} · ft-risk-v3</span></header>
          <ol class="py-factors">
            {factors.map((factor) => {
              const width = (Math.abs(factor.points) / max) * 50 * sweep;
              return (
                <li key={factor.label}>
                  <div class="py-factor-label"><strong>{factor.label}</strong><small>{factor.detail}</small></div>
                  <div class="py-diverge" aria-hidden="true">
                    <span class="axis" />
                    <span class={factor.points > 0 ? 'bar pos' : 'bar neg'} style={factor.points > 0 ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }} />
                  </div>
                  <b class={factor.points > 0 ? 'pos' : 'neg'}>{factor.points > 0 ? '+' : '−'}{Math.abs(factor.points)}</b>
                </li>
              );
            })}
          </ol>
        </section>

        <AiSurface title="Model explanation" meta="grounded · 0.91" anchor="py-explanation"
          sources={[{ label: 'bureau · 14:03', score: 0.95 }, { label: 'Store card history · 14 mo', score: 0.92 }, { label: 'address docs', score: 0.84 }, { label: 'policy 44', score: 0.9 }]}>
          <p>Bruno pays his Store card on time and his income is stable, but he uses 82% of existing limits and the proof of address is from another city. Policy 44 routes 560–620 to a person; the mismatch alone would not decline him.</p>
          <p class="py-suggest">Suggested: approve Credit + Store at R$4,000 and request an updated address.</p>
        </AiSurface>

        <section class="py-panel" aria-labelledby="timeline-title" data-anchor="py-timeline">
          <header><h2 id="timeline-title">Timeline</h2></header>
          <ol class="py-timeline">
            <li class="done"><b>14:02</b>Applied in the Maré app</li>
            <li class="done"><b>14:02</b>Identity verified · selfie + document</li>
            <li class="done"><b>14:03</b>Bureau pulled · 3 inquiries in 30 days</li>
            <li class="done"><b>14:03</b>Score 588 → manual review band</li>
            <li class="warn"><b>14:05</b>Address mismatch flagged</li>
            <li class="now"><b>now</b>Waiting for an analyst · 12 min</li>
          </ol>
        </section>

        <section class="py-panel" aria-labelledby="docs-title" data-anchor="py-documents">
          <header><h2 id="docs-title">Documents</h2></header>
          <ul class="py-docs">
            <li class="ok"><span aria-hidden="true">✓</span><div><strong>ID verified</strong><small>RG · liveness 0.98</small></div></li>
            <li class="warn"><span aria-hidden="true">!</span><div><strong>Address mismatch</strong><small>Bill in Campinas · application in São Paulo</small></div></li>
            <li class="ok"><span aria-hidden="true">✓</span><div><strong>Income</strong><small>3 payslips · R$7,800 / month</small></div></li>
          </ul>
        </section>
      </div>

      {params.get('modal') === 'decision' && (
        <Decision
          onApprove={() => { setOutcome('approved'); closeLayers(['modal', 'sub']); }}
          onSend={() => { setOutcome('pending'); closeLayers(['modal', 'sub']); }}
        />
      )}
    </main>
  );
}

function Decision({ onApprove, onSend }: { onApprove: () => void; onSend: () => void }) {
  const { params } = useLocation();
  const [product, setProduct] = useState<'store' | 'both'>('both');
  const [limit, setLimit] = useState(6000);
  const [reason, setReason] = useState('');
  const above = limit > POLICY_MAX_REVIEW;
  const min = 500;
  const max = 10000;
  const markerLeft = ((POLICY_MAX_REVIEW - min) / (max - min)) * 100;

  return (
    <>
      <Layer
        kind="modal"
        title="Choose credit products"
        eyebrow="AP-77118 · Bruno S. · decision"
        onClose={() => closeLayers(['modal', 'sub'])}
        width={620}
        anchor="py-decision"
        footer={
          <>
            <button type="button" class="py-btn" onClick={() => closeLayers(['modal', 'sub'])}>Cancel</button>
            <button type="button" class="py-btn primary" data-shortcut="approve" onClick={() => (above ? openLayer({ sub: 'override' }) : onApprove())}>Continue</button>
          </>
        }
      >
        <fieldset class="py-radios" data-anchor="py-products">
          <legend class="visually-hidden">Products</legend>
          <label class={product === 'store' ? 'checked' : ''}>
            <input type="radio" name="product" checked={product === 'store'} onChange={() => setProduct('store')} />
            <span class="py-mini-card store" aria-hidden="true" />
            <strong>Store only</strong><small>In-store and app purchases · 3× without interest</small>
          </label>
          <label class={product === 'both' ? 'checked' : ''}>
            <input type="radio" name="product" checked={product === 'both'} onChange={() => setProduct('both')} />
            <span class="py-mini-card credit" aria-hidden="true" />
            <strong>Credit + Store</strong><small>Visa card accepted anywhere, plus Store benefits</small>
          </label>
        </fieldset>
        <div class="py-limit" data-anchor="py-limit">
          <label for="py-limit-input">Credit limit <output>{brl(limit)}</output></label>
          <div class="py-slider">
            <input id="py-limit-input" type="range" min={min} max={max} step={500} value={limit} onInput={(event) => setLimit(Number(event.currentTarget.value))} style={{ '--fill': `${((limit - min) / (max - min)) * 100}%` }} />
            <span class="py-marker" style={{ left: `${markerLeft}%` }}><i />policy max {brl(POLICY_MAX_REVIEW)}</span>
          </div>
        </div>
        {above && (
          <div class="py-warning" role="alert" data-anchor="py-above-band">
            <b aria-hidden="true">!</b>
            <p><strong>Above the review-band policy max.</strong> Scores 560–620 are capped at {brl(POLICY_MAX_REVIEW)}. Continuing needs a policy override and a second approver.</p>
          </div>
        )}
      </Layer>
      {params.get('sub') === 'override' && (
        <Layer
          kind="sub"
          level={2}
          title="Policy override"
          eyebrow="Needs a second approver"
          onClose={() => closeLayers(['sub'])}
          width={460}
          anchor="py-override"
          footer={<button type="button" class="py-btn gold wide" disabled={reason.trim().length < 12} onClick={onSend}>Send for approval</button>}
        >
          <span class="py-exception">Exception · limit {brl(limit)} above band max {brl(POLICY_MAX_REVIEW)}</span>
          <label class="py-field">
            Reason
            <textarea rows={4} value={reason} placeholder="e.g. 14 months on time on the Store card; income verified; address mismatch explained by a recent move." onInput={(event) => setReason(event.currentTarget.value)} />
          </label>
          <div class="py-approver" data-anchor="py-approver">
            <span class="py-avatar" aria-hidden="true">RA</span>
            <div><strong>Renata A.</strong><small>Credit risk lead · policy 44 owner</small></div>
            <span class="py-online"><i />online</span>
          </div>
          <p class="py-muted small">Bruno sees "in review" until Renata decides. If she doesn't within 2 h, the application falls back to {brl(POLICY_MAX_REVIEW)}.</p>
        </Layer>
      )}
    </>
  );
}

export function DeclineLetter() {
  return (
    <section class="py-letter" aria-labelledby="letter-title" data-anchor="py-letter">
      <header><span class="py-pill decline">Declined · AP-77090</span><span class="py-muted">letter preview · sent in the app and by email</span></header>
      <h2 id="letter-title">About your Maré Pay application</h2>
      <p>Hi Otavio, we couldn't approve a Maré Pay card this time. The main reasons were:</p>
      <ol><li>Several recent credit inquiries (3 in the last 30 days).</li><li>High use of existing credit limits.</li><li>Short credit history with Maré.</li></ol>
      <p>You can apply again in 90 days, or ask us to review this decision with a person. This decision did not use your gender, age, address region or any protected attribute.</p>
    </section>
  );
}
