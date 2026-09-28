import { AiSurface, Banner, Link, LiveControl, Tween, getWorld, useDemoState, useTween, useWorldEvents, type WorldEvent } from '@portfolio/remote-runtime';
import { seedOf } from '@portfolio/mocks';
import { useState } from 'preact/hooks';
import { applications, bandFor, brl, histogram, REVIEW_BAND, type Application } from './data';
import { PayCard } from './PayCard';
import { DeclineLetter } from './Detail';
import { Recap, RecapChip, useRecap } from './Recap';

/** One in five Maré Pay checkouts from a new customer is a credit application; the score is stable per order. */
function applicationFrom(event: WorldEvent): Application | null {
  if (event.topic !== 'orders.placed' || (event.payload.payment !== 'pay-credit' && event.payload.payment !== 'pay-store')) return null;
  const hash = seedOf(event.payload.orderId);
  if (hash % 5 !== 0) return null;
  const score = 470 + (hash % 300);
  return { id: `AP-${77200 + (hash % 700)}`, name: `${event.payload.customer} ${String.fromCharCode(65 + (hash % 26))}.`, amount: 1000 + (hash % 9) * 500, score, product: event.payload.payment === 'pay-credit' ? 'Credit' : 'Store', age: 'just now', band: bandFor(score) };
}

export function Applications() {
  const state = useDemoState();
  const [live, setLive] = useState<Application[]>(() => getWorld().recent(['orders.placed'], 60).map(applicationFrom).filter((item): item is Application => item !== null).slice(-2).reverse());
  const [fresh, setFresh] = useState<string | null>(null);
  useWorldEvents(['orders.placed'], (event) => {
    const application = applicationFrom(event);
    if (!application) return;
    setLive((current) => [application, ...current.filter((item) => item.id !== application.id)].slice(0, 4));
    setFresh(application.id);
  });
  const rows = state === 'empty' ? [] : [...live, ...applications];
  const inReview = 37 + live.filter((item) => item.band === 'Review').length;
  const liveBins = histogram.map((bin) => ({ ...bin, count: bin.count + live.filter((item) => item.score >= bin.from && item.score < bin.from + 20).length * 4 }));
  const maxCount = Math.max(...liveBins.map((bin) => bin.count));
  const sweep = useTween(1, 1400);
  const recap = useRecap();
  return (
    <main class="py-main">
      <header class="py-hero" data-anchor="py-hero">
        <div>
          <span class="py-eyebrow">Maré Pay · Credit operations</span>
          <h1>Applications</h1>
          <p>Review-band decisions pair model contributions with policy evidence. Everything else is decided automatically and sampled for audit.</p>
          <div class="py-hero-row"><LiveControl anchor="py-applications-live" /><RecapChip count={recap.frames.length} since={recap.since} /></div>
        </div>
        <div class="py-hero-cards" aria-hidden="true">
          <PayCard kind="credit" />
          <PayCard kind="store" />
        </div>
      </header>

      {state === 'drift' && (
        <Banner tone="warn" icon="!" title="Model drift · PSI 0.27 on the 18–24 cohort (warning at 0.20)" anchor="py-drift" action={<button type="button" class="py-btn">Open drift report</button>}>
          Challenger routing is paused and every 18–24 application goes to manual review until the risk team signs off.
        </Banner>
      )}
      {state === 'approved' && <Banner tone="success" icon="✓" title="Approved · AP-77118 · Credit + Store · R$4,000" anchor="py-approved">Virtual card issued in the app; decision, factors and reviewer are in the audit log.</Banner>}
      {state === 'declined' && <DeclineLetter />}
      {state === 'error' && <Banner tone="risk" icon="!" title="Bureau connection failed · new applications are queued" anchor="py-error">Nothing is auto-declined while the bureau is down; the queue drains automatically when it returns.</Banner>}
      {state === 'offline' && <Banner tone="warn" icon="↯" title="Offline · decisions are held locally" anchor="py-offline">Nothing is sent to customers until you reconnect and a second check passes.</Banner>}
      {state === 'locked' && <Banner tone="info" icon="i" title="Read-only · you are not a credit approver for limits above R$2,000" anchor="py-locked">Ask your lead for the Approver role; every request is logged.</Banner>}

      <div class="py-kpis" data-anchor="py-kpis">
        <div><span>In review</span><strong><Tween value={inReview} /></strong><small>median wait 14 min</small></div>
        <div><span>Auto-approved · 7d</span><strong>68%</strong><small>sampled 5% for audit</small></div>
        <div><span>Median score</span><strong>644</strong><small>stable vs last week</small></div>
        <div><span>30+ days past due</span><strong>2.1%</strong><small>target ≤ 2.5%</small></div>
      </div>

      <div class="py-grid">
        <section class="py-panel span-2" aria-labelledby="queue-title" data-anchor="py-queue">
          <header><h2 id="queue-title">Review queue</h2><span class="py-muted">sorted by wait time · SLA 2 h</span></header>
          <table class="py-table">
            <thead><tr><th>Application</th><th>Requested</th><th>Product</th><th>Score</th><th>Signal</th><th>Waiting</th></tr></thead>
            <tbody>
              {state === 'loading' && [0, 1, 2, 3, 4].map((key) => <tr key={key} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((cell) => <td key={cell}><i class="skeleton py-sk" /></td>)}</tr>)}
              {state !== 'loading' && rows.map((row) => (
                <tr key={row.id} data-nav-row class={`${row.id === 'AP-77118' ? 'highlight' : ''} ${fresh === row.id ? 'is-arriving' : ''}`}>
                  <td><Link href={`/mare/ops/pay/applications/${row.id}`}><b>{row.id}</b> · {row.name}</Link></td>
                  <td>{brl(row.amount)}</td>
                  <td>{row.product}</td>
                  <td><span class={`py-score ${row.band === 'Review' ? 'review' : row.band === 'Decline' ? 'decline' : 'ok'}`}>{row.score}</span></td>
                  <td>{row.flag ?? <span class="py-muted">—</span>}</td>
                  <td class="py-muted">{row.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {state === 'empty' && <div class="py-empty"><strong>Queue clear</strong><p>No application needs a person right now. Auto-decisions keep running and 5% are sampled into this queue for audit.</p></div>}
        </section>

        <section class="py-panel" aria-labelledby="dist-title" data-anchor="py-histogram">
          <header><h2 id="dist-title">Score distribution · 30 days</h2></header>
          <svg class="py-hist" viewBox="0 0 360 170" role="img" aria-label="Histogram of application scores with the 560–620 manual review band highlighted">
            <rect class="band" x={((REVIEW_BAND[0] - 440) / 360) * 360} width={((REVIEW_BAND[1] - REVIEW_BAND[0]) / 360) * 360} y="6" height="138" />
            {liveBins.map((bin, index) => {
              const height = (bin.count / maxCount) * 128 * sweep;
              const inBand = bin.from >= REVIEW_BAND[0] && bin.from < REVIEW_BAND[1];
              return <rect key={bin.from} class={inBand ? 'bar in-band' : 'bar'} x={index * 20 + 2} width="16" y={144 - height} height={height} rx="3" />;
            })}
            <text x="0" y="162">440</text><text x="160" y="162">600</text><text x="330" y="162">800</text>
            <text class="band-label" x={((REVIEW_BAND[0] - 440) / 360) * 360 + 4} y="18">manual review</text>
          </svg>
        </section>

        <section class="py-panel" aria-labelledby="model-title" data-anchor="py-model">
          <header><h2 id="model-title">ft-risk-v3</h2><span class="py-pill ok">champion · 80%</span></header>
          <dl class="py-model">
            <div><dt>AUC</dt><dd>0.81</dd></div>
            <div><dt>PSI · 30d</dt><dd>{state === 'drift' ? <span class="warn">0.27</span> : '0.08'}</dd></div>
            <div><dt>Challenger</dt><dd>ft-risk-v4 · 20%</dd></div>
            <div><dt>Fairness check</dt><dd>pass · 4 cohorts</dd></div>
          </dl>
          <AiSurface inline title="Explanations are required, not optional" meta="policy 44">
            Every review-band score ships with its top contribution factors and cited documents.
          </AiSurface>
        </section>
      </div>
      {recap.open && <Recap frames={recap.frames} since={recap.since} />}
    </main>
  );
}
