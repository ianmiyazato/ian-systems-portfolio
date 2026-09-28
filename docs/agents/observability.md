# Observability

Tidewatch is a fictitious APM at `/observability`, part of the shell (Next 15) with its own `tidewatch` theme (light, teal accent, Geist + Geist Mono, `series-1..8` for charts). It reads the same `@portfolio/world` as every zone, so an incident, a chaos toggle or a rollback looks the same in Tidewatch, Counter, Pay and Mesh.

## Routes

| Route | Screen | What it proves |
|---|---|---|
| `/observability` | Problems | Open problem banner (P-812), service flow auto-discovered from traces with apdex rings, simulated-AI root cause with **Roll back #812** / **Raise pool to 64**, golden signals (p50/p95/p99 with a deploy marker, throughput and errors), saturation meters, slowest endpoints, top DB statements, recent problems |
| `/observability/traces/9f3a2c` | Trace waterfall | The canonical slow checkout: 10 spans across 7 services, the `db.pool.acquire` span highlighted, span attributes, simulated-AI "why it's slow", correlated logs |
| `/observability/traces/live?id=<trace>` | Any trace | Static page that reads `?id` on the client: the target of every **View trace** link (static export has no dynamic trace ids) |
| `/observability/logs` | Logs | Structured JSON live tail; `service:` `level:` `trace_id:` field filters plus free text; level facets; every line links to its trace; `?q=` pre-fills the query |
| `/observability/slos` | SLOs | Budgets, burn-rate chart, multi-window alerts (fast burn 14.4× over 1 h, slow burn 6× over 6 h) |

Designed states (`?state=`): `loading` (skeleton), `empty` (first-run page with OTLP exporter settings), `error` (ingest delayed banner), `offline` (last snapshot banner), `locked` (read-only seat: remediation buttons disabled).

## Data model (`packages/world/src/telemetry.ts`)

OpenTelemetry-shaped and derived, never stored:

- `Trace { traceId, name, service, at, duration, status, spans }` and `Span { spanId, parentId, name, service, kind, start, duration, status, attributes }`.
- `traceIdOf(eventId)` gives every world event a stable six-hex trace id, so links survive reloads and tabs.
- `checkoutTrace()` builds the checkout request path; with `db-pool` faulted, `db.pool.acquire` waits most of the request. `actionTrace(event)` builds the trace for a recorded action (`action.performed`, `returns.refunded`, `price.changed`).
- `checkoutSeries`, `saturation`, `problems`, `logsFrom` are pure functions of `(world, now)`.

## The default world is mid-incident

`faultsFrom()` starts `db-pool` at 16:02 (deploy #812, `ORDERS_DB_POOL_MAX` 64 → 32) unless the URL pins `?fault=none` or a list. Every zone opens on a story: checkout p95 is degraded, Pay scoring slows, Tidewatch shows P-812. **Roll back #812** closes the fault window at the current sim time, records an `action.performed` event and shows its trace.

## "View trace" contract

Every consequential action calls `recordAction(system, action, summary, actor)` from `@portfolio/remote-runtime`, which records `action.performed` in the world and returns `/observability/traces/live?id=…`; the UI shows it with `<TraceLink>`. Current call sites: Counter (refund, apply cutoff plan), Product Hub (price approval), Pay (dispute submit), Circle (rotate code), Mesh (DLQ replay). Counter's carrier banner and Pay's fraud banner link to Tidewatch problems.

## Chaos panel

The chaos actions live in ⌘K (`packages/chrome/src/actions.ts`, group **Chaos**): break a carrier, saturate the Orders DB pool, lag a Kafka topic, fail e-invoices, spike traffic 3.4×, recover everything, open Tidewatch. They toggle `world.setFault()`, which syncs to every tab over BroadcastChannel, so a fault started in one zone shows up in all of them.

## Tests

- `tests/e2e/tidewatch.spec.ts`: rollback resolves P-812; a palette chaos action opens a problem; the waterfall highlights the slow span; log field filters; the burning SLO pages; View trace from Counter lands on the live trace.
- Crawler, Decision Lens anchors and axe cover all four routes and five states.
