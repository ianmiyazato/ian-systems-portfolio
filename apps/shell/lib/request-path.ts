import type { FaultId, Topic } from '@portfolio/world';

/**
 * The full Maré request path: clients → edge → BFFs → middleware → services (each with its own
 * database) → event backbone → partner adapters, with the observability plane underneath.
 * Open-source technology keeps its real name; commercial vendors get generic roles.
 */
export type Layer = 'client' | 'edge' | 'bff' | 'middleware' | 'service' | 'database' | 'backbone' | 'partner' | 'observability';

export type PathNode = {
  id: string;
  layer: Layer;
  label: string;
  sub: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** Database or storage choice (services) and why. */
  db?: { tech: string; why: string };
  decisions: string[];
  failures: string[];
  /** Baseline golden signals; faults move them. */
  base: { p95: number; errors: number; saturation: number };
  /** Faults that hurt this node. */
  sensitive?: FaultId[];
};

const svc = (id: string, label: string, sub: string, y: number, db: PathNode['db'], decisions: string[], failures: string[], base: PathNode['base'], sensitive?: FaultId[]): PathNode => ({ id, layer: 'service', label, sub, x: 800, y, w: 150, h: 54, db, decisions, failures, base, sensitive });

export const nodes: PathNode[] = [
  // Clients
  { id: 'app', layer: 'client', label: 'Shopping app', sub: 'iOS · Android', x: 80, y: 110, decisions: ['Persisted GraphQL queries: the app ships query ids, not query text.'], failures: ['Flaky mobile networks: every mutation carries an idempotency key.'], base: { p95: 0, errors: 0.2, saturation: 0 } },
  { id: 'site', layer: 'client', label: 'Site', sub: 'Astro · islands', x: 80, y: 210, decisions: ['HTML-first pages; product data is static until price events revalidate it.'], failures: ['A stale price is fixed by the price.changed event, not by a cache TTL.'], base: { p95: 0, errors: 0.1, saturation: 0 } },
  { id: 'tablet', layer: 'client', label: 'Counter tablet', sub: 'offline-first', x: 80, y: 310, decisions: ['Actions queue locally and sync with idempotency keys.'], failures: ['Mall Wi-Fi drops: scans and handovers keep working offline.'], base: { p95: 0, errors: 0.3, saturation: 0 } },
  { id: 'ops', layer: 'client', label: 'Ops web', sub: 'Maré Ops · 5 remotes', x: 80, y: 410, decisions: ['Runtime federation: five teams ship five remotes independently.'], failures: ['One remote failing stays inside its error boundary.'], base: { p95: 0, errors: 0.1, saturation: 0 } },
  { id: 'partners-in', layer: 'client', label: 'Partners', sub: 'carriers · sellers', x: 80, y: 510, decisions: ['Partners call a separate gateway with mutual TLS and their own quotas.'], failures: ['A partner retry storm cannot starve customer traffic.'], base: { p95: 0, errors: 0.6, saturation: 0 } },
  // Edge
  { id: 'cdn', layer: 'edge', label: 'CDN + WAF', sub: 'static · bot rules', x: 270, y: 160, decisions: ['Static-first: pages and assets are served from the edge, never from a function.'], failures: ['A traffic spike is absorbed by cache; only writes reach the gateway.'], base: { p95: 18, errors: 0.01, saturation: 22 }, sensitive: ['traffic-spike'] },
  { id: 'gateway', layer: 'edge', label: 'API gateway', sub: 'OIDC · rate limits · quotas', x: 270, y: 300, decisions: ['OIDC tokens are verified once at the gateway; services trust scoped claims.', 'Rate limits per client and per route; quotas per partner plan.'], failures: ['Over quota returns 429 with Retry-After; clients back off.'], base: { p95: 12, errors: 0.05, saturation: 31 }, sensitive: ['traffic-spike'] },
  { id: 'partner-gw', layer: 'edge', label: 'Partner gateway', sub: 'mTLS · webhooks in', x: 270, y: 480, decisions: ['Mutual TLS per partner; webhook signatures verified before anything is parsed.'], failures: ['An unsigned or replayed webhook is rejected at the door.'], base: { p95: 20, errors: 0.2, saturation: 18 } },
  // BFFs
  { id: 'bff-consumer', layer: 'bff', label: 'Consumer GraphQL', sub: 'persisted queries', x: 460, y: 130, decisions: ['One BFF per client type: the app and site get exactly the shape they render.'], failures: ['Unknown query ids are refused: no arbitrary queries from the internet.'], base: { p95: 64, errors: 0.2, saturation: 34 }, sensitive: ['traffic-spike'] },
  { id: 'bff-store', layer: 'bff', label: 'Store GraphQL', sub: 'offline sync', x: 460, y: 270, decisions: ['Sync endpoints accept batches of queued actions with their original keys.'], failures: ['Replays after an outage are deduplicated by key.'], base: { p95: 48, errors: 0.1, saturation: 21 } },
  { id: 'bff-ops', layer: 'bff', label: 'Ops REST', sub: 'RBAC', x: 460, y: 400, decisions: ['Role-based access per remote; every approval writes an audit event.'], failures: ['A missing role is a designed read-only state, not an error page.'], base: { p95: 55, errors: 0.1, saturation: 19 } },
  { id: 'bff-partner', layer: 'bff', label: 'Partner REST', sub: 'webhooks out', x: 460, y: 520, decisions: ['Outbound webhooks are signed and retried with backoff from a queue.'], failures: ['A dead partner endpoint fills its own queue, not ours.'], base: { p95: 70, errors: 0.4, saturation: 26 } },
  // Middleware chain (rendered as one band)
  { id: 'middleware', layer: 'middleware', label: 'Middleware chain', sub: 'auth scopes → idempotency keys → OpenTelemetry context → feature flags → circuit breakers → validation', x: 630, y: 385, w: 60, h: 660, decisions: ['The same chain wraps every BFF → service call, in this order.', 'Idempotency keys are checked before validation so a retry never re-runs side effects.', 'OpenTelemetry context propagates the trace id into every event header.'], failures: ['A downstream breaker opening returns a designed fallback instead of a timeout.'], base: { p95: 3, errors: 0, saturation: 12 } },
  // Services + their databases
  svc('orders', 'Orders', 'writes once, emits', 90, { tech: 'enterprise RDBMS · outbox table', why: 'Orders are money: strict transactions, and the outbox row commits with the order.' }, ['The order and its outbox event commit in one transaction.'], ['Connection pool saturation after deploy #812 raised p95 from 180 to 900 ms.'], { p95: 182, errors: 0.5, saturation: 44 }, ['db-pool', 'traffic-spike']),
  svc('inventory', 'Inventory', 'reservations · ATP', 175, { tech: 'MongoDB + Redis', why: 'Per-store stock documents; Redis holds the hot available-to-promise counters.' }, ['Reservations are atomic decrements in Redis, reconciled to MongoDB.'], ['A Redis failover falls back to MongoDB reads with a freshness banner.'], { p95: 38, errors: 0.2, saturation: 38 }, ['traffic-spike']),
  svc('pricing', 'Pricing', 'rules · proposals', 260, { tech: 'Postgres + Redis', why: 'Relational price rules and history; Redis caches the resolved price per channel.' }, ['Prices change only through approved price.changed events.'], ['Cache stampede on a price change is avoided with request coalescing.'], { p95: 41, errors: 0.1, saturation: 29 }),
  svc('catalog', 'Catalog', 'products · search', 345, { tech: 'MongoDB + OpenSearch', why: 'Flexible product documents; OpenSearch serves facets and semantic search.' }, ['Search indexes are rebuilt from events, never written directly.'], ['Index lag shows as a freshness line in Product Hub.'], { p95: 56, errors: 0.1, saturation: 33 }),
  svc('credit', 'Credit', 'scoring · limits', 430, { tech: 'enterprise RDBMS', why: 'Ledger-grade consistency for limits and installments.' }, ['Scores and the policy version are stored with every decision.'], ['Feature lookups slow under DB pool saturation; scoring falls back to rules.'], { p95: 84, errors: 0.1, saturation: 41 }, ['db-pool']),
  svc('commission', 'Commission', 'attribution · payouts', 515, { tech: 'Postgres', why: 'Append-only ledger of accruals and reversals; confirmation after 30 days.' }, ['Returns reverse unconfirmed commission; nothing is clawed back.'], ['Duplicate reversal events are dropped by their key.'], { p95: 35, errors: 0.05, saturation: 17 }),
  svc('invoicing', 'Invoicing', 'e-invoices', 600, { tech: 'enterprise RDBMS', why: 'Invoice numbers are legal sequences; strict uniqueness.' }, ['Invoices are an idempotent batch keyed by invoice number.'], ['Tax authority rejections park in the DLQ with the reason.'], { p95: 330, errors: 2.6, saturation: 36 }, ['einvoice-fail']),
  svc('notifications', 'Notifications', 'push · WhatsApp · email', 685, { tech: 'Redis streams', why: 'Short-lived fan-out with consumer groups; nothing to keep forever.' }, ['Quiet hours and one-contact-a-day rules live here, not in each system.'], ['A provider outage backs up the stream; messages expire after 24 h.'], { p95: 90, errors: 0.3, saturation: 24 }, ['topic-lag']),
  // Event backbone
  { id: 'outbox', layer: 'backbone', label: 'Outbox → CDC relay', sub: 'Debezium-style', x: 1080, y: 140, w: 170, decisions: ['CDC reads the outbox table and publishes; no dual writes.'], failures: ['Relay lag grows under load; order writes are unaffected.'], base: { p95: 38, errors: 0, saturation: 27 }, sensitive: ['topic-lag'] },
  { id: 'kafka', layer: 'backbone', label: 'Kafka', sub: '12 topics · keyed', x: 1080, y: 290, w: 170, h: 90, decisions: ['Keyed by business id: per-order ordering, horizontal scale.', 'JSON Schema per topic, checked in CI with consumer contracts.'], failures: ['Consumer lag triggers autoscaling; a lagging consumer never blocks producers.'], base: { p95: 9, errors: 0, saturation: 35 }, sensitive: ['topic-lag', 'traffic-spike'] },
  { id: 'queues', layer: 'backbone', label: 'Work queues', sub: 'per consumer · retries', x: 1080, y: 430, w: 170, decisions: ['Each slow consumer gets its own queue with backoff.'], failures: ['Poison messages move to the DLQ after five attempts.'], base: { p95: 22, errors: 0.1, saturation: 21 } },
  { id: 'fanout', layer: 'backbone', label: 'Fan-out topics', sub: 'notify many', x: 1080, y: 530, w: 170, decisions: ['One event, many subscribers (notifications, lake, partners).'], failures: ['A slow subscriber only delays itself.'], base: { p95: 14, errors: 0, saturation: 12 } },
  { id: 'dlq', layer: 'backbone', label: 'DLQs', sub: 'dry-run replay', x: 1080, y: 640, w: 170, decisions: ['Failed events park with their key; replays are reviewed actions.'], failures: ['DLQ depth alerts before customers notice.'], base: { p95: 0, errors: 0, saturation: 9 }, sensitive: ['carrier-outage', 'einvoice-fail'] },
  // Partner adapters (anti-corruption layer)
  { id: 'carriers', layer: 'partner', label: 'Carrier adapters', sub: 'ACL · circuit breakers', x: 1310, y: 200, decisions: ['One adapter per carrier maps their codes to canonical statuses.'], failures: ['Ligeiro Log outage: the circuit opens, calls fail fast, events park.'], base: { p95: 142, errors: 0.4, saturation: 28 }, sensitive: ['carrier-outage'] },
  { id: 'tax', layer: 'partner', label: 'Tax gateway adapter', sub: 'ACL · e-invoices', x: 1310, y: 330, decisions: ['NCM and tax rules are translated at the edge of the system.'], failures: ['Rejection 778 (retired NCM) is triaged by an agent, fixed in the catalog.'], base: { p95: 330, errors: 2.6, saturation: 31 }, sensitive: ['einvoice-fail'] },
  { id: 'networks', layer: 'partner', label: 'Payment networks', sub: 'ACL · auth + disputes', x: 1310, y: 460, decisions: ['Authorizations are scored before capture; disputes arrive as events.'], failures: ['Scoring timeout falls back to rules-only with step-up.'], base: { p95: 96, errors: 0.2, saturation: 33 }, sensitive: ['db-pool'] },
  { id: 'marketplace', layer: 'partner', label: 'Marketplace sellers', sub: 'ACL · feeds', x: 1310, y: 590, decisions: ['Seller feeds are validated row by row and mapped at the edge.'], failures: ['A bad feed never touches published products.'], base: { p95: 210, errors: 1.1, saturation: 20 } },
  // Observability plane
  { id: 'otel', layer: 'observability', label: 'OpenTelemetry collector', sub: 'traces · metrics · logs', x: 470, y: 820, w: 220, decisions: ['Every hop propagates W3C trace context; events carry it in headers.'], failures: ['Collector backpressure drops spans, never requests.'], base: { p95: 4, errors: 0, saturation: 30 } },
  { id: 'traces', layer: 'observability', label: 'Traces', sub: 'tail sampling', x: 720, y: 820, w: 110, decisions: ['Tail sampling keeps every slow and failed trace.'], failures: [], base: { p95: 0, errors: 0, saturation: 18 } },
  { id: 'metrics', layer: 'observability', label: 'Metrics', sub: 'Prometheus-style', x: 850, y: 820, w: 110, decisions: ['RED metrics per route, USE metrics per resource.'], failures: [], base: { p95: 0, errors: 0, saturation: 22 } },
  { id: 'logs', layer: 'observability', label: 'Logs', sub: 'structured JSON', x: 980, y: 820, w: 110, decisions: ['Logs carry trace ids, so a trace shows its logs.'], failures: [], base: { p95: 0, errors: 0, saturation: 25 } },
  { id: 'slos', layer: 'observability', label: 'Alerts + SLOs', sub: 'Tidewatch', x: 1130, y: 820, w: 150, decisions: ['Alerts page on error-budget burn rate, not on single spikes.'], failures: [], base: { p95: 0, errors: 0, saturation: 14 } }
];

export const nodeById = (id: string) => nodes.find((node) => node.id === id)!;

/** Service → its database pill, drawn to the right of the service. */
export const dbNodes = nodes.filter((node) => node.layer === 'service').map((node) => ({ id: `${node.id}-db`, of: node.id, label: node.db!.tech, x: 975, y: node.y }));

export type Link = [string, string];

export const links: Link[] = [
  ['app', 'cdn'], ['site', 'cdn'], ['app', 'gateway'], ['site', 'gateway'], ['tablet', 'gateway'], ['ops', 'gateway'], ['partners-in', 'partner-gw'],
  ['cdn', 'bff-consumer'], ['gateway', 'bff-consumer'], ['gateway', 'bff-store'], ['gateway', 'bff-ops'], ['partner-gw', 'bff-partner'],
  ['bff-consumer', 'middleware'], ['bff-store', 'middleware'], ['bff-ops', 'middleware'], ['bff-partner', 'middleware'],
  ...nodes.filter((node) => node.layer === 'service').map((node) => ['middleware', node.id] as Link),
  ['orders', 'outbox'], ['inventory', 'outbox'], ['pricing', 'outbox'], ['commission', 'outbox'], ['credit', 'outbox'], ['invoicing', 'outbox'],
  ['outbox', 'kafka'], ['kafka', 'queues'], ['kafka', 'fanout'], ['queues', 'dlq'],
  ['queues', 'carriers'], ['queues', 'tax'], ['kafka', 'networks'], ['fanout', 'marketplace'], ['fanout', 'notifications'],
  ['otel', 'traces'], ['otel', 'metrics'], ['otel', 'logs'], ['metrics', 'slos'], ['traces', 'slos']
];

/** The real path each domain event takes, used to animate live packets. */
export const routes: Partial<Record<Topic, string[]>> = {
  'orders.placed': ['app', 'gateway', 'bff-consumer', 'middleware', 'orders', 'outbox', 'kafka', 'fanout', 'notifications'],
  'stock.reserved': ['tablet', 'gateway', 'bff-store', 'middleware', 'inventory', 'outbox', 'kafka'],
  'payments.captured': ['site', 'gateway', 'bff-consumer', 'middleware', 'credit', 'outbox', 'kafka', 'networks'],
  'delivery.updated': ['partners-in', 'partner-gw', 'bff-partner', 'middleware', 'orders', 'outbox', 'kafka', 'queues', 'carriers'],
  'invoice.issued': ['ops', 'gateway', 'bff-ops', 'middleware', 'invoicing', 'outbox', 'kafka', 'queues', 'tax'],
  'commission.confirmed': ['ops', 'gateway', 'bff-ops', 'middleware', 'commission', 'outbox', 'kafka', 'fanout'],
  'auth.scored': ['partners-in', 'partner-gw', 'bff-partner', 'middleware', 'credit', 'outbox', 'kafka'],
  'returns.refunded': ['tablet', 'gateway', 'bff-store', 'middleware', 'orders', 'outbox', 'kafka', 'fanout', 'notifications'],
  'price.changed': ['ops', 'gateway', 'bff-ops', 'middleware', 'pricing', 'outbox', 'kafka', 'fanout', 'marketplace']
};

export type ScenarioStep = { nodes: string[]; failed?: string[]; narration: string };
export type Scenario = { id: string; name: string; fault?: FaultId; blackFriday?: boolean; steps: ScenarioStep[]; links: Array<{ label: string; href: string }> };

export const scenarios: Scenario[] = [
  {
    id: 'black-friday', name: 'Black Friday spike', blackFriday: true,
    steps: [
      { nodes: ['app', 'site', 'cdn'], narration: 'At midnight traffic triples (3.4×). The CDN serves pages and assets; only writes travel further.' },
      { nodes: ['gateway', 'bff-consumer'], narration: 'The gateway enforces per-client rate limits; persisted queries keep the consumer BFF cheap to scale.' },
      { nodes: ['middleware', 'orders', 'inventory'], narration: 'Idempotency keys absorb retries; Orders writes once and Inventory decrements hot counters in Redis.' },
      { nodes: ['outbox', 'kafka', 'queues'], narration: 'The outbox relay and Kafka take the burst; consumers scale on lag. The spike becomes a short backlog, not an outage.' },
      { nodes: ['metrics', 'slos'], narration: 'Error budget holds: p95 rises but stays inside the checkout SLO.' }
    ],
    links: [{ label: 'Counter under the spike', href: '/mare/ops/counter?scenario=black-friday' }, { label: 'Event stream', href: '/mare/ops/mesh/events?scenario=black-friday' }]
  },
  {
    id: 'db-pool', name: 'DB pool saturation after deploy #812', fault: 'db-pool',
    steps: [
      { nodes: ['orders'], narration: 'Deploy #812 halves the Orders connection pool from 64 to 32 by accident (a config default changed).' },
      { nodes: ['orders', 'credit'], failed: ['orders'], narration: 'At the evening peak requests queue for a connection: db.pool.wait_ms climbs and p95 goes from 180 to 900 ms.' },
      { nodes: ['networks', 'credit'], failed: ['credit'], narration: 'Credit scoring shares the database: feature lookups slow and authorizations fall back to rules-only step-up.' },
      { nodes: ['otel', 'traces', 'slos'], narration: 'Tidewatch opens a problem: traces show the time spent waiting for a connection, with the deploy marker right before it.' },
      { nodes: ['orders'], narration: 'Rolling back #812 (or raising the pool to 64) resolves it; charts recover within two minutes.' }
    ],
    links: [{ label: 'Tidewatch problem', href: '/observability' }, { label: 'Pay fraud latency', href: '/mare/ops/pay/fraud' }]
  },
  {
    id: 'carrier-outage', name: 'Carrier outage', fault: 'carrier-outage',
    steps: [
      { nodes: ['kafka', 'queues'], narration: 'Delivery updates keep flowing through Kafka into the carrier work queue.' },
      { nodes: ['carriers'], failed: ['carriers'], narration: 'Ligeiro Log starts timing out; five failures in 30 s open its circuit.' },
      { nodes: ['dlq'], narration: 'Calls fail fast; events park in the DLQ with their idempotency keys.' },
      { nodes: ['tablet', 'bff-store'], narration: 'Counter shows a banner and offers Via Norte for new deliveries; the customer promise updates.' },
      { nodes: ['carriers', 'dlq'], narration: 'Half-open probes succeed; an engineer replays the DLQ after a dry run. Nothing is applied twice.' }
    ],
    links: [{ label: 'Mesh partner adapter', href: '/mare/ops/mesh/partners/ligeiro-log' }, { label: 'Counter lanes', href: '/mare/ops/counter' }]
  },
  {
    id: 'schema', name: 'Breaking schema change blocked',
    steps: [
      { nodes: ['orders'], narration: 'A PR proposes delivery.updated v3: an ETA window replaces etaMinutes and carrier becomes carrierId.' },
      { nodes: ['kafka'], failed: ['kafka'], narration: 'CI runs the contract checker: two removed fields, two new required fields: breaking under BACKWARD.' },
      { nodes: ['notifications', 'tablet'], failed: ['notifications'], narration: 'Consumer contracts name who breaks: Counter, shop tracking and notifications read etaMinutes.' },
      { nodes: ['kafka', 'orders'], narration: 'The planner proposes expand → migrate → contract; the expand PR passes because the new fields are optional.' }
    ],
    links: [{ label: 'Mesh contracts', href: '/mare/ops/mesh/contracts' }]
  },
  {
    id: 'einvoice', name: 'E-invoice rejections', fault: 'einvoice-fail',
    steps: [
      { nodes: ['invoicing', 'kafka', 'queues'], narration: 'Shipment invoices go to the tax gateway adapter through a work queue.' },
      { nodes: ['tax'], failed: ['tax'], narration: 'Code 778 rejections: some SKUs still carry retired NCM codes.' },
      { nodes: ['dlq'], narration: 'Rejected invoices park with the reason; transport documents wait instead of failing silently.' },
      { nodes: ['catalog', 'bff-ops'], narration: 'An agent proposes corrected codes with retrieved context; a person approves the catalog fix.' },
      { nodes: ['invoicing', 'tax'], narration: 'One idempotent batch resends them; tomorrow\'s orders are already correct.' }
    ],
    links: [{ label: 'Invoice chain', href: '/mare/ops/mesh/invoices/MR-904117' }]
  },
  {
    id: 'coupon-leak', name: 'Coupon leak',
    steps: [
      { nodes: ['site', 'app'], narration: 'MARI15 appears on a coupon aggregator; uses jump to several times the baseline.' },
      { nodes: ['orders', 'kafka'], narration: 'Orders carry the code plus creator-session evidence (or its absence) in their event.' },
      { nodes: ['commission'], failed: ['commission'], narration: 'The leak detector flags uses without creator sessions; their commission is held, not paid.' },
      { nodes: ['commission', 'fanout'], narration: 'The code is rotated and capped; the creator gets a new one, and real sales keep counting.' }
    ],
    links: [{ label: 'Circle leak', href: '/mare/ops/circle?modal=leak&code=MARI15&sub=rotate' }]
  }
];

export const layers: Array<{ id: 'all' | 'queues' | 'databases' | 'observability'; label: string; show: (layer: Layer) => boolean }> = [
  { id: 'all', label: 'Everything', show: () => true },
  { id: 'queues', label: 'Only queues', show: (layer) => layer === 'backbone' },
  { id: 'databases', label: 'Only databases', show: (layer) => layer === 'database' || layer === 'service' },
  { id: 'observability', label: 'Only observability', show: (layer) => layer === 'observability' || layer === 'middleware' }
];

export const layerLabels: Array<{ layer: Layer; label: string; x: number }> = [
  { layer: 'client', label: 'clients', x: 80 }, { layer: 'edge', label: 'edge', x: 255 }, { layer: 'bff', label: 'BFFs', x: 440 },
  { layer: 'middleware', label: 'middleware', x: 630 }, { layer: 'service', label: 'services', x: 760 }, { layer: 'database', label: 'own db', x: 925 },
  { layer: 'backbone', label: 'event backbone', x: 1105 }, { layer: 'partner', label: 'partner adapters', x: 1325 }
];
