import { AiSurface, Banner, Link, useDemoState } from '@portfolio/remote-runtime';
import { useState } from 'preact/hooks';

type Circuit = 'closed' | 'open' | 'half-open';

const mappings = [
  { from: 'codigo_rastreio', to: 'tracking.id', transform: 'trim()', ok: true },
  { from: 'status', to: 'tracking.status', transform: 'map(status_codes) · E1 E2 E4 E7', ok: true },
  { from: 'status = "X9"', to: 'tracking.status', transform: 'unknown code · no mapping', ok: false },
  { from: 'data_hora', to: 'tracking.occurred_at', transform: "parse('dd/MM/yyyy HH:mm', America/Sao_Paulo)", ok: true },
  { from: 'cidade', to: 'tracking.location.city', transform: 'titleCase()', ok: true },
  { from: 'obs', to: 'tracking.note', transform: 'truncate(140)', ok: true }
];

const requests = [
  ['16:18:02', 'GET /v2/rastreio?since=16:17', '200', '640ms', 'probe 2/3'],
  ['16:17:02', 'GET /v2/rastreio?since=16:16', '200', '912ms', 'probe 1/3 · 1 x9'],
  ['16:16:02', '—', 'skip', '—', 'circuit open · cooling down'],
  ['16:15:40', 'GET /v2/rastreio?since=16:14', '503', '2000ms', 'timeout'],
  ['16:15:10', 'GET /v2/rastreio?since=16:14', '503', '2000ms', 'timeout · 5th failure → open']
];

export function Partner({ id }: { id: string }) {
  const state = useDemoState();
  const [circuit, setCircuit] = useState<Circuit>(state === 'down' ? 'open' : state === 'calm' ? 'closed' : 'half-open');
  const [paused, setPaused] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const name = id === 'ligeiro-log' ? 'Ligeiro Log' : id.replace(/-/g, ' ');

  return (
    <main class="ms-main">
      <Link class="ms-back" href="/mare/ops/mesh">← topology</Link>
      <header class="ms-partner-head" data-anchor="ms-partner-head">
        <div>
          <h1>{name} · tracking adapter</h1>
          <ul class="ms-tags"><li>polling · 60s</li><li>contract canonical.tracking.v3</li><li>owner: logistics-integrations</li><li class={circuit === 'closed' ? 'ok' : circuit === 'open' ? 'bad' : 'warn'}>circuit {circuit}</li></ul>
        </div>
        <div class="ms-actions" data-anchor="ms-partner-actions">
          <button type="button" class="ms-btn" onClick={() => setPaused(!paused)}>{paused ? 'resume polling' : 'pause polling'}</button>
          <button type="button" class="ms-btn" onClick={() => setCircuit('closed')}>force close circuit</button>
          <button type="button" class="ms-btn primary" onClick={() => setDeployed(true)}>deploy mapping</button>
        </div>
      </header>
      {paused && <Banner tone="warn" icon="∥" title="polling paused · events accumulate at the partner, nothing is lost">resume within 72 h; ligeiro keeps a 7-day cursor.</Banner>}
      {deployed && <Banner tone="success" icon="✓" title="mapping v18 deployed · x9 → delivery_exception.rescheduled" anchor="ms-deployed">18 parked events are ready to replay from the dlq. canary: 5% of polls for 10 min.</Banner>}

      <div class="ms-grid">
        <section class="ms-panel span-2" aria-labelledby="cb-title" data-anchor="ms-circuit">
          <header><h2 id="cb-title">circuit breaker</h2><span class="ms-muted">{circuit === 'half-open' ? 'probe 2 of 3 · next in 18s' : circuit === 'open' ? 'failing fast · retry in 42s' : 'healthy · counting failures'}</span></header>
          <svg class="ms-fsm" viewBox="0 0 760 215" role="img" aria-label={`Circuit state machine, currently ${circuit}`}>
            <defs><marker id="ms-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowhead" /></marker></defs>
            <path class="t" d="M168,66 Q260,14 332,66" markerEnd="url(#ms-arrow)" />
            <path class="t" d="M428,66 Q520,14 592,66" markerEnd="url(#ms-arrow)" />
            <path class="t" d="M592,104 Q520,156 428,104" markerEnd="url(#ms-arrow)" />
            <path class="t" d="M628,124 Q380,236 132,124" markerEnd="url(#ms-arrow)" />
            <text x="250" y="26" text-anchor="middle">5 failures in 30s</text>
            <text x="510" y="26" text-anchor="middle">cool-down 60s</text>
            <text x="510" y="152" text-anchor="middle">probe fails</text>
            <text x="380" y="206" text-anchor="middle">3 probes ok → closed</text>
            {(['closed', 'open', 'half-open'] as Circuit[]).map((node, index) => {
              const x = [120, 380, 640][index]!;
              return (
                <g key={node} class={`state ${node} ${circuit === node ? 'current' : ''}`}>
                  {circuit === node && <circle class="pulse" cx={x} cy="85" r="48" />}
                  <circle cx={x} cy="85" r="44" />
                  <text x={x} y="90" text-anchor="middle">{node}</text>
                </g>
              );
            })}
          </svg>
          <dl class="ms-thresholds"><div><dt>failure threshold</dt><dd>5 / 30s</dd></div><div><dt>cool-down</dt><dd>60s</dd></div><div><dt>half-open probes</dt><dd>3</dd></div><div><dt>timeout</dt><dd>2000ms</dd></div></dl>
        </section>

        <AiSurface title="map x9 from the partner changelog" meta="confidence 0.93" anchor="ms-mapping-ai"
          sources={[{ label: 'ligeiro changelog v2.14', score: 0.93 }, { label: 'dlq samples · 18', score: 0.9 }, { label: 'canonical.tracking.v3', score: 0.88 }]}
          actions={<><button type="button" class="ai-approve" onClick={() => setDeployed(true)}>approve & deploy</button><button type="button" class="ai-explain">show diff</button></>}>
          changelog v2.14 (published 15:30) adds x9 = "entrega reagendada". the closest canonical status is delivery_exception with reason rescheduled; customers see "your delivery was rescheduled".
        </AiSurface>

        <section class="ms-panel span-2" aria-labelledby="map-title" data-anchor="ms-field-mapping">
          <header><h2 id="map-title">field mapping · partner → canonical</h2></header>
          <table class="ms-table">
            <thead><tr><th>partner field</th><th>canonical</th><th>transform</th><th>status</th></tr></thead>
            <tbody>
              {mappings.map((row) => (
                <tr key={row.from} class={!row.ok && !deployed ? 'fail' : ''}>
                  <td>{row.from}</td><td>{row.to}</td>
                  <td>{!row.ok && deployed ? "map('X9' → delivery_exception.rescheduled)" : row.transform}</td>
                  <td>{row.ok || deployed ? <span class="ms-ok">ok</span> : <span class="ms-bad">fails · 18 events</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section class="ms-panel" aria-labelledby="payload-title" data-anchor="ms-payload">
          <header><h2 id="payload-title">sample payload</h2><span class="ms-muted">evt_7x9a</span></header>
          <pre class="ms-code"><code>
{'{\n'}  <span class="k">"codigo_rastreio"</span>: <span class="s">"LG8842193BR"</span>,{'\n'}  <span class="k">"status"</span>: <span class="s bad">"X9"</span>,{'\n'}  <span class="k">"data_hora"</span>: <span class="s">"26/09/2026 15:52"</span>,{'\n'}  <span class="k">"cidade"</span>: <span class="s">"campinas"</span>,{'\n'}  <span class="k">"tentativa"</span>: <span class="n">2</span>,{'\n'}  <span class="k">"obs"</span>: <span class="s">"cliente ausente"</span>{'\n}'}
          </code></pre>
        </section>

        <section class="ms-panel span-3" aria-labelledby="req-title" data-anchor="ms-requests">
          <header><h2 id="req-title">request log</h2></header>
          <table class="ms-table">
            <thead><tr><th>time</th><th>request</th><th>status</th><th>latency</th><th>note</th></tr></thead>
            <tbody>
              {requests.map(([time, request, status, latency, note]) => (
                <tr key={time}><td>{time}</td><td>{request}</td><td class={status === '200' ? 'ok' : status === 'skip' ? 'muted' : 'bad'}>{status}</td><td>{latency}</td><td class="ms-muted">{note}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
