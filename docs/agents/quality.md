# Quality results (measured, not estimated)

## v0.1

Lighthouse 12.6.1, default mobile config with simulated throttling, median of 3 runs against production on 2026-09-26 (`pnpm lighthouse`):

| Page | Performance | Accessibility | Best practices | SEO | LCP |
|---|---|---|---|---|---|
| `/` | 98 | 100 | 100 | 100 | 2.1 s |
| `/work/mare` | 100 | 100 | 100 | 100 | 1.6 s |
| `/mare/shop` | 99 | 100 | 100 | 100 | 1.4 s |
| `/mare/ops/balcao` | 95 | 100 | 100 | 90 → meta description added after this run | 2.5 s |
| `/pulse` | 100 | 100 | 100 | 100 | 1.4 s |

- **axe** (`tests/e2e/a11y.spec.ts`, WCAG 2.1 A/AA): 99 targets (45 screens incl. every deep link + 54 variations), zero serious or critical violations, locally and against production.
- **Playwright**: 186 tests (flows, federation with each remote blocked, Decision Lens anchors on all 45 screens, system-design replays, Pulse i18n, Supabase two-tab live orders, axe). Local run 186/186; production run 185/186 on the first attempt with the one failure passing on rerun (a toast mid-animation during the live demo driver), 99/99 axe on the rerun.
- **Unit**: token contrast (19), registry (45), decision coverage (48), overlays, pricing guardrails, commission math, score contributions, ai-sim, events, mocks/seed drift.
- **Supabase**: production Balcão in two tabs both reported "Live · Supabase Broadcast" and tab B received the order emitted from tab A.
