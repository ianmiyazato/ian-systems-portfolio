'use client';

import { useEffect, useMemo, useState } from 'react';
import { MINUTE, clock, getWorld, logsFrom, type LogRecord } from '@portfolio/world';
import { useParams } from '@/components/overlay';
import { ZLink } from '@/components/zone-link';
import { useTelemetry } from '@/lib/tidewatch';

const levels = ['error', 'warn', 'info', 'debug'] as const;

/** `service:orders-api level:warn trace_id:9f3a2c pool` → field filters plus free text. */
function parse(query: string) {
  const fields: Record<string, string> = {};
  const text: string[] = [];
  for (const token of query.trim().split(/\s+/).filter(Boolean)) {
    const [key, ...rest] = token.split(':');
    if (rest.length && ['service', 'level', 'trace_id'].includes(key!)) fields[key!] = rest.join(':');
    else text.push(token.toLowerCase());
  }
  return { fields, text };
}

export function Logs() {
  const { world, now } = useTelemetry(2000);
  const params = useParams();
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [fresh, setFresh] = useState(0);
  const [hidden, setHidden] = useState<string[]>(['debug']);

  useEffect(() => {
    const initial = params.get('q');
    if (initial) setQuery(initial);
  }, [params]);

  useEffect(() => {
    if (!world) return;
    setRecords(logsFrom(world, world.between(world.now() - 10 * MINUTE, world.now())).reverse().slice(0, 300));
    return world.subscribe(({ events }) => {
      const next = logsFrom(getWorld(), events).reverse();
      if (!next.length) return;
      setRecords((current) => [...next, ...current].slice(0, 300));
      setFresh(next.length);
    });
  }, [world]);

  const { fields, text } = parse(query);
  const rows = records.filter((record) => (!fields.service || record.service === fields.service) && (!fields.level || record.level === fields.level) && (!fields.trace_id || record.traceId === fields.trace_id) && !hidden.includes(record.level) && text.every((word) => `${record.message} ${JSON.stringify(record.attributes)}`.toLowerCase().includes(word)));
  const counts = useMemo(() => Object.fromEntries(levels.map((level) => [level, records.filter((record) => record.level === level).length])), [records]);

  return (
    <main className="tw-main" id="tidewatch-logs">
      <header className="tw-head" data-anchor="tw-logs-head">
        <div><span className="tw-eyebrow">Logs · structured JSON · live tail</span><h1>Logs</h1><p className="tw-muted">{records.length} records in the last 10 min · every line carries its trace id · {clock(now, true)}</p></div>
      </header>
      <form className="tw-query" role="search" data-anchor="tw-query" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="tw-q" className="visually-hidden">Log query</label>
        <input id="tw-q" value={query} placeholder="service:orders-api level:warn pool" onChange={(event) => setQuery(event.currentTarget.value)} />
        <div className="tw-examples">{['service:orders-api level:warn', 'level:error', 'service:carrier-adapter', 'pool'].map((example) => <button type="button" key={example} onClick={() => setQuery(example)}>{example}</button>)}</div>
      </form>
      <div className="tw-logs-layout">
        <aside className="tw-panel" aria-labelledby="facet-title" data-anchor="tw-level-facets">
          <header><h2 id="facet-title">Level</h2></header>
          {levels.map((level) => (
            <label key={level} className={`tw-facet lvl-${level}`}>
              <input type="checkbox" checked={!hidden.includes(level)} onChange={() => setHidden(hidden.includes(level) ? hidden.filter((item) => item !== level) : [...hidden, level])} />
              <span>{level}</span><em>{counts[level]}</em>
            </label>
          ))}
        </aside>
        <section className="tw-panel" aria-labelledby="tail-title" data-anchor="tw-live-tail">
          <header><h2 id="tail-title">Live tail</h2><span className="tw-muted">{rows.length} matching</span></header>
          <ol className="tw-logs" aria-live="off">
            {rows.slice(0, 80).map((record, index) => (
              <li key={`${record.t}-${record.traceId}-${index}`} className={`lvl-${record.level} ${index < fresh ? 'is-arriving' : ''}`}>
                <time>{clock(record.t, true)}</time><b>{record.level}</b><span>{record.service}</span>
                <code>{JSON.stringify({ msg: record.message, ...record.attributes })}</code>
                <ZLink className="tw-trace-link" href={`/observability/traces/live?id=${record.traceId}`}>{record.traceId}</ZLink>
              </li>
            ))}
          </ol>
          {!rows.length && <p className="tw-empty">No log lines match. Try <button type="button" className="tw-link-btn" onClick={() => setQuery('')}>clearing the query</button>.</p>}
        </section>
      </div>
    </main>
  );
}
