# Cross-system learning map

← [All cases](README.md) · [Maré](mare.md) · [Atlas](atlas.md) · [Pulse](pulse.md)

The three cases were chosen so that, together, they cover the architecture ideas that matter most in 2026 without repeating each other. The aim is to learn the *mechanism* behind each technology: once you know why a system needs a durable log, it matters less whether the log is Kafka or something else.

## The map

Each cell names where a concept is taught best (**★**) or reinforced (·), and the concrete place to study it.

### Distributed systems

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| Idempotency and at-least-once delivery | ★ checkout keys, e-invoice batch, reservation per click | · resumable Arena uploads | · idempotent `execute` per approved action |
| Consistency models (CAP, PACELC) | · Redis fast path vs Postgres ledger | ★ strong for money, eventual for insights, per data class | · provisional vs reconciled numbers |
| Contention and hot keys | ★ doorbuster sharded counters | — | — |
| Durable execution and sagas | · outbox + asynchronous steps after checkout | — | ★ Temporal workflow per moment |
| Clocks and ordering | · shared world clock for cutoffs | ★ session clock across audio, transcript and board | ★ event time vs processing time |

### Scalability

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| Capacity planning (Little's law) | ★ Black Friday arithmetic | · regional sizing per market | · quota budgets per source |
| Horizontal scaling and autoscaling | ★ pre-scaled pools + lag-based consumers | · a new region from the cell template | · Flink parallelism by partition |
| Caching hierarchies | ★ CDN → edge micro-cache → coalescing | · insight replicas per region | · multi-resolution rollups as a cache |
| Partitioning and sharding | · orders partitioning, counter shards | ★ geo-partitioning by home region | · Kafka partitions by account |

### Reliability

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| Failure isolation (bulkheads, cells) | ★ per-tier pools | ★ regional cells | · connector isolation |
| Admission control and load shedding | ★ waiting room, degradation ladder | — | · cost budget per brief → numbers-only template |
| Graceful degradation | ★ L0–L4 ladder with build-time fallbacks | ★ voice → WebSocket → text | · numbers-only brief when a model fails |
| Redundancy and failover | ★ two payment acquirers | · insight plane down → last published | · read edges per market |
| Rehearsal (load tests, game days, chaos) | ★ game day with the portfolio's chaos actions | · region evacuation drill | · connector-failure drill |

### Data architecture

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| OLTP vs OLAP | · Postgres orders vs ClickHouse war room | · Postgres vs lakehouse | ★ ClickHouse rollups over a stream |
| Lakehouse and replay | — | ★ Iceberg + Trino, reproducible snapshots | · raw landing for replay |
| Entity resolution and canonical models | — | ★ companies, titles, levels, pay | ★ artists across scripts |
| Data quality and contracts | · price book versions | ★ freshness SLOs, volume contracts per connector | ★ the data-quality guard before detection |
| Privacy engineering | · fraud data, payment tokens | ★ residency, k-thresholds, deletion through aggregates | — |

### Event-driven architecture

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| Transactional outbox | ★ `order.v4` | — | — |
| Event streams and consumers | ★ priority topics, lag-based scaling | · outcome → plan in region | ★ `signals.raw` → Flink → moments |
| Backpressure and dead-letter queues | ★ backlog instead of timeouts, DLQ replay | — | · malformed signals to DLQ |
| Batch vs stream economics | · asynchronous after checkout | ★ why insights stay batch | ★ why moments need streaming |

### Frontend architecture

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| Rendering strategy (static, islands, live slots) | ★ static shell + live slots | · heavy parts load on Start | · Canvas/WebGL + SVG/DOM layers |
| Optimistic UI and reconciliation | ★ confidence-based add to bag | · CRDT local-first edits | · undo window on approvals |
| Real-time transport | · batched HTTP vs sockets | ★ WebRTC, data channels, fallback ladder | ★ SSE deltas with sequence numbers |
| Client state and durability | · bag mirror in localStorage | ★ IndexedDB session log + resume | ★ watermark-keyed store, ring buffers |
| Main-thread budget | · no third-party tags on checkout | ★ AudioWorklet off-thread | ★ worker decoding, OffscreenCanvas |
| Accessibility and localization | · keyboard-complete overlays | · per-language speech models | ★ data tables for charts, three scripts |

### AI systems, RAG and LLM orchestration

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| Choosing where *not* to use an LLM | ★ never in the checkout path | · statistics before models | ★ statistics before models |
| Grounded generation (numbers first) | · assistant proposals | ★ insight compiler with checker | ★ validator on every figure |
| RAG: retrieval design | — | · Academy + postings context | ★ hybrid BM25 + vectors, reranker, KR/JP |
| Vector storage choice | — | ★ pgvector inside Postgres (fewer systems) | ★ OpenSearch hybrid (exact names matter) |
| Model routing and cost budgets | — | ★ small models in region, frontier on aggregates | ★ cost budget per moment |
| Agents and tools | · ops assistant proposes ladder steps | — | ★ typed tools, gated writes, policy guard |
| Evaluation and releases | — | ★ eval set + calibrated judge + editor queue | ★ offline gate + canary + traces |
| Human in the loop and feedback | · approval for ladder steps beyond L1 | · member flags → editor queue | ★ reason codes, holdouts, uplift |
| Real-time AI interaction | — | ★ cascaded voice pipeline, barge-in | ★ streamed structured briefs |

### Performance

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| Field measurement joined to business | ★ RUM joined to conversion | ★ turn latency joined to completion | ★ decision telemetry |
| Latency budgets per stage | ★ four synchronous checkout steps | ★ VAD → STT → model → TTS | · SSE → worker → frame |
| Payload budgets | ★ JS budget, tag budget | · lazy media stack | ★ pixel-budget resolution |

### Observability

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| SLOs and burn-rate alerts | ★ revenue per minute, 14.4× fast burn | · freshness SLOs | · watermark lag SLO |
| Distributed tracing across the client boundary | ★ `traceparent` from shop to Tidewatch | ★ one slow turn as a trace | ★ spans per agent step with tokens and cost |
| Business events as telemetry | ★ funnel per degradation level | ★ session funnel | ★ time-to-decision |

### Infrastructure and security

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| Edge, CDN and bot defense | ★ price book flip, bot limits without per-IP rules | · edge routing by region | — |
| Multi-region (and when not to) | ★ deliberately one region + static failover | ★ regional cells by law | ★ one processing region + read edges |
| Least privilege | · feature flags as kill switches | · per-region keys, residency audit in CI | ★ read tools free, write tools gated |
| CI/CD for risky changes | ★ change freeze, flags tested in both states | · CI policy test on cross-region calls | ★ canary for models and prompts |

### Business and technical trade-offs

| Concept | Maré | Atlas | Pulse |
|---|---|---|---|
| Cost vs reliability | ★ expected-loss model | · N regions vs addressable markets | · cost budget per brief |
| Speed vs safety | · automatic L1, human beyond | · k-threshold vs coverage | ★ approval + undo instead of autonomy |
| Precision vs honesty | ★ stock bands | ★ merged-upward insights | ★ provisional vs reconciled |
| Build vs buy | · two acquirers, not an in-house processor | · cascaded pipeline from bought stages | · durable workflow engine instead of hand-rolled state |

## How the three cases fit together

```text
Maré   — throughput and contention: how a system survives its busiest minute   (revenue per minute)
Atlas  — geography, law and batch AI: where data may live, what may leave       (markets, trust, conversion)
Pulse  — real-time AI with a person: detect, propose, check, approve, learn     (time-to-action, ROI)
```

The same ideas repeat from different angles. Seeing the repetition is what builds judgment:

- **"Numbers from queries, words from the model, a checker in between"** appears in all three. It is the most reusable AI architecture pattern in this document.
- **Graceful degradation** is a ladder in Maré, a fallback transport in Atlas and a numbers-only brief in Pulse. The mechanism is always the same: decide in advance what to give up, and build the degraded state as a real screen.
- **Two truths, labeled** (fast vs authoritative) appear as stock bands vs reservations, insights vs member data, and provisional vs reconciled numbers.
- **Multi-region** gets three different answers: no (Maré), yes by law (Atlas) and read-only edges (Pulse). The right answer depends on the problem, not on the technology.

## Studying with AI: stochastic drills

Memorizing the six designs is the wrong goal. The goal is to rebuild a design correctly when one assumption changes. An AI assistant is the ideal sparring partner for this, because it can vary the problem endlessly and grade reasoning against a rubric.

### The drill

1. **Sample** one decision chain at random from any case (each case has 9–10). Studying in random order matters: it forces retrieval instead of recognition.
2. **Perturb** one assumption from the deck below, also at random.
3. **Redesign out loud** in five minutes: what changes, what stays, and which trade-off flips.
4. **Ask the AI to grade** against the chain's six columns: *problem → decision → trade-off → concept → implementation → metric*. It should mark any column you skipped or got wrong, and ask one follow-up question an interviewer would ask.
5. **Log** the chain id, the perturbation, your score (0–6) and what you missed. Chains you miss come back sooner (spaced repetition); chains you nail come back later.

### Perturbation deck

| # | Perturbation | Hardest hit | What it tests |
|---|---|---|---|
| 1 | Peak traffic is 10× the forecast | Maré | Admission control vs capacity; which ladder level holds |
| 2 | One payment acquirer is down for the first hour | Maré | Failover, approval-rate routing, fraud caps |
| 3 | Marketing moves the push notification to exactly 00:00 for everyone | Maré | Self-inflicted thundering herd; negotiating with the business |
| 4 | Redis loses its primary during the peak | Maré | Reservations vs ledger truth; reconciliation |
| 5 | A new country requires all data, even aggregates, to stay local | Atlas | Cell design; what global features still work |
| 6 | The frontier model's price doubles | Atlas, Pulse | Model routing, batching, incremental compute |
| 7 | A member asks to delete every report they ever wrote | Atlas | Deletion through aggregates, lineage, tombstones |
| 8 | Members in one region are mostly on mobile data with 5% packet loss | Atlas | Fallback ladder, VAD, resumable sessions |
| 9 | A platform starts sending data 6 hours late | Pulse | Watermarks, provisional labels, detection delay |
| 10 | The agent approved a wrong action that spent budget | Pulse | Policy guard, two-person rule, undo, evaluation gaps |
| 11 | A connector breaks silently on a Friday night | Pulse | Data-quality guard; paging vs moments |
| 12 | The team is three engineers, not thirty | all | What to cut first; build vs buy; which risks to accept |
| 13 | Latency to the user doubles (users move to another continent) | all | Edges, regions, caching, what must be local |
| 14 | Leadership asks for the design at half the cost | all | Expected-loss arithmetic; which metric the cut damages |

### A prompt to use with any AI assistant

```text
You are a principal engineer running a system design drill.
Case: <paste one decision chain row and its system context>.
Perturbation: <paste one row from the deck>.
Ask me to redesign. Then grade my answer 0–6, one point per column:
problem, decision, trade-off, engineering concept, implementation, business metric.
Name the single most important thing I missed, and ask one follow-up question.
Do not reveal the model answer until I have answered the follow-up.
```

### What "learned" looks like

You can take any row of the map, name the failure that makes the concept necessary, draw the smallest design that fixes it, say what it costs, and name the metric that tells you it worked. That is the same five-question test every component in these cases had to pass.

---

All names are fictitious · data is synthetic · AI behavior is simulated in v0.2
