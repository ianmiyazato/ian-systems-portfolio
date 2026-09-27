import { AiSurface, Banner, Layer, LiveControl, closeLayers, openLayer, useDemoState, useLiveEvents, useLocation, useWorld } from '@portfolio/remote-runtime';
import { clock } from '@portfolio/world';
import { useMemo, useState } from 'preact/hooks';
import { Ring, brl } from './ui';

const actionLabel = { approved: 'Approved', 'step-up': 'Step-up sent', blocked: 'Blocked', held: 'Held' } as const;
const SLO_MS = 150;

/** RING-07: two devices and one drop address shared by eleven cards in 40 minutes. */
const ring = {
  devices: [{ id: 'd1', x: 190, y: 90, label: 'Android · new' }, { id: 'd2', x: 190, y: 230, label: 'Chrome · VPN' }],
  address: { x: 470, y: 160, label: 'Drop address · 88 Ninth St' },
  cards: Array.from({ length: 11 }, (_, index) => ({ id: `c${index}`, x: 72 + Math.round(Math.sin((index / 10) * Math.PI) * 26), y: 30 + index * 26, last4: String(3100 + index * 137).slice(-4) }))
};

export function Fraud() {
  const state = useDemoState();
  const { params } = useLocation();
  const { world } = useWorld();
  const stream = useLiveEvents(['auth.scored'], { limit: 11 });
  const recent = useLiveEvents(['auth.scored'], { limit: 60 });
  const [saved, setSaved] = useState(false);
  const latencies = useMemo(() => recent.items.map((event) => event.payload.latencyMs).sort((a, b) => a - b), [recent.items]);
  const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)]! : 84;
  const degraded = state === 'degraded' || world.isFaulted('db-pool') || p95 > SLO_MS;
  const blocked = recent.items.filter((event) => event.payload.action === 'blocked' || event.payload.action === 'step-up').length;

  return (
    <main class="py-main" id="pay-fraud">
      <header class="py-page-head" data-anchor="py-fraud-head">
        <div>
          <span class="py-eyebrow">Maré Pay · Fraud operations</span>
          <h1>Fraud</h1>
          <p>Every authorization is scored in under 150 ms before capture. Rules and the model act together; people own new rules.</p>
        </div>
        <LiveControl anchor="py-fraud-live" />
      </header>
      {degraded && (
        <Banner tone="warn" icon="!" title={`Scoring p95 ${p95} ms · SLO ${SLO_MS} ms`} anchor="py-fraud-degraded" action={<a class="py-btn" href="/observability">Open in Tidewatch</a>}>
          Database pool saturation is slowing feature lookups. Authorizations above the timeout fall back to rules-only scoring with step-up, so nothing is approved blind.
        </Banner>
      )}

      <div class="py-rings" data-anchor="py-fraud-gauges">
        <Ring value={0.962} label="Caught before capture" display="96.2%" tone="ok" />
        <Ring value={0.018} max={0.05} label="False positives" display="1.8%" tone="gold" />
        <Ring value={p95} max={250} label="p95 scoring latency" display={`${p95} ms`} tone={p95 > SLO_MS ? 'risk' : p95 > 110 ? 'warn' : 'ok'} />
        <Ring value={3} max={10} label="Rings under watch" display="3" tone="warn" />
      </div>

      <div class="py-fraud">
        <section class="py-panel" aria-labelledby="stream-title" data-anchor="py-auth-stream">
          <header><h2 id="stream-title">Authorization stream</h2><span class="py-muted">{blocked} of the last {recent.items.length} stopped or challenged</span></header>
          <table class="py-table py-stream">
            <thead><tr><th>Time</th><th>Card</th><th>Merchant · device</th><th>Amount</th><th>Score</th><th>Action</th></tr></thead>
            <tbody>
              {state === 'loading' && [0, 1, 2, 3, 4].map((key) => <tr key={key} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((cell) => <td key={cell}><i class="skeleton py-sk" /></td>)}</tr>)}
              {state !== 'loading' && stream.items.map((event) => (
                <tr key={event.id} class={stream.fresh.includes(event.id) ? 'is-arriving' : ''}>
                  <td class="py-mono">{clock(Date.parse(event.at), true)}</td>
                  <td class="py-mono">{event.payload.account}</td>
                  <td>{event.payload.merchant}<small>{event.payload.device}</small></td>
                  <td>{brl(event.payload.amountCents / 100)}</td>
                  <td><span class={`py-score ${event.payload.score < 470 ? 'decline' : event.payload.score < 560 ? 'review' : 'ok'}`}>{event.payload.score}</span></td>
                  <td><span class={`py-action ${event.payload.action}`}>{actionLabel[event.payload.action]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div class="py-fraud-side">
          <section class="py-panel" aria-labelledby="ring-title" data-anchor="py-fraud-ring">
            <header><h2 id="ring-title">RING-07 · device and card graph</h2><span class="py-pill decline">watching</span></header>
            <svg class="py-graph" viewBox="0 0 560 320" role="img" aria-label="Eleven cards linked to two new devices and one drop address in 40 minutes">
              {ring.cards.map((card, index) => <line key={`l-${card.id}`} class="link" x1={card.x} y1={card.y} x2={ring.devices[index % 2]!.x} y2={ring.devices[index % 2]!.y} />)}
              {ring.devices.map((device) => <line key={`a-${device.id}`} class="link strong" x1={device.x} y1={device.y} x2={ring.address.x} y2={ring.address.y} />)}
              {ring.cards.map((card, index) => (
                <g key={card.id} class="node card" style={{ '--i': index }} transform={`translate(${card.x} ${card.y})`}><circle r="9" /><text x="-14" text-anchor="end" dy="4">•• {card.last4}</text></g>
              ))}
              {ring.devices.map((device, index) => (
                <g key={device.id} class="node device" style={{ '--i': index }} transform={`translate(${device.x} ${device.y})`}><circle class="halo" r="26" /><circle r="16" /><text y="38" text-anchor="middle">{device.label}</text></g>
              ))}
              <g class="node address" transform={`translate(${ring.address.x} ${ring.address.y})`}><circle class="halo" r="30" /><circle r="18" /><text y="44" text-anchor="middle">{ring.address.label}</text></g>
            </svg>
          </section>

          <AiSurface title="Pattern found · shared device + drop address" meta="graph model · 0.91" anchor="py-fraud-pattern"
            sources={[{ label: 'device graph · 40 min', score: 0.93 }, { label: 'address watchlist', score: 0.88 }, { label: 'chargebacks · 90 days', score: 0.81 }]}
            actions={<button type="button" class="ai-approve" onClick={() => openLayer({ modal: 'draft-rule' })}>{saved ? 'Edit draft rule' : 'Draft rule'}</button>}>
            11 cards used 2 new devices and shipped to 1 address within 40 minutes; 4 already have chargebacks. A rule on device fan-out would have stepped them up before capture.
          </AiSurface>
          {saved && <Banner tone="success" icon="✓" title="FR-219 saved in shadow mode" anchor="py-rule-saved">It scores every authorization but acts on none for 7 days; you review its hits before it goes live.</Banner>}
        </div>
      </div>

      {params.get('modal') === 'draft-rule' && (
        <Layer kind="modal" title="Draft rule FR-219" eyebrow="From pattern RING-07 · shadow mode first" onClose={() => closeLayers(['modal'])} width={640} anchor="py-draft-rule"
          footer={<><button type="button" class="py-btn" onClick={() => closeLayers(['modal'])}>Discard</button><button type="button" class="py-btn primary" onClick={() => { setSaved(true); closeLayers(['modal']); }}>Save in shadow mode</button></>}>
          <pre class="py-rule"><code>{`WHEN device.cards_seen_1h >= 5
 AND ship_to.address IN watchlist
 AND card.age_days < 30
THEN step_up(3ds) · hold_capture(30 min)`}</code></pre>
          <dl class="py-quote">
            <div><dt>Would have challenged · 30 days</dt><dd class="big">14 authorizations</dd></div>
            <div><dt>Of those, later chargebacks</dt><dd>11 · {brl(9_840)}</dd></div>
            <div><dt>Good customers challenged</dt><dd>3 (step-up, not decline)</dd></div>
          </dl>
          <p class="py-muted">Backtest on the last 30 days of authorizations. Rules go live only after 7 days in shadow mode and a second reviewer.</p>
        </Layer>
      )}
    </main>
  );
}
