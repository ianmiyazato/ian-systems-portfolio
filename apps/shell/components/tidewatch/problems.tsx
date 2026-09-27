'use client';

import { useMemo, useState } from 'react';
import { CANONICAL_TRACE, INCIDENT_START, checkoutSeries, clock, deploy, duration, getWorld, saturation, traceIdOf, type FaultId, type Problem } from '@portfolio/world';
import { AiSurface, useDemoState } from '@/components/overlay';
import { ZLink } from '@/components/zone-link';
import { useTelemetry, useProblems } from '@/lib/tidewatch';
import { Bars, LineChart, Meters } from './charts';

type Health = 'ok' | 'warn' | 'bad';
const flow: Array<{ id: string; label: string; x: number; y: number; faults: Partial<Record<FaultId, Health>> }> = [
  { id: 'consumer-graphql', label: 'consumer-graphql', x: 90, y: 110, faults: { 'traffic-spike': 'warn', 'db-pool': 'warn' } },
  { id: 'orders-api', label: 'orders-api', x: 270, y: 110, faults: { 'db-pool': 'bad', 'traffic-spike': 'warn' } },
  { id: 'orders-db', label: 'orders-db', x: 450, y: 50, faults: { 'db-pool': 'bad' } },
  { id: 'credit', label: 'credit', x: 450, y: 170, faults: { 'db-pool': 'warn' } },
  { id: 'kafka', label: 'kafka', x: 630, y: 110, faults: { 'topic-lag': 'warn' } },
  { id: 'notifications', label: 'notifications', x: 810, y: 50, faults: { 'topic-lag': 'bad' } },
  { id: 'carrier-adapter', label: 'carrier-adapter', x: 810, y: 130, faults: { 'carrier-outage': 'bad' } },
  { id: 'invoicing', label: 'invoicing', x: 810, y: 210, faults: { 'einvoice-fail': 'bad' } }
];
const edges: Array<[string, string]> = [['consumer-graphql', 'orders-api'], ['orders-api', 'orders-db'], ['orders-api', 'credit'], ['orders-api', 'kafka'], ['kafka', 'notifications'], ['kafka', 'carrier-adapter'], ['kafka', 'invoicing']];

const endpoints = (saturated: boolean) => [
  ['POST /graphql CreateOrder', saturated ? 900 : 182, saturated ? 4.1 : 0.5, 'orders-api'],
  ['POST /orders/:id/refund', saturated ? 640 : 140, saturated ? 2.2 : 0.2, 'orders-api'],
  ['POST /credit/score', saturated ? 214 : 84, 0.1, 'credit'],
  ['GET /graphql Product', 64, 0.1, 'consumer-graphql'],
  ['POST /webhooks/carrier', 142, 0.4, 'carrier-adapter']
] as const;

const statements = (saturated: boolean) => [
  ['INSERT INTO orders (id, customer_id, total_cents, status) VALUES (:1, :2, :3, :4)', saturated ? 626 : 14, 812, 'orders-db'],
  ['SELECT * FROM order_lines WHERE order_id = :1 FOR UPDATE', saturated ? 402 : 9, 1_604, 'orders-db'],
  ['INSERT INTO outbox (id, topic, key, payload, trace_id) VALUES (:1, :2, :3, :4, :5)', saturated ? 380 : 4, 2_410, 'orders-db'],
  ['SELECT features FROM credit_features WHERE account_id = :1', saturated ? 168 : 31, 640, 'credit-db']
] as const;

export function Problems() {
  const { world, now } = useTelemetry(1000);
  const list = useProblems();
  const open = list.filter((problem) => problem.endedAt === undefined);
  const top: Problem | undefined = open[0];
  const [service, setService] = useState('orders-api');
  const locked = useDemoState() === 'locked';
  const [toast, setToast] = useState<{ text: string; trace: string } | null>(null);
  const series = useMemo(() => (world ? checkoutSeries(world, now, 45) : []), [world, now, world?.state]);
  const sat = world ? saturation(world, now) : [];
  const saturated = world?.isFaulted('db-pool', now) ?? true;
  const health = (id: string): Health => {
    if (!world) return id === 'orders-api' || id === 'orders-db' ? 'bad' : 'ok';
    const node = flow.find((item) => item.id === id)!;
    const levels = (Object.entries(node.faults) as Array<[FaultId, Health]>).filter(([fault]) => world.isFaulted(fault, now) || (fault === 'traffic-spike' && world.state.scenario === 'black-friday')).map(([, level]) => level);
    return levels.includes('bad') ? 'bad' : levels.length ? 'warn' : 'ok';
  };

  const fix = (action: string) => {
    const w = getWorld();
    w.setFault('db-pool', false);
    const event = w.record({ topic: 'action.performed', key: 'P-812', payload: { system: 'tidewatch', action, summary: 'P-812 resolved from the problem card', actor: 'you' } });
    setToast({ text: `${action} · the pool recovers in the next minute`, trace: traceIdOf(event.id) });
  };

  return (
    <main className="tw-main" id="tidewatch-problems">
      {top ? (
        <section className="tw-problem" role="alert" data-anchor="tw-problem">
          <span className="tw-pulse" aria-hidden="true" />
          <div>
            <span className="tw-eyebrow">{top.id} · open · {top.service}</span>
            <h1>{top.title}</h1>
            <dl>
              <div><dt>Started</dt><dd>{clock(top.startedAt)} · {duration(now - top.startedAt)} ago</dd></div>
              <div><dt>Users affected</dt><dd>{top.usersAffected.toLocaleString('en-US')}</dd></div>
              <div><dt>SLO breached</dt><dd>{top.slo}</dd></div>
              <div><dt>Error-budget burn</dt><dd>{top.burn}× (page at 14.4×)</dd></div>
            </dl>
          </div>
        </section>
      ) : (
        <section className="tw-problem ok" role="status" data-anchor="tw-problem">
          <span className="tw-pulse" aria-hidden="true" />
          <div><span className="tw-eyebrow">All clear</span><h1>No open problems</h1><p>{list[0] ? `${list[0].id} resolved at ${clock(list[0].endedAt!)} · ${list[0].title}` : 'Every SLO is inside its budget.'}</p></div>
        </section>
      )}

      <div className="tw-grid">
        <section className="tw-panel span-2" aria-labelledby="flow-title" data-anchor="tw-service-flow">
          <header><h2 id="flow-title">Service flow · auto-discovered from traces</h2><span className="tw-muted">ring = apdex · click a service</span></header>
          <svg className="tw-flow" viewBox="0 0 900 260" role="group" aria-label="Service flow discovered from traces">
            {edges.map(([from, to]) => { const a = flow.find((item) => item.id === from)!; const b = flow.find((item) => item.id === to)!; return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`tw-flow-edge ${health(to)}`} />; })}
            {flow.map((node) => {
              const h = health(node.id);
              const apdex = h === 'bad' ? 0.42 : h === 'warn' ? 0.78 : 0.97;
              const c = 2 * Math.PI * 22;
              return (
                <g key={node.id} className={`tw-flow-node ${h} ${service === node.id ? 'selected' : ''}`} role="button" tabIndex={0} aria-label={`${node.label}, ${h === 'bad' ? 'unhealthy' : h === 'warn' ? 'degraded' : 'healthy'}`} onClick={() => setService(node.id)} onKeyDown={(event) => event.key === 'Enter' && setService(node.id)} transform={`translate(${node.x} ${node.y})`}>
                  {h === 'bad' && <circle className="tw-halo" r="30" />}
                  <circle className="tw-ring-track" r="22" />
                  <circle className="tw-ring" r="22" style={{ strokeDasharray: c, strokeDashoffset: c * (1 - apdex) }} transform="rotate(-90)" />
                  <text className="tw-apdex" y="4" textAnchor="middle">{apdex.toFixed(2)}</text>
                  <text className="tw-flow-label" y="44" textAnchor="middle">{node.label}</text>
                </g>
              );
            })}
          </svg>
        </section>

        <AiSurface title={saturated ? 'Root cause: deploy #812 halved the Orders DB pool' : 'Recovered: pool back to 64 connections'} meta={saturated ? 'root-cause model · 0.93' : 'verified by the charts'} anchor="tw-root-cause" className="tw-ai"
          sources={[{ label: `deploy #${deploy.id} · orders-api ${deploy.version}`, score: 0.97 }, { label: 'traces · db.pool.wait_ms', score: 0.95 }, { label: 'config diff · ORDERS_DB_POOL_MAX', score: 0.93 }]}
          actions={saturated ? <><button type="button" className="ai-approve" disabled={locked} onClick={() => fix('Roll back #812')}>Roll back #812</button><button type="button" className="ai-explain" disabled={locked} onClick={() => fix('Raise pool to 64')}>Raise pool to 64</button></> : undefined}>
          {saturated
            ? <>orders-api {deploy.version} shipped at {clock(INCIDENT_START)} with a new config default: ORDERS_DB_POOL_MAX 64 → 32. At the evening load, 83% of checkout time is spent waiting for a connection (<ZLink href={`/observability/traces/${CANONICAL_TRACE}`}>trace {CANONICAL_TRACE}</ZLink>). Credit scoring shares the database and slows too.</>
            : <>The pool is back to 64 and wait time is under 5 ms. p95 returns under the 300 ms SLO within two minutes; keep watching the burn rate.</>}
        </AiSurface>

        <section className="tw-panel span-2" aria-labelledby="golden-title" data-anchor="tw-golden-signals">
          <header><h2 id="golden-title">Golden signals · {service}</h2><span className="tw-muted">checkout · last 45 min</span></header>
          <LineChart title="Latency" unit="ms" times={series.map((point) => point.t)} marker={{ at: INCIDENT_START, label: `deploy #${deploy.id}` }} anchor="tw-latency"
            series={[
              { id: 'p50', label: 'p50', color: 'var(--series-1)', values: series.map((point) => point.p50) },
              { id: 'p95', label: 'p95', color: 'var(--series-2)', values: series.map((point) => point.p95) },
              { id: 'p99', label: 'p99', color: 'var(--series-3)', values: series.map((point) => point.p99) }
            ]} />
          <Bars title="Throughput" unit=" rpm" times={series.map((point) => point.t)} values={series.map((point) => point.rpm)} marker={{ at: INCIDENT_START, label: 'deploy' }} anchor="tw-throughput" />
        </section>

        <section className="tw-panel" aria-labelledby="sat-title" data-anchor="tw-saturation">
          <header><h2 id="sat-title">Saturation</h2></header>
          <Meters items={sat} />
        </section>

        <section className="tw-panel span-2" aria-labelledby="endpoints-title" data-anchor="tw-endpoints">
          <header><h2 id="endpoints-title">Slowest endpoints</h2></header>
          <table className="tw-table"><thead><tr><th>Endpoint</th><th>Service</th><th className="num">p95</th><th className="num">Errors</th></tr></thead>
            <tbody>{endpoints(saturated).map(([name, p95, errors, owner]) => <tr key={name}><td className="mono">{name}</td><td>{owner}</td><td className={`num mono ${p95 > 300 ? 'bad' : ''}`}>{p95} ms</td><td className="num mono">{errors.toFixed(1)}%</td></tr>)}</tbody></table>
        </section>

        <section className="tw-panel" aria-labelledby="sql-title" data-anchor="tw-statements">
          <header><h2 id="sql-title">Top database statements</h2></header>
          <ol className="tw-sql">{statements(saturated).map(([sql, ms, calls, db]) => <li key={sql}><code>{sql}</code><span className={ms > 100 ? 'bad' : ''}>{ms} ms avg · {calls.toLocaleString('en-US')}/min · {db}</span></li>)}</ol>
        </section>
      </div>

      {list.filter((problem) => problem.endedAt !== undefined).length > 0 && (
        <section className="tw-panel" aria-labelledby="recent-title" data-anchor="tw-recent">
          <header><h2 id="recent-title">Recently resolved</h2></header>
          <ul className="tw-recent">{list.filter((problem) => problem.endedAt !== undefined).map((problem) => <li key={problem.id + problem.startedAt}><b>{problem.id}</b> {problem.title}<span>{clock(problem.startedAt)} → {clock(problem.endedAt!)}</span></li>)}</ul>
        </section>
      )}

      {toast && (
        <div className="tw-toast" role="status">
          <span>{toast.text}</span>
          <ZLink href={`/observability/traces/live?id=${toast.trace}`}>View trace</ZLink>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </main>
  );
}
