# Quality results (measured, not estimated)

## v0.2

- **JavaScript budgets** (`pnpm js:budget`, local production builds, 2026-09-28): 40/40 checks pass. Largest budgeted shell route: `/observability` at 129.1/130 kB gzip; largest Astro page: `/mare/shop/products/linen-midi-dress` at 13.4/60 kB; largest ops remote: Pay at 42.0/180 kB. The three React Flow architecture routes are documented exceptions at 169.7 kB. Full results: [js-budgets.json](js-budgets.json).
- **Lighthouse 12.6.1** (`pnpm lighthouse`, local production builds, default mobile simulated throttling, median of 3, 2026-09-28):

| Page | Performance | Accessibility | Best practices | SEO | LCP |
|---|---:|---:|---:|---:|---:|
| `/` | 95 | 100 | 100 | 100 | 2.6 s |
| `/mare/shop` | 99 | 100 | 100 | 100 | 1.7 s |
| `/mare/ops/counter` | 100 | 100 | 100 | 100 | 1.5 s |
| `/observability` | 90 | 100 | 100 | 100 | 2.4 s |
| `/pulse` | 97 | 100 | 100 | 100 | 2.3 s |

- **Playwright:** 585/585 against local production builds in 8.8 minutes: every manifest route and nav item, 77/77 Decision Lens anchors, 77-route reduced-motion coverage, feature flows, runtime-federation fallbacks and 40 JS budget assertions.
- **axe** (WCAG 2.1 A/AA): 166/166 route and variation targets, zero serious or critical violations.
- **Focused regressions:** performance HUD/shortcuts 7/7; AI audit 5/5; Atlas 16/16.
- **Production** (2026-09-28, after the v0.2.0 deploy of all four zones): the full Playwright suite passes against https://ian-portfolio-shell.vercel.app, 585/585 in 8.0 minutes (every manifest route and nav item, Decision Lens anchors, axe, reduced motion, feature flows, federation fallbacks, JS budgets), and the manifest verifier resolves all 12 legacy `?view=` links (12/12) with the expected headings and zero console errors.

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
