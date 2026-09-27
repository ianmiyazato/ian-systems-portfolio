import { seedOf } from '@portfolio/mocks';
import type { FaultId, WorldEvent } from './generate';
import { INCIDENT_START, type World } from './world';
import { MINUTE, clock } from './time';

/**
 * Tidewatch reads the world through an OpenTelemetry-shaped lens: traces made of spans with
 * semantic-convention attributes, per-minute golden signals, problems opened by faults, and
 * structured logs that carry trace ids. Everything is derived, so every tab agrees.
 */
export type SpanKind = 'server' | 'client' | 'internal' | 'producer' | 'consumer';
export type Span = { spanId: string; parentId?: string; name: string; service: string; kind: SpanKind; start: number; duration: number; status: 'ok' | 'error'; attributes: Record<string, string | number> };
export type Trace = { traceId: string; name: string; service: string; at: number; duration: number; status: 'ok' | 'error'; spans: Span[]; source?: string };

export const CANONICAL_TRACE = '9f3a2c';
export const SLOW_SPAN = 'db.pool.acquire';

export const traceIdOf = (id: string) => (seedOf(`trace:${id}`) >>> 0).toString(16).padStart(8, '0').slice(0, 6);
const spanId = (trace: string, index: number) => (seedOf(`${trace}:${index}`) >>> 0).toString(16).padStart(8, '0').slice(0, 8);

const DEPLOY = { id: 812, at: INCIDENT_START, version: '4.18.0', previous: '4.17.3' };
export const deploy = DEPLOY;

/** Is the Orders pool saturated at `at` (deploy #812 not yet rolled back)? */
export const poolSaturated = (world: World, at: number) => world.isFaulted('db-pool', at);

type SpanSpec = [name: string, service: string, kind: SpanKind, parent: number | null, offset: number, duration: number, attributes?: Record<string, string | number>, status?: 'ok' | 'error'];

function build(traceId: string, at: number, specs: SpanSpec[], source?: string): Trace {
  const spans = specs.map(([name, service, kind, parent, start, duration, attributes = {}, status = 'ok'], index) => ({
    spanId: spanId(traceId, index), parentId: parent === null ? undefined : spanId(traceId, parent), name, service, kind, start, duration, status, attributes
  }));
  const root = spans[0]!;
  return { traceId, name: root.name, service: root.service, at, duration: root.duration, status: spans.some((span) => span.status === 'error') ? 'error' : 'ok', spans, source };
}

/** A checkout (POST /graphql createOrder): the trace behind the incident story. */
export function checkoutTrace(traceId: string, at: number, saturated: boolean, orderId = 'MR-904117'): Trace {
  const wait = saturated ? 612 + (seedOf(traceId) % 180) : 2 + (seedOf(traceId) % 3);
  const version = saturated ? DEPLOY.version : DEPLOY.previous;
  const score = saturated ? 214 : 84;
  const create = wait + 14 + 4 + 9;
  const total = 6 + create + 6 + score + 5;
  return build(traceId, at, [
    ['POST /graphql createOrder', 'consumer-graphql', 'server', null, 0, total, { 'http.route': '/graphql', 'graphql.operation.name': 'CreateOrder', 'graphql.persisted_query': 'sha256:9ac1…', 'service.version': '2.31.0', 'k8s.pod.name': 'consumer-graphql-5d8b-q7' }],
    ['auth.verify_scopes', 'middleware', 'internal', 0, 1, 2, { 'enduser.scope': 'orders:write' }],
    ['idempotency.check', 'middleware', 'client', 0, 3, 2, { 'idempotency.key': `idem_${traceId}_co`, 'db.system': 'redis' }],
    ['orders.create', 'orders-api', 'server', 0, 6, create, { 'service.version': version, 'deploy.id': saturated ? DEPLOY.id : 797, 'k8s.pod.name': 'orders-api-7c9f-x2', 'order.id': orderId }],
    [SLOW_SPAN, 'orders-api', 'internal', 3, 6, wait, { 'db.pool.wait_ms': wait, 'db.pool.max': saturated ? 32 : 64, 'db.pool.in_use': saturated ? 32 : 21 }, saturated ? 'error' : 'ok'],
    ['INSERT orders', 'orders-db', 'client', 3, 6 + wait, 14, { 'db.system': 'enterprise-rdbms', 'db.statement': 'INSERT INTO orders (id, customer_id, total_cents, status) VALUES (:1, :2, :3, :4)', 'db.rows_affected': 1 }],
    ['INSERT outbox', 'orders-db', 'client', 3, 20 + wait, 4, { 'db.system': 'enterprise-rdbms', 'db.statement': 'INSERT INTO outbox (id, topic, key, payload, trace_id) VALUES (:1, :2, :3, :4, :5)' }],
    ['inventory.reserve', 'inventory', 'client', 0, 6 + create, 6, { 'db.system': 'redis', 'db.operation': 'DECRBY', 'store.code': '#0412' }],
    ['credit.score', 'credit', 'server', 0, 12 + create, score, { 'model.id': 'ft-risk-v3', 'feature.lookup_ms': saturated ? 168 : 31, 'db.pool.wait_ms': saturated ? 120 : 1 }],
    ['kafka produce orders.placed', 'outbox-relay', 'producer', 0, 12 + create + score, 5, { 'messaging.system': 'kafka', 'messaging.destination.name': 'orders.placed', 'messaging.kafka.partition': seedOf(orderId) % 12, 'messaging.kafka.offset': 4_180_000 + (seedOf(traceId) % 900_000) }]
  ], 'checkout');
}

const actionPath: Record<string, { service: string; db: string; statement: string; consumers: string[] }> = {
  'returns.refunded': { service: 'orders-api', db: 'orders-db', statement: 'UPDATE orders SET status = :1 WHERE id = :2', consumers: ['commission', 'notifications'] },
  'price.changed': { service: 'pricing', db: 'pricing-db', statement: 'INSERT INTO price_changes (sku, from_cents, to_cents, approved_by) VALUES (:1, :2, :3, :4)', consumers: ['catalog', 'marketplace-adapter'] },
  'action.performed': { service: 'ops-api', db: 'ops-db', statement: 'INSERT INTO audit_log (actor, action, key) VALUES (:1, :2, :3)', consumers: ['tidewatch', 'notifications'] }
};

/** The trace behind something a person did: BFF → middleware → service → outbox → Kafka → consumers. */
export function actionTrace(event: WorldEvent): Trace {
  const traceId = traceIdOf(event.id);
  const at = Date.parse(event.at);
  const path = actionPath[event.topic] ?? actionPath['action.performed']!;
  const label = event.topic === 'action.performed' ? `${event.payload.system} · ${event.payload.action}` : event.topic === 'returns.refunded' ? `refund ${event.payload.returnId}` : event.topic === 'price.changed' ? `approve price ${event.payload.sku}` : event.topic;
  const specs: SpanSpec[] = [
    [`POST ${label}`, 'ops-rest', 'server', null, 0, 96, { 'enduser.role': 'approver', 'idempotency.key': `idem_${event.id}` }],
    ['auth.verify_scopes', 'middleware', 'internal', 0, 1, 2],
    ['idempotency.check', 'middleware', 'client', 0, 3, 2, { 'db.system': 'redis' }],
    [event.topic, path.service, 'server', 0, 6, 38, { 'service.version': '3.9.2' }],
    [path.statement.split(' ').slice(0, 2).join(' '), path.db, 'client', 3, 9, 11, { 'db.statement': path.statement }],
    ['INSERT outbox', path.db, 'client', 3, 21, 4, { 'db.statement': 'INSERT INTO outbox (id, topic, key, payload, trace_id) VALUES (:1, :2, :3, :4, :5)' }],
    [`kafka produce ${event.topic}`, 'outbox-relay', 'producer', 0, 48, 5, { 'messaging.destination.name': event.topic, 'messaging.kafka.offset': 4_180_000 + (seedOf(event.id) % 900_000) }],
    ...path.consumers.map((consumer, index): SpanSpec => [`${consumer} consume ${event.topic}`, consumer, 'consumer', 6, 58 + index * 9, 24 + index * 6, { 'messaging.kafka.consumer.group': consumer }])
  ];
  return build(traceId, at, specs, event.topic);
}

/** The canonical slow checkout at 16:14, while the pool was saturated (V2-trace). */
export const canonicalTrace = (_world: World) => checkoutTrace(CANONICAL_TRACE, INCIDENT_START + 12 * MINUTE, true, 'MR-904117');

/** Recent traces: checkouts from the world, actions people took, and the canonical slow one. */
export function recentTraces(world: World, now: number, limit = 24): Trace[] {
  const checkouts = world.recent(['orders.placed'], limit).map((event) => checkoutTrace(traceIdOf(event.id), Date.parse(event.at), poolSaturated(world, Date.parse(event.at)), event.payload.orderId));
  const actions = world.recorded(['returns.refunded', 'price.changed', 'action.performed']).map(actionTrace);
  const canonical = canonicalTrace(world);
  return [...actions, ...checkouts, ...(now >= canonical.at ? [canonical] : [])].sort((a, b) => b.at - a.at).slice(0, limit + actions.length);
}

export function findTrace(world: World, traceId: string): Trace | undefined {
  if (traceId === CANONICAL_TRACE) return canonicalTrace(world);
  const action = world.recorded().find((event) => traceIdOf(event.id) === traceId);
  if (action) return actionTrace(action);
  return recentTraces(world, world.now(), 120).find((trace) => trace.traceId === traceId);
}

/* Golden signals ------------------------------------------------------------------------------ */

export type Point = { t: number; p50: number; p95: number; p99: number; rpm: number; errors: number };

const wobble = (t: number, salt: number) => 1 + Math.sin(t / 97_000 + salt) * 0.05 + Math.sin(t / 23_000 + salt * 2) * 0.03;

/** Checkout latency and throughput per minute for the last `minutes` minutes. */
export function checkoutSeries(world: World, now: number, minutes = 60): Point[] {
  const end = Math.floor(now / MINUTE) * MINUTE;
  return Array.from({ length: minutes }, (_, index) => {
    const t = end - (minutes - 1 - index) * MINUTE;
    const saturated = poolSaturated(world, t);
    const spike = world.state.scenario === 'black-friday' || world.isFaulted('traffic-spike', t) ? 1.35 : 1;
    const w = wobble(t, 1);
    const orders = world.count('orders.placed', t, t + MINUTE);
    return {
      t,
      p50: Math.round((saturated ? 240 : 88) * w * spike),
      p95: Math.round((saturated ? 900 : 182) * w * spike),
      p99: Math.round((saturated ? 1_420 : 320) * w * spike),
      rpm: Math.round(orders * 1_500 * (saturated ? 0.78 : 1)),
      errors: saturated ? 4.1 * w : 0.55 * w
    };
  });
}

export type Saturation = { label: string; value: number; detail: string };

export function saturation(world: World, now: number): Saturation[] {
  const saturated = poolSaturated(world, now);
  const lag = world.isFaulted('topic-lag', now);
  const spike = world.state.scenario === 'black-friday' || world.isFaulted('traffic-spike', now);
  return [
    { label: 'Orders DB pool', value: saturated ? 100 : 33, detail: saturated ? '32 of 32 in use · 41 waiting' : '21 of 64 in use' },
    { label: 'CPU · orders-api', value: saturated ? 38 : spike ? 71 : 42, detail: saturated ? 'low: threads are waiting, not working' : 'autoscaling at 70%' },
    { label: 'Heap · orders-api', value: saturated ? 81 : 56, detail: saturated ? 'queued requests hold memory' : 'steady' },
    { label: 'Kafka consumer lag', value: lag ? 94 : spike ? 48 : 7, detail: lag ? '48,210 messages · notifications' : '41 messages' }
  ];
}

/* Problems ------------------------------------------------------------------------------------ */

export type Problem = { id: string; fault: FaultId; title: string; service: string; startedAt: number; endedAt?: number; usersAffected: number; slo: string; burn: number; rootCause: string };

const problemCopy: Record<FaultId, Omit<Problem, 'id' | 'fault' | 'startedAt' | 'endedAt' | 'usersAffected' | 'burn'>> = {
  'db-pool': { title: 'Checkout p95 degraded · Orders DB pool saturated', service: 'orders-api', slo: 'Checkout latency p95 < 300 ms', rootCause: 'Deploy #812 (orders-api 4.18.0) changed ORDERS_DB_POOL_MAX from 64 to 32 through a new config default; requests wait for a connection.' },
  'carrier-outage': { title: 'Ligeiro Log unreachable · circuit open', service: 'carrier-adapter', slo: 'Partner integrations 99.5%', rootCause: 'The partner API times out after 2 s; five failures in 30 s opened the circuit.' },
  'topic-lag': { title: 'Consumer lag · notifications behind by 48k messages', service: 'notifications', slo: 'Notification freshness < 60 s', rootCause: 'A consumer rebalance loop after a pod restart; the group keeps reassigning partitions.' },
  'einvoice-fail': { title: 'E-invoice rejections · code 778', service: 'invoicing', slo: 'Invoices authorized < 10 min', rootCause: 'The tax authority retired NCM codes still used by 12 SKUs.' },
  'traffic-spike': { title: 'Traffic 3.4× baseline · saturation rising', service: 'consumer-graphql', slo: 'Checkout availability 99.9%', rootCause: 'A campaign push drove traffic to 3.4×; autoscaling is catching up.' }
};

export function problems(world: World, now: number): Problem[] {
  const out: Problem[] = [];
  for (const [fault, windows] of Object.entries(world.state.faults) as Array<[FaultId, Array<{ since: number; until?: number }>]>) {
    for (const window of windows ?? []) {
      if (window.since > now) continue;
      const ongoing = window.until === undefined || window.until > now;
      const elapsed = ((ongoing ? now : window.until!) - window.since) / MINUTE;
      out.push({ id: `P-${fault === 'db-pool' ? 812 : 900 + (seedOf(fault + window.since) % 90)}`, fault, ...problemCopy[fault], startedAt: window.since, endedAt: ongoing ? undefined : window.until, usersAffected: Math.round(elapsed * (fault === 'db-pool' ? 118 : 42)), burn: fault === 'db-pool' ? 14.2 : 6.1 });
    }
  }
  return out.sort((a, b) => (a.endedAt === undefined ? -1 : 1) - (b.endedAt === undefined ? -1 : 1) || b.startedAt - a.startedAt);
}

/* Logs ---------------------------------------------------------------------------------------- */

export type LogRecord = { t: number; level: 'debug' | 'info' | 'warn' | 'error'; service: string; message: string; traceId: string; attributes: Record<string, string | number> };

export function logsFrom(world: World, events: WorldEvent[]): LogRecord[] {
  const out: LogRecord[] = [];
  for (const event of events) {
    const t = Date.parse(event.at);
    const traceId = traceIdOf(event.id);
    switch (event.topic) {
      case 'orders.placed':
        if (poolSaturated(world, t)) out.push({ t, level: 'warn', service: 'orders-api', message: 'db pool wait exceeded 500ms', traceId, attributes: { 'db.pool.wait_ms': 600 + (seedOf(event.id) % 300), 'order.id': event.payload.orderId, 'deploy.id': 812 } });
        out.push({ t, level: 'info', service: 'orders-api', message: 'order created', traceId, attributes: { 'order.id': event.payload.orderId, channel: event.payload.channel, 'items.count': event.payload.items.length } });
        break;
      case 'payments.captured':
        out.push({ t, level: 'info', service: 'payments', message: 'payment captured', traceId, attributes: { 'order.id': event.payload.orderId, method: event.payload.method } });
        break;
      case 'delivery.updated':
        out.push({ t, level: event.payload.status === 'exception' ? 'error' : 'info', service: 'carrier-adapter', message: event.payload.status === 'exception' ? 'carrier call failed · circuit counted' : `delivery ${event.payload.status}`, traceId, attributes: { carrier: event.payload.carrier, 'order.id': event.payload.orderId } });
        break;
      case 'invoice.issued':
        out.push({ t, level: event.payload.status === 'rejected' ? 'error' : 'info', service: 'invoicing', message: event.payload.status === 'rejected' ? `invoice rejected code=${event.payload.rejectionCode}` : 'invoice authorized', traceId, attributes: { invoice: event.payload.invoice, ncm: event.payload.ncm } });
        break;
      case 'auth.scored':
        if (event.payload.latencyMs > 150) out.push({ t, level: 'warn', service: 'credit', message: 'scoring slower than SLO · rules fallback', traceId, attributes: { 'latency_ms': event.payload.latencyMs, action: event.payload.action } });
        break;
      case 'returns.refunded':
      case 'price.changed':
      case 'action.performed':
        out.push({ t, level: 'info', service: event.topic === 'price.changed' ? 'pricing' : 'ops-api', message: `${event.topic} recorded by a person`, traceId, attributes: { key: event.key } });
        break;
      default:
        break;
    }
  }
  return out;
}

export const hhmm = (ms: number) => clock(ms);
