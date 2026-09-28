export type Tag = 'Frontend' | 'Backend' | 'Data' | 'AI';
export type ArchNode = { id: string; label: string; sub: string; x: number; y: number; kind: 'client' | 'edge' | 'service' | 'bus' | 'store' | 'ai' | 'partner'; decision: { tag: Tag; decision: string; why: string; value: string } };
export type ArchEdge = { id: string; from: string; to: string; label?: string };
export type Step = { nodes: string[]; edges: string[]; failed?: string[]; narration: string };
export type Scenario = { id: string; name: string; steps: Step[] };
export type Architecture = { project: string; name: string; theme: string; nodes: ArchNode[]; edges: ArchEdge[]; scenarios: Scenario[]; before: { nodes: Array<{ id: string; label: string }>; failure: string }; metrics: Array<[string, string]> };

const e = (from: string, to: string, label?: string): ArchEdge => ({ id: `${from}->${to}`, from, to, label });

export const architectures: Record<string, Architecture> = {
  mare: {
    project: 'mare', name: 'Maré', theme: 'portfolio',
    nodes: [
      { id: 'channels', label: 'Site · App', sub: 'Astro + phone apps', x: 0, y: 40, kind: 'client', decision: { tag: 'Frontend', decision: 'Channels only express intent', why: 'Checkout writes one command and returns; it never waits on carriers or tax.', value: 'Customers are released in milliseconds even when partners are slow.' } },
      { id: 'stores', label: 'Counter · 38 stores', sub: 'offline queue', x: 0, y: 200, kind: 'client', decision: { tag: 'Frontend', decision: 'Store actions queue offline with idempotency keys', why: 'Mall Wi-Fi drops; a scan must never be lost or double-applied.', value: 'Counters keep working through outages.' } },
      { id: 'edge', label: 'API edge', sub: 'auth · rate limit · idempotency', x: 250, y: 120, kind: 'edge', decision: { tag: 'Backend', decision: 'Idempotency keys are enforced at the edge', why: 'Retries from phones, stores and partners all converge here.', value: 'Every write is safe to repeat.' } },
      { id: 'orders', label: 'Order service', sub: 'writes once, emits', x: 480, y: 120, kind: 'service', decision: { tag: 'Backend', decision: 'The order service writes once and emits canonical.order.v4', why: 'One source of truth; everything else reacts.', value: 'New consumers need no change to checkout.' } },
      { id: 'bus', label: 'Event bus', sub: 'canonical.order.v4', x: 710, y: 120, kind: 'bus', decision: { tag: 'Data', decision: 'One canonical event contract, versioned', why: 'Systems disagree on pixels, never on what an order is.', value: 'Contracts are testable and replayable.' } },
      { id: 'fulfill', label: 'Fulfillment workers', sub: 'autoscale on lag', x: 960, y: 0, kind: 'service', decision: { tag: 'Backend', decision: 'Consumers scale on queue lag, independently', why: 'Black Friday load hits fulfillment, not checkout.', value: 'Spikes become backlog, not outages.' } },
      { id: 'carriers', label: 'Carrier adapters', sub: 'circuit breakers', x: 960, y: 120, kind: 'partner', decision: { tag: 'Backend', decision: 'One adapter per carrier with its own circuit breaker', why: 'A slow carrier must not exhaust shared threads.', value: 'Failures stay bounded to the partner that has them.' } },
      { id: 'einvoice', label: 'E-invoice worker', sub: 'tax authority', x: 960, y: 240, kind: 'partner', decision: { tag: 'Backend', decision: 'Invoices are an idempotent batch keyed by invoice number', why: 'The authority may time out; retries must not duplicate invoices.', value: 'Resends are safe to repeat.' } },
      { id: 'dlq', label: 'DLQ + replay', sub: 'dry run · transforms', x: 1210, y: 180, kind: 'store', decision: { tag: 'Data', decision: 'Failed events park with their keys and replay after a dry run', why: 'Recovery should be a reviewed action, not a script.', value: 'Incidents end with a replay, not data surgery.' } },
      { id: 'read', label: 'Read models', sub: 'catalog · ATP · lanes', x: 1210, y: 40, kind: 'store', decision: { tag: 'Data', decision: 'Purpose-built read models per screen', why: 'Counter lanes, catalog facets and ATP need different shapes.', value: 'Catalog reads 3–5× faster.' } },
      { id: 'agents', label: 'Agents', sub: 'cutoff · pricing · triage', x: 710, y: 280, kind: 'ai', decision: { tag: 'AI', decision: 'Agents read events and propose; people approve', why: 'Agents are good at noticing; approval stays with owners.', value: 'Faster decisions with an audit trail.' } }
    ],
    edges: [e('channels', 'edge', 'intent'), e('stores', 'edge', 'queued'), e('edge', 'orders'), e('orders', 'bus', 'emit'), e('bus', 'fulfill'), e('bus', 'carriers'), e('bus', 'einvoice'), e('carriers', 'dlq', 'fail'), e('einvoice', 'dlq', 'reject'), e('fulfill', 'read'), e('bus', 'agents'), e('agents', 'orders', 'proposal')],
    scenarios: [
      { id: 'black-friday', name: 'Black Friday spike', steps: [
        { nodes: ['channels', 'stores'], edges: [], narration: 'Checkout traffic jumps 11× at midnight; stores keep scanning.' },
        { nodes: ['edge'], edges: ['channels->edge', 'stores->edge'], narration: 'The edge rate-limits per client and dedupes retries by idempotency key.' },
        { nodes: ['orders', 'bus'], edges: ['edge->orders', 'orders->bus'], narration: 'Each order is written once and emitted; the customer is released immediately.' },
        { nodes: ['fulfill'], edges: ['bus->fulfill'], narration: 'Fulfillment workers autoscale on lag; the spike becomes a short backlog, not an outage.' },
        { nodes: ['read'], edges: ['fulfill->read'], narration: 'Read models converge within seconds and screens show their freshness.' }
      ] },
      { id: 'carrier-outage', name: 'Carrier outage', steps: [
        { nodes: ['bus'], edges: [], narration: 'Orders keep flowing into the bus as usual.' },
        { nodes: ['carriers'], edges: ['bus->carriers'], failed: ['carriers'], narration: 'Ligeiro Log starts timing out; five failures in 30 s open its circuit.' },
        { nodes: ['dlq'], edges: ['carriers->dlq'], narration: 'Calls fail fast; events park in the DLQ with their idempotency keys.' },
        { nodes: ['agents'], edges: ['bus->agents'], narration: 'The triage agent links the failures to the partner changelog and proposes a mapping.' },
        { nodes: ['carriers', 'dlq'], edges: ['carriers->dlq'], narration: 'Half-open probes succeed; an engineer replays the DLQ after a dry run. Nothing is applied twice.' }
      ] },
      { id: 'einvoice', name: 'E-invoice rejections', steps: [
        { nodes: ['bus', 'einvoice'], edges: ['bus->einvoice'], narration: 'Shipment invoices go to the tax authority.' },
        { nodes: ['einvoice'], edges: [], failed: ['einvoice'], narration: 'Code 778 rejections: twelve SKUs still carry retired NCM codes.' },
        { nodes: ['dlq'], edges: ['einvoice->dlq'], narration: 'Rejected invoices park; transport documents wait instead of failing silently.' },
        { nodes: ['agents', 'orders'], edges: ['bus->agents', 'agents->orders'], narration: 'The agent proposes corrected codes with retrieved context; a person approves the catalog fix.' },
        { nodes: ['einvoice', 'read'], edges: ['bus->einvoice'], narration: 'One idempotent batch resends 38 invoices; tomorrow\'s orders are already correct.' }
      ] },
      { id: 'coupon-leak', name: 'Coupon leak', steps: [
        { nodes: ['channels'], edges: [], narration: 'MARI15 appears on a coupon aggregator; uses jump to 3.8× baseline.' },
        { nodes: ['orders', 'bus'], edges: ['channels->edge', 'edge->orders', 'orders->bus'], narration: 'Orders carry the code plus creator-session evidence (or its absence).' },
        { nodes: ['agents'], edges: ['bus->agents'], narration: 'The leak detector flags uses without creator sessions.' },
        { nodes: ['read'], edges: ['fulfill->read'], narration: 'Commission on unattributed uses is held; attributed sales still pay after the return window.' }
      ] }
    ],
    before: { nodes: [{ id: 'b1', label: 'Checkout' }, { id: 'b2', label: 'Order API' }, { id: 'b3', label: 'Carrier API' }, { id: 'b4', label: 'Tax gateway' }, { id: 'b5', label: 'Payment' }], failure: 'One slow partner times out the whole chain, and the customer sees an error for a problem they did not cause.' },
    metrics: [['API latency', '450 → ~200 ms'], ['Error rate', '1.8% → 0.5–0.7%'], ['Recovery time (MTTR)', '2–3 h → 30–45 min'], ['Deploys', '2 → 8–12 per week']]
  },
  atlas: {
    project: 'atlas', name: 'Atlas', theme: 'atlas',
    nodes: [
      { id: 'web', label: 'Atlas web', sub: 'Next.js · edge-rendered', x: 0, y: 120, kind: 'client', decision: { tag: 'Frontend', decision: 'One app, three products sharing a pipeline', why: 'Practice and applications must reference each other.', value: 'A rejection becomes the next practice prompt.' } },
      { id: 'edge', label: 'Entitlements edge', sub: 'plan checks', x: 250, y: 120, kind: 'edge', decision: { tag: 'Backend', decision: 'Entitlements are checked at the edge from a signed plan claim', why: 'Every zone must agree on what a member can open.', value: 'Upgrades apply everywhere without a database read per request.' } },
      { id: 'billing', label: 'Billing', sub: 'card · Pix', x: 480, y: 0, kind: 'partner', decision: { tag: 'Backend', decision: 'Billing webhooks are idempotent and emit plan.changed', why: 'Payment providers retry webhooks.', value: 'No double upgrades, no lost ones.' } },
      { id: 'pipeline', label: 'Pipeline service', sub: 'applications · outcomes', x: 480, y: 120, kind: 'service', decision: { tag: 'Backend', decision: 'Outcomes are events, not status edits', why: 'An outcome triggers practice suggestions and analytics.', value: 'History stays reconstructable.' } },
      { id: 'arena', label: 'Arena sessions', sub: 'realtime audio/text', x: 480, y: 240, kind: 'service', decision: { tag: 'Frontend', decision: 'Sessions stream both ways with resumable state', why: 'A dropped connection must not lose a 45-minute session.', value: 'Practice survives flaky networks.' } },
      { id: 'bus', label: 'Event bus', sub: 'plan · outcome · session', x: 710, y: 120, kind: 'bus', decision: { tag: 'Data', decision: 'Cross-product events on one bus', why: 'Pipeline, Arena and Academy react to each other.', value: 'Loose coupling between three product teams.' } },
      { id: 'grader', label: 'Grader', sub: 'rubric · citations', x: 960, y: 240, kind: 'ai', decision: { tag: 'AI', decision: 'Feedback cites transcript timestamps for every rubric line', why: 'People trust feedback they can replay.', value: 'Scores explain themselves.' } },
      { id: 'read', label: 'Read models', sub: 'dashboard · velocity', x: 960, y: 60, kind: 'store', decision: { tag: 'Data', decision: 'Dashboards read precomputed aggregates', why: 'Hiring velocity and funnels are expensive to compute live.', value: 'Dashboard load 2.8 s → 1.2 s.' } },
      { id: 'notify', label: 'Notifications', sub: 'email · push', x: 1210, y: 120, kind: 'service', decision: { tag: 'Backend', decision: 'Notifications subscribe to events with per-user throttling', why: 'Nudges should help, not nag.', value: 'Feature adoption +30–40%.' } }
    ],
    edges: [e('web', 'edge'), e('edge', 'pipeline'), e('edge', 'arena'), e('web', 'billing', 'checkout'), e('billing', 'bus', 'plan.changed'), e('pipeline', 'bus', 'outcome'), e('arena', 'bus', 'session.ended'), e('bus', 'grader'), e('bus', 'read'), e('bus', 'notify'), e('grader', 'read', 'scores'), e('bus', 'edge', 'entitlements')],
    scenarios: [
      { id: 'upgrade', name: 'Member upgrades plan', steps: [
        { nodes: ['web'], edges: [], narration: 'A member hits the paywall on a Members lesson and chooses Pro.' },
        { nodes: ['billing'], edges: ['web->billing'], narration: 'Checkout completes with card or Pix; the provider calls the webhook (maybe twice).' },
        { nodes: ['bus'], edges: ['billing->bus'], narration: 'An idempotent handler emits plan.changed once.' },
        { nodes: ['edge'], edges: ['bus->edge'], narration: 'The entitlement claim refreshes; every zone now agrees the member is Pro.' },
        { nodes: ['notify', 'read'], edges: ['bus->notify', 'bus->read'], narration: 'A welcome note goes out and the dashboard unlocks loop intelligence.' }
      ] },
      { id: 'scored', name: 'Arena session scored', steps: [
        { nodes: ['arena'], edges: ['edge->arena'], narration: 'A 45-minute system-design session ends; the transcript is sealed.' },
        { nodes: ['bus'], edges: ['arena->bus'], narration: 'session.ended is published with the transcript reference.' },
        { nodes: ['grader'], edges: ['bus->grader'], narration: 'The grader scores each rubric line and cites the timestamps behind it.' },
        { nodes: ['read'], edges: ['grader->read'], narration: 'Feedback lands in the report; the weak estimate at 31:30 is highlighted.' },
        { nodes: ['pipeline', 'notify'], edges: ['bus->notify'], narration: 'The pipeline suggests an estimation drill before the Parallax Pay onsite.' }
      ] }
    ],
    before: { nodes: [{ id: 'b1', label: 'Checkout' }, { id: 'b2', label: 'User DB write' }, { id: 'b3', label: 'Each product re-reads plan' }, { id: 'b4', label: 'Cache purge' }], failure: 'Plans updated in one product took minutes to reach the others, and a retried webhook upgraded people twice.' },
    metrics: [['Dashboard load', '2.8 s → 1.2 s'], ['Feature adoption', '+30–40%'], ['Availability', '99.8%']]
  },
  pulse: {
    project: 'pulse', name: 'Pulse', theme: 'pulse',
    nodes: [
      { id: 'ingest', label: 'Platform ingest', sub: 'short-form · streaming', x: 0, y: 120, kind: 'partner', decision: { tag: 'Backend', decision: 'Ingest adapters normalise every platform into play events', why: 'Seven platforms, one event shape.', value: 'New platforms are an adapter, not a rewrite.' } },
      { id: 'stream', label: 'Event stream', sub: 'plays · posts', x: 250, y: 120, kind: 'bus', decision: { tag: 'Data', decision: 'Partitioned stream keyed by artist', why: 'Per-artist ordering matters for moments; global ordering does not.', value: 'Scales horizontally with artists.' } },
      { id: 'entity', label: 'Entity resolution', sub: 'EN · KR · JP', x: 480, y: 0, kind: 'service', decision: { tag: 'Data', decision: 'Merge identities across scripts and platforms', why: 'AERA, 에아라 and エアラ are one artist.', value: 'Signals stop being split seven ways.' } },
      { id: 'aggregates', label: 'Market read models', sub: 'LA · Seoul · Tokyo', x: 480, y: 120, kind: 'store', decision: { tag: 'Data', decision: 'Per-market aggregates, updated incrementally', why: 'Dashboards must not scan raw plays.', value: 'Analytics queries 5–10× faster.' } },
      { id: 'moment', label: 'Moment detector', sub: 'completion lift', x: 480, y: 240, kind: 'ai', decision: { tag: 'AI', decision: 'Detect moments; people build campaigns', why: 'Pattern spotting is automatable; brand judgment is not.', value: 'Campaigns start minutes after a moment.' } },
      { id: 'scheduler', label: 'Distribution scheduler', sub: 'time-zone lanes', x: 710, y: 240, kind: 'service', decision: { tag: 'Backend', decision: 'Posting windows are planned per market in local time', why: 'The same moment peaks at three different hours.', value: 'Posts land in local evenings.' } },
      { id: 'rag', label: 'RAG index', sub: 'signals · studies', x: 710, y: 60, kind: 'store', decision: { tag: 'Data', decision: 'Index market studies and live signals together', why: 'Answers need both history and today.', value: 'Grounded answers with citations.' } },
      { id: 'router', label: 'Model router', sub: 'base · ft canary', x: 960, y: 60, kind: 'ai', decision: { tag: 'AI', decision: 'Route a canary share to the fine-tuned model', why: 'Offline evals miss real-traffic edge cases.', value: 'Regressions reach few users and roll back fast.' } },
      { id: 'gate', label: 'Eval gate', sub: 'faithfulness · citations', x: 1210, y: 60, kind: 'ai', decision: { tag: 'AI', decision: 'Releases pass an eval gate on grounding', why: 'Cheaper and faster only counts if it stays faithful.', value: 'Grounding regressions block releases automatically.' } },
      { id: 'posting', label: 'Posting adapters', sub: 'fan pages', x: 960, y: 240, kind: 'partner', decision: { tag: 'Backend', decision: 'Posting goes through adapters with retries and receipts', why: 'Platforms rate-limit and fail independently.', value: 'Every post has a receipt or a retry.' } }
    ],
    edges: [e('ingest', 'stream'), e('stream', 'entity'), e('stream', 'aggregates'), e('stream', 'moment'), e('entity', 'aggregates'), e('moment', 'scheduler', 'moment'), e('scheduler', 'posting'), e('aggregates', 'rag'), e('rag', 'router'), e('router', 'gate')],
    scenarios: [
      { id: 'moment', name: 'Moment detected → campaign', steps: [
        { nodes: ['ingest', 'stream'], edges: ['ingest->stream'], narration: 'Seoul plays of AERA\'s chorus clip spike at 22:10 KST.' },
        { nodes: ['entity', 'aggregates'], edges: ['stream->entity', 'entity->aggregates'], narration: 'Seven identities resolve to one artist, so the lift isn\'t split.' },
        { nodes: ['moment'], edges: ['stream->moment'], narration: 'The detector scores the chorus moment at 0.91 and raises a banner.' },
        { nodes: ['scheduler'], edges: ['moment->scheduler'], narration: 'A person drags slots into each market\'s evening; LA gets the English cut.' },
        { nodes: ['posting'], edges: ['scheduler->posting'], narration: 'Adapters post with receipts; the live feed shows each one land.' }
      ] },
      { id: 'release', name: 'Model release through the eval gate', steps: [
        { nodes: ['rag'], edges: ['aggregates->rag'], narration: 'ft-analyst-v2 is trained on 2,400 curated traces.' },
        { nodes: ['router'], edges: ['rag->router'], narration: 'It runs the 40-scenario suite against base-8b.' },
        { nodes: ['gate'], edges: ['router->gate'], narration: 'Faithfulness .94 and citations .98 clear the gate.' },
        { nodes: ['router'], edges: ['rag->router'], narration: '20% canary routing starts; failures go to a review queue.' }
      ] }
    ],
    before: { nodes: [{ id: 'b1', label: 'Nightly batch export' }, { id: 'b2', label: 'Spreadsheet per market' }, { id: 'b3', label: 'Manual posting' }], failure: 'Moments were found the next morning, after the wave had passed, and model changes shipped without a gate.' },
    metrics: [['Analytics queries', '5–10× faster'], ['Batch runtime', '60–90 → 5–15 min'], ['Uptime', '99.5 → 99.9%']]
  }
};
