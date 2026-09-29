# System design cases · v0.4 draft

Three companies, six problems. Each company gets one backend problem and one frontend problem, chosen because solving them would move a company-level number: revenue, conversion, retention, cost or the speed of a decision.

| System | Backend problem | Frontend problem |
|---|---|---|
| [Maré](mare.md) · fashion retail, Brazil | **Black Friday without losing a sale.** Protect and maximize revenue per minute during the year's biggest traffic event, at a cost we chose on purpose. | **Live truth on a static storefront.** Keep the current static-first storefront, and make only the fast-changing parts live: price, stock, the bag and backend health. |
| [Atlas](atlas.md) · careers platform, global | **Many countries, one set of insights.** Turn job postings and member interview reports from many countries into trustworthy insights, without moving personal data out of its home region. | **An AI interview that feels like a person.** A 45-minute voice mock interview that stays conversational on any network and never loses the session. |
| [Pulse](pulse.md) · entertainment intelligence, LA · Seoul · Tokyo | **From moment to action.** Detect a breakout moment in a live stream of signals from three markets, and have an agent propose an action with evidence that a person approves. | **A live screen people can check.** Render dense live data from three markets, and tie every AI claim to the exact numbers behind it, so an action can be approved in seconds. |

Then the [cross-system learning map](learning-map.md) shows what the six problems teach together, and how to practice them.

## How each case is written

Every case follows the same structure:

1. **System context**: the company and what it earns money from.
2. **Backend core problem**, its **technical design**, its **trade-offs** and its **business decision**.
3. **Frontend core problem**, its **technical design**, its **trade-offs** and its **business decision**.
4. **Key engineering concepts to learn**.

Each component table answers the same five questions:

1. What problem does it solve?
2. Why was it chosen?
3. What alternative could have been used?
4. What trade-off does it introduce?
5. Which business or product metric does it move?

Each case ends with a **decision chain** table, the unit of study:

> Problem → Architectural decision → Trade-off → Engineering concept → Practical implementation → Business metric affected

## How the problems were chosen

Maré's two problems were given. For Atlas and Pulse, the candidates were scored 1–5 on four axes and the score is the product. **Business impact × architectural depth × learning value × 2026 Q4 relevance.** The scores are judgment calls, not measurements. The reasoning is written next to each one.

### Atlas

| Candidate | Impact | Depth | Learning | Q4 2026 | Score | Verdict |
|---|---:|---:|---:|---:|---:|---|
| **Backend:** regional data planes + a global insight compiler (postings and interview reports from many countries → privacy-safe loop intelligence) | 5 | 5 | 5 | 5 | **625** | **Chosen.** Insights are the moat and the paid-conversion driver. They are also the biggest legal risk and the biggest AI bill. This one problem covers multi-region design, residency, ingestion, batch vs stream, RAG and evaluation. |
| Backend: reliable AI grading (rubric scores people trust, evaluated per model release) | 4 | 4 | 5 | 5 | 400 | Folded into the chosen problem. The insight compiler uses the same "numbers first, AI writes prose, checker reads it" gate. |
| Backend: job search and matching across countries | 4 | 4 | 4 | 3 | 192 | Close to generic search and ranking. Pulse's retrieval covers most of the learning. |
| Backend: syncing the pipeline with email and calendars | 3 | 3 | 3 | 2 | 54 | Integration work with little architectural choice. |
| **Frontend:** real-time voice mock interview (Arena) that survives bad networks | 5 | 5 | 5 | 5 | **625** | **Chosen.** Arena is the paid core and the source of every rubric score. Completion rate drives both conversion and data quality. Real-time voice AI is one of the defining frontend problems of 2026. |
| Frontend: offline-first pipeline board | 3 | 3 | 4 | 3 | 108 | Useful, but conflict resolution is covered by Arena's whiteboard. |
| Frontend: localizing insight pages for many markets | 3 | 2 | 3 | 3 | 54 | Needed, but it's a feature of both chosen problems rather than a problem of its own. |

### Pulse

| Candidate | Impact | Depth | Learning | Q4 2026 | Score | Verdict |
|---|---:|---:|---:|---:|---:|---|
| **Backend:** moment detection → agent-proposed, human-approved action, learning from outcomes | 5 | 5 | 5 | 5 | **625** | **Chosen.** Reacting in minutes instead of days is where campaign money is won or wasted. It covers streaming, event time, entity resolution, anomaly detection, RAG, agents with tools, evaluation and feedback loops. |
| Backend: royalty and payout ledger (Wallet) correctness across currencies | 4 | 4 | 4 | 3 | 192 | High stakes, but the money-correctness lessons (idempotency, ledgers) already live in Maré. |
| Backend: model release gate alone (evals, canaries) | 4 | 4 | 5 | 5 | 400 | Included inside the chosen problem as its safety system rather than as a standalone exercise. |
| **Frontend:** live, evidence-linked workspace (dense time series + AI briefs whose claims link to data) | 5 | 5 | 5 | 5 | **625** | **Chosen.** Adoption of the AI depends on whether a person can check it quickly. It covers streaming UI, rendering at scale, snapshot consistency and human-in-the-loop design. |
| Frontend: cross-time-zone scheduling | 3 | 3 | 3 | 2 | 54 | Mostly a UX problem. |
| Frontend: audio waveform exploration | 3 | 3 | 3 | 3 | 81 | Narrow, and the rendering lessons are covered by the chosen problem. |

### Why these six fit together

- **Maré** teaches *throughput, contention and graceful degradation*: the classic distributed-systems problems, measured in revenue per minute.
- **Atlas** teaches *geography, law and batch AI*: where data may live, what may cross a border, and how to turn large datasets into insights cheaply.
- **Pulse** teaches *real-time AI with a person in the loop*: event-time streams, agents with tools, evaluation, and interfaces that make AI checkable.

Every technology appears at most where it solves a named problem. Some are absent on purpose. Maré has no vector database in its Black Friday path, Atlas has no stream processor, and Pulse has no multi-region write path. Each absence is explained in the case.

## Conventions

- **Names.** Maré, Atlas, Pulse, Parallax Pay and Tidewatch are fictitious. Open-source technology keeps its name: Kafka, Postgres, Redis, OpenSearch, ClickHouse, Flink, Temporal, Iceberg, Trino, Yjs, OpenTelemetry. Commercial services get a role instead of a brand: "managed queue", "payment service provider", "hosted frontier model".
- **Numbers.** Only the portfolio's measured results are stated as facts: API latency 450 → ~200 ms; Error rate 1.8% → 0.5–0.7%; Uptime 99.5 → 99.9%; Recovery time (MTTR) 2–3 h → 30–45 min; Catalog reads 3–5× faster; Dashboard load 2.8 s → 1.2 s; Feature adoption +30–40%; Analytics queries 5–10× faster; Availability 99.8%. Every other outcome is a `[value]` placeholder. Numbers marked *illustrative* are design inputs used to teach the arithmetic, not measurements.
- **AI** is a component with a job, an input, an output and a check, never decoration. In all three systems the numbers come from queries, the model writes only the words, a checker reads the text, and a person approves anything that spends money or reaches a customer.

## From document to site

This document is the content source for the next version of `/system-design`. Each problem maps onto the existing story engine (`@portfolio/story-diagram`). The plain layer carries the business decision, and `E` reveals the technical design. That keeps the v0.3 rule: if a non-technical person understands it, a technical person will too. Building it means new story data in `packages/system-design/data`, six problem routes and a new index in `apps/mare-shop`. It also costs production deploys from the free-tier ledger (mare-shop, and the shell if navigation changes).

---

All names are fictitious · data is synthetic · AI behavior is simulated in v0.2
