'use client';

import { useMemo, useState } from 'react';
import { CANONICAL_TRACE, SLOW_SPAN, clock, findTrace, logsFrom, recentTraces, type LogRecord, type Span, type Trace } from '@portfolio/world';
import { AiSurface, useParams } from '@/components/overlay';
import { ZLink } from '@/components/zone-link';
import { useTelemetry } from '@/lib/tidewatch';

/** Spans are colored by service in the fixed categorical order (legend always shown). */
const serviceOrder = ['consumer-graphql', 'ops-rest', 'middleware', 'orders-api', 'orders-db', 'inventory', 'credit', 'outbox-relay'];
const colorOf = (service: string) => `var(--series-${(serviceOrder.indexOf(service) >= 0 ? serviceOrder.indexOf(service) : 7) + 1})`;

function depthOf(span: Span, spans: Span[]): number {
  let depth = 0;
  let parent = spans.find((item) => item.spanId === span.parentId);
  while (parent) {
    depth += 1;
    parent = spans.find((item) => item.spanId === parent!.parentId);
  }
  return depth;
}

/** Logs for a trace: the events it carried, plus the canonical incident lines. */
function logsForTrace(trace: Trace): LogRecord[] {
  const wait = trace.spans.find((span) => span.name === SLOW_SPAN);
  const base: LogRecord[] = [
    { t: trace.at, level: 'info', service: trace.service, message: `${trace.name} received`, traceId: trace.traceId, attributes: { 'http.route': String(trace.spans[0]!.attributes['http.route'] ?? '/ops') } }
  ];
  if (wait && Number(wait.attributes['db.pool.wait_ms']) > 100) base.push({ t: trace.at + wait.start, level: 'warn', service: 'orders-api', message: 'db pool wait exceeded 500ms', traceId: trace.traceId, attributes: { 'db.pool.wait_ms': Number(wait.attributes['db.pool.wait_ms']), 'db.pool.max': Number(wait.attributes['db.pool.max']), 'deploy.id': 812 } });
  base.push({ t: trace.at + trace.duration, level: 'info', service: trace.service, message: `${trace.name} completed in ${trace.duration} ms`, traceId: trace.traceId, attributes: { status: trace.status } });
  return base;
}

export function Traces({ initialId }: { initialId: string }) {
  const { world, now } = useTelemetry(3000);
  const params = useParams();
  const id = params.get('id') ?? (initialId === 'live' ? CANONICAL_TRACE : initialId);
  const [query, setQuery] = useState('');
  const [onlySlow, setOnlySlow] = useState(false);
  const [spanId, setSpanId] = useState<string | null>(null);
  const list = useMemo(() => (world ? recentTraces(world, now, 30) : []), [world, now]);
  const trace = useMemo(() => (world ? findTrace(world, id) : undefined), [world, id]);
  const needle = query.trim().toLowerCase();
  const rows = list.filter((item) => (!needle || `${item.traceId} ${item.name} ${item.service}`.toLowerCase().includes(needle)) && (!onlySlow || item.duration > 300));
  const selected = trace?.spans.find((span) => span.spanId === spanId) ?? trace?.spans.find((span) => span.name === SLOW_SPAN) ?? trace?.spans[0];
  const logs = trace ? [...logsForTrace(trace), ...(world ? logsFrom(world, world.recorded()).filter((log) => log.traceId === trace.traceId) : [])] : [];
  const wait = trace?.spans.find((span) => span.name === SLOW_SPAN);
  const waitShare = wait && trace ? wait.duration / trace.duration : 0;
  const services = trace ? [...new Set(trace.spans.map((span) => span.service))] : [];

  return (
    <main className="tw-main" id="tidewatch-traces">
      <header className="tw-head" data-anchor="tw-traces-head">
        <div><span className="tw-eyebrow">Traces · OpenTelemetry</span><h1>{trace ? `Trace ${trace.traceId}` : 'Traces'}</h1><p className="tw-muted">{trace ? `${trace.name} · ${trace.service} · ${clock(trace.at, true)} · ${trace.duration} ms · ${trace.spans.length} spans` : 'Pick a trace'}</p></div>
      </header>
      <div className="tw-traces">
        <section className="tw-panel" aria-labelledby="list-title" data-anchor="tw-trace-list">
          <header><h2 id="list-title">Recent traces</h2><label className="tw-check"><input type="checkbox" checked={onlySlow} onChange={() => setOnlySlow(!onlySlow)} />over 300 ms</label></header>
          <label className="tw-search"><span className="visually-hidden">Search traces</span><input value={query} placeholder="trace id, operation or service…" onChange={(event) => setQuery(event.currentTarget.value)} /></label>
          <ol className="tw-trace-list">
            {rows.map((item) => (
              <li key={item.traceId}>
                <ZLink href={`/observability/traces/live?id=${item.traceId}`} aria-current={item.traceId === trace?.traceId ? 'true' : undefined} className={item.status === 'error' ? 'error' : ''}>
                  <span className="mono">{clock(item.at, true)} · {item.traceId}</span>
                  <b>{item.name}</b>
                  <span className="tw-dur"><i style={{ '--w': Math.min(1, item.duration / 1200) } as React.CSSProperties} aria-hidden="true" />{item.duration} ms</span>
                </ZLink>
              </li>
            ))}
          </ol>
        </section>

        {trace && (
          <div className="tw-trace-main">
            <section className="tw-panel" aria-labelledby="waterfall-title" data-anchor="tw-waterfall">
              <header><h2 id="waterfall-title">Waterfall</h2><ul className="tw-legend">{services.map((service) => <li key={service}><i style={{ background: colorOf(service) }} aria-hidden="true" />{service}</li>)}</ul></header>
              <ol className="tw-waterfall">
                {trace.spans.map((span) => {
                  const depth = depthOf(span, trace.spans);
                  const slow = span.name === SLOW_SPAN && span.duration > 100;
                  return (
                    <li key={span.spanId}>
                      <button type="button" className={`${slow ? 'slow' : ''} ${selected?.spanId === span.spanId ? 'selected' : ''} ${span.status === 'error' ? 'error' : ''}`} aria-pressed={selected?.spanId === span.spanId} onClick={() => setSpanId(span.spanId)}>
                        <span className="tw-span-name" style={{ paddingLeft: `${depth * 14}px` }}><i style={{ background: colorOf(span.service) }} aria-hidden="true" />{span.name}<small>{span.service}</small></span>
                        <span className="tw-span-track"><i style={{ left: `${(span.start / trace.duration) * 100}%`, width: `${Math.max(0.6, (span.duration / trace.duration) * 100)}%`, background: colorOf(span.service) } as React.CSSProperties} /></span>
                        <span className="tw-span-ms mono">{span.duration} ms</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>

            <div className="tw-trace-side">
              {waitShare > 0.4 ? (
                <AiSurface title={`Why it's slow: ${Math.round(waitShare * 100)}% waiting for a DB connection`} meta="trace analyzer · 0.94" anchor="tw-why-slow"
                  sources={[{ label: `span ${SLOW_SPAN}`, score: 0.97 }, { label: 'deploy #812 · config diff', score: 0.93 }, { label: 'pool metrics · orders-db', score: 0.9 }]}
                  actions={<ZLink className="ai-approve" href="/observability">Open problem P-812</ZLink>}>
                  <code>db.pool.wait_ms</code> is {String(wait!.attributes['db.pool.wait_ms'])} ms with <code>db.pool.max</code> {String(wait!.attributes['db.pool.max'])} on orders-api {String(trace.spans.find((span) => span.service === 'orders-api')?.attributes['service.version'])}. The SQL itself takes 14 ms. Raising the pool or rolling back #812 removes the wait.
                </AiSurface>
              ) : (
                <AiSurface title="Healthy trace" meta="trace analyzer" anchor="tw-why-slow">No span is waiting on a shared resource; the critical path is the model call and the database write.</AiSurface>
              )}
              {selected && (
                <section className="tw-panel" aria-labelledby="attrs-title" data-anchor="tw-span-attributes">
                  <header><h2 id="attrs-title" className="tw-code-title">{selected.name}</h2><span className="tw-muted">{selected.kind} · {selected.service}</span></header>
                  <dl className="tw-attrs">
                    <div><dt>span.id</dt><dd>{selected.spanId}</dd></div>
                    <div><dt>duration</dt><dd>{selected.duration} ms</dd></div>
                    {Object.entries(selected.attributes).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}
                  </dl>
                  <ZLink className="tw-link" href="/observability">Metrics for {selected.service} →</ZLink>
                </section>
              )}
            </div>

            <section className="tw-panel span-full" aria-labelledby="corr-title" data-anchor="tw-correlated-logs">
              <header><h2 id="corr-title">Correlated logs</h2><ZLink className="tw-link" href={`/observability/logs?q=trace_id:${trace.traceId}`}>Open in Logs →</ZLink></header>
              <ol className="tw-logs">{logs.map((log, index) => <li key={index} className={`lvl-${log.level}`}><time>{clock(log.t, true)}</time><b>{log.level}</b><span>{log.service}</span><code>{JSON.stringify({ msg: log.message, trace_id: log.traceId, ...log.attributes })}</code></li>)}</ol>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
