import { Layer, LiveControl, Sparkline, closeLayers, getWorld, openLayer, setParams, useAnnouncer, useDemoState, useLiveEvents, useLocation, useRollingSeries, type WorldEvent } from '@portfolio/remote-runtime';
import { seedOf } from '@portfolio/mocks';
import { clock, type Topic } from '@portfolio/world';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { TopicReport } from '@portfolio/events/compat';
import generated from '@portfolio/events/contracts-report.json';

const report = generated as unknown as { topics: TopicReport[] };

const topics: Topic[] = ['orders.placed', 'stock.reserved', 'payments.captured', 'delivery.updated', 'invoice.issued', 'commission.confirmed', 'commission.reversed', 'dispute.opened', 'auth.scored', 'returns.created', 'returns.refunded'];
const PARTITIONS = 12;

/** Kafka-style coordinates are derived from the key, so the same event always lands the same way. */
const partitionOf = (key: string) => seedOf(key) % PARTITIONS;
const offsetOf = (event: WorldEvent) => 4_180_000 + (seedOf(event.id) % 900_000);
const consumersOf = (topic: string) => report.topics.find((item) => item.topic === topic)?.consumers.map((item) => item.consumer) ?? [];
const versionOf = (topic: string) => report.topics.find((item) => item.topic === topic)?.current ?? 'v1';

export function Events() {
  const state = useDemoState();
  const { params } = useLocation();
  const key = params.get('key') ?? '';
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [query, setQuery] = useState(key);
  const { announce, region } = useAnnouncer(12_000);
  const stream = useLiveEvents(topics, { limit: 40, filter: (event) => event.topic !== 'auth.scored' || seedOf(event.id) % 6 === 0 });
  // Actions people took (a refund at the counter) are events too, and they are the ones people come looking for.
  const actions = getWorld().recorded();
  const merged = useMemo(() => {
    const seen = new Set<string>();
    return [...actions, ...stream.items].filter((event) => (seen.has(event.id) ? false : (seen.add(event.id), true))).sort((a, b) => b.at.localeCompare(a.at));
  }, [actions.length, stream.items]);
  const needle = query.trim().toLowerCase();
  const rows = state === 'empty' ? [] : merged.filter((event) => (topic === 'all' || event.topic === topic) && (!needle || `${event.key} ${event.id} ${JSON.stringify(event.payload)}`.toLowerCase().includes(needle))).slice(0, 18);
  const throughput = useRollingSeries('orders.placed', 60_000, 24);
  const selected = params.get('drawer') === 'event' ? merged.find((event) => event.id === params.get('event')) : undefined;

  useEffect(() => {
    if (key) setQuery(key);
  }, [key]);
  useEffect(() => {
    const newest = stream.items[0];
    if (newest && stream.fresh.includes(newest.id) && newest.topic === 'invoice.issued' && newest.payload.status === 'rejected') announce(`Invoice rejected for ${newest.payload.orderId}`);
  }, [stream.items[0]?.id]);

  return (
    <main class="ms-main" id="mesh-events">
      {region}
      <section class="ms-page-head" data-anchor="ms-events-head">
        <div>
          <h1>event stream</h1>
          <p class="ms-muted">{topics.length} topics · {PARTITIONS} partitions each · outbox → cdc relay → kafka · every event carries its idempotency key</p>
        </div>
        <LiveControl label="tailing" anchor="ms-events-live" />
      </section>

      <div class="ms-kpis" data-anchor="ms-events-kpis">
        <div><span>orders.placed / min</span><strong>{throughput.at(-1) ?? 0}</strong><Sparkline values={throughput} width={120} label="orders per minute, last 24 minutes" /></div>
        <div><span>max consumer lag</span><strong>{getWorld().isFaulted('topic-lag') ? '48,210' : '41'}</strong><small>notifications · partition 3</small></div>
        <div><span>schemas</span><strong>{report.topics.length}</strong><small>{report.topics.filter((item) => item.status === 'blocked').length} change blocked in review</small></div>
        <div><span>actions recorded here</span><strong>{actions.length}</strong><small>refunds, approvals · this browser</small></div>
      </div>

      <section class="ms-panel" aria-labelledby="stream-title" data-anchor="ms-event-table">
        <header>
          <h2 id="stream-title">tail</h2>
          <form class="ms-filter" role="search" onSubmit={(event) => { event.preventDefault(); setParams({ key: query || null }); }}>
            <label class="visually-hidden" for="ms-key">filter by key, id or payload</label>
            <input id="ms-key" value={query} placeholder="key, order, return id…" onInput={(event) => setQuery(event.currentTarget.value)} />
            <select aria-label="topic" value={topic} onChange={(event) => setTopic(event.currentTarget.value as Topic | 'all')}>
              <option value="all">all topics</option>
              {topics.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </form>
        </header>
        <table class="ms-table ms-events">
          <thead><tr><th>time</th><th>topic</th><th>key</th><th>partition · offset</th><th>summary</th><th>consumers</th></tr></thead>
          <tbody>
            {rows.map((event) => {
              const isAction = event.id.startsWith('act_');
              return (
                <tr key={event.id} class={`${stream.fresh.includes(event.id) ? 'is-arriving' : ''} ${isAction ? 'action' : ''} ${summaryTone(event)}`}>
                  <td>{clock(Date.parse(event.at), true)}</td>
                  <td><span class="ms-topic">{event.topic}</span></td>
                  <td><button type="button" class="ms-link" onClick={() => openLayer({ drawer: 'event', event: event.id })}>{event.key}</button></td>
                  <td class="muted">p{partitionOf(event.key)} · {offsetOf(event).toLocaleString('en-US')}</td>
                  <td>{summary(event)}{isAction && <em class="ms-by">recorded by a person</em>}</td>
                  <td class="muted">{consumersOf(event.topic).length} ✓</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <div class="ms-empty" data-anchor="ms-events-empty">
            <strong>{state === 'empty' ? 'no events in the last 5 min' : `nothing matches “${query}” yet`}</strong>
            <p class="ms-muted">{state === 'empty' ? 'the bus is idle, not broken: consumers are connected and lag is 0.' : 'events appear here within a second of being published; refunds show up as returns.refunded.'}</p>
          </div>
        )}
      </section>

      {selected && <EventDrawer event={selected} />}
    </main>
  );
}

function summaryTone(event: WorldEvent) {
  if (event.topic === 'invoice.issued' && event.payload.status === 'rejected') return 'fail';
  if (event.topic === 'delivery.updated' && event.payload.status === 'exception') return 'fail';
  return '';
}

function summary(event: WorldEvent) {
  switch (event.topic) {
    case 'orders.placed': return `${event.payload.channel} · ${event.payload.items.length} item(s) · ${event.payload.fulfillment}`;
    case 'stock.reserved': return `${event.payload.sku} ${event.payload.size} @ ${event.payload.store} · ${event.payload.remaining} left`;
    case 'payments.captured': return `${event.payload.method} · ${event.payload.installments}×`;
    case 'delivery.updated': return `${event.payload.carrier.toLowerCase()} · ${event.payload.status}`;
    case 'invoice.issued': return event.payload.status === 'rejected' ? `rejected · code ${event.payload.rejectionCode} · ncm ${event.payload.ncm}` : 'authorized';
    case 'commission.confirmed': return `${event.payload.code} · ${event.payload.reversed ? 'reversed' : 'confirmed'}`;
    case 'commission.reversed': return `${event.payload.code} · reversed · ${event.payload.reason}`;
    case 'dispute.opened': return `${event.payload.reason} · due in ${event.payload.dueDays} d`;
    case 'auth.scored': return `score ${event.payload.score} · ${event.payload.action} · ${event.payload.latencyMs} ms`;
    case 'returns.created': return `${event.payload.channel} · ${event.payload.reason}`;
    case 'returns.refunded': return `${event.payload.method} · by ${event.payload.staff.toLowerCase()}`;
  }
}

function EventDrawer({ event }: { event: WorldEvent }) {
  const consumers = report.topics.find((item) => item.topic === event.topic)?.consumers ?? [];
  return (
    <Layer kind="drawer" title={event.topic} eyebrow={`${event.key} · ${versionOf(event.topic)} · p${partitionOf(event.key)}`} onClose={() => closeLayers(['drawer', 'event'])} width={560} anchor="ms-event-drawer">
      <dl class="ms-kv">
        <div><dt>event id</dt><dd>{event.id}</dd></div>
        <div><dt>idempotency key</dt><dd>{event.topic}:{event.key}</dd></div>
        <div><dt>published</dt><dd>{clock(Date.parse(event.at), true)} · outbox → relay 38 ms</dd></div>
        <div><dt>schema</dt><dd>{event.topic} {versionOf(event.topic)} · JSON Schema · validated</dd></div>
      </dl>
      <pre class="ms-json" tabIndex={0} aria-label="payload"><code>{JSON.stringify(event.payload, null, 2)}</code></pre>
      <h3 class="ms-subhead">delivered to</h3>
      <ul class="ms-delivered">
        {consumers.map((consumer) => <li key={consumer.consumer}><span class="ok">✓</span>{consumer.consumer}<small>{consumer.owner}</small></li>)}
      </ul>
    </Layer>
  );
}
