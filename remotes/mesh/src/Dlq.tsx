import { Banner, Layer, TraceLink, closeLayers, openLayer, recordAction, useLocation, useSequence } from '@portfolio/remote-runtime';
import { useMemo, useState } from 'preact/hooks';
import { dlq } from './data';

const defaultTransform = `// runs in a sandbox: no network, no clock, 50 ms budget
export default function transform(event) {
  if (event.status === 'X9') {
    return { ...event, status: 'delivery_exception', reason: 'rescheduled' };
  }
  return event;
}`;

export function Dlq() {
  const { params } = useLocation();
  const [result, setResult] = useState<string | null>(null);
  const [trace, setTrace] = useState<string | null>(null);
  const remaining = result ? [] : dlq;
  return (
    <main class="ms-main">
      <header class="ms-page-head">
        <h1>dead-letter queue</h1>
        <button type="button" class="ms-btn primary" disabled={!remaining.length} onClick={() => openLayer({ modal: 'replay' })} data-anchor="ms-replay-button">dry-run replay</button>
      </header>
      {result && <Banner tone="success" icon="✓" title={result} anchor="ms-replay-result" action={trace ? <TraceLink href={trace} /> : undefined}>every message kept its idempotency key; consumers ignored the one duplicate.</Banner>}
      <section class="ms-panel" aria-labelledby="dlq-title" data-anchor="ms-dlq-table">
        <header><h2 id="dlq-title">{remaining.length} parked events</h2><span class="ms-muted">retries exhausted · oldest 46 min</span></header>
        <table class="ms-table">
          <thead><tr><th>event</th><th>partner</th><th>error</th><th>attempts</th><th>age</th></tr></thead>
          <tbody>{remaining.map((message) => <tr key={message.id} class={message.dry === 'fail' ? 'fail' : ''}><td>{message.id}</td><td>{message.partner}</td><td>{message.error}</td><td>{message.attempts}</td><td>{message.age}</td></tr>)}</tbody>
        </table>
        {!remaining.length && <p class="ms-muted ms-empty">dlq empty · nothing parked</p>}
      </section>
      {params.get('modal') === 'replay' && <Replay onDone={(message) => { setResult(message); setTrace(recordAction('mesh', 'replay dlq tracking.update', message, 'Rui')); closeLayers(['modal', 'sub']); }} />}
    </main>
  );
}

function Replay({ onDone }: { onDone: (message: string) => void }) {
  const { params } = useLocation();
  const shown = useSequence(dlq.length, 45);
  const counts = { ok: dlq.filter((item) => item.dry === 'ok').length, fail: dlq.filter((item) => item.dry === 'fail').length, skip: dlq.filter((item) => item.dry === 'skip').length };
  return (
    <>
      <Layer kind="modal" title="dlq replay · dry run" eyebrow="no side effects until you confirm" onClose={() => closeLayers(['modal', 'sub'])} width={680} anchor="ms-replay"
        footer={<><button type="button" class="ms-btn" onClick={() => openLayer({ sub: 'transform' })} data-anchor="ms-transform-button">replay with transform…</button><button type="button" class="ms-btn primary" onClick={() => onDone(`replayed ${counts.ok} · ${counts.fail} still parked · ${counts.skip} skipped as duplicate`)}>replay {counts.ok}</button></>}>
        <div class="ms-dry" data-anchor="ms-dry-run">
          <div class="ok"><strong>{counts.ok}</strong><span>succeed</span></div>
          <div class="fail"><strong>{counts.fail}</strong><span>fail · unknown x9</span></div>
          <div class="skip"><strong>{counts.skip}</strong><span>skipped · key already applied</span></div>
        </div>
        <p class="ms-muted small">idempotency check: each event's key is looked up in the consumer's applied-keys table before replay.</p>
        <ol class="ms-dry-rows" data-anchor="ms-dry-rows" tabIndex={0} aria-label="Dry-run results per message">
          {dlq.slice(0, shown).map((message) => (
            <li key={message.id} class={`dry-${message.dry}`}><span>{message.id}</span><span>{message.partner}</span><span>{message.error}</span><b>{message.dry === 'ok' ? '✓ ok' : message.dry === 'fail' ? '✕ fail' : '↷ skip'}</b></li>
          ))}
        </ol>
      </Layer>
      {params.get('sub') === 'transform' && <Transform onReplay={() => onDone(`replayed ${counts.ok + counts.fail} · ${counts.fail} with transform · ${counts.skip} skipped as duplicate`)} />}
    </>
  );
}

function Transform({ onReplay }: { onReplay: () => void }) {
  const [code, setCode] = useState(defaultTransform);
  const valid = useMemo(() => code.includes("'X9'") && code.includes('delivery_exception'), [code]);
  return (
    <Layer kind="sub-drawer" level={2} title="transform before replay" eyebrow="applies to the 2 failing events" onClose={() => closeLayers(['sub'])} width={500} anchor="ms-transform"
      footer={<button type="button" class="ms-btn primary wide" disabled={!valid} onClick={onReplay}>replay 2 with transform</button>}>
      <ul class="ms-tags"><li>sandboxed</li><li>no network</li><li>50 ms budget</li><li>pure function</li><li>versioned with the replay</li></ul>
      <label class="ms-editor">
        <span class="visually-hidden">Transform code</span>
        <textarea spellcheck={false} rows={9} value={code} onInput={(event) => setCode(event.currentTarget.value)} data-anchor="ms-transform-code" />
      </label>
      <div class="ms-preview" data-anchor="ms-transform-preview">
        <span class="ms-muted">preview · evt_7x9a</span>
        <pre class="ms-code small"><code>{valid ? '{ "status": "delivery_exception", "reason": "rescheduled", "codigo_rastreio": "LG8842193BR" }' : '✕ transform does not handle X9'}</code></pre>
        <span class={valid ? 'ms-ok' : 'ms-bad'}>{valid ? 'valid against canonical.tracking.v3' : 'schema check failed'}</span>
      </div>
    </Layer>
  );
}
