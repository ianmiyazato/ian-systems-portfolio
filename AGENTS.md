# Systems portfolio operating manual

> **Deployment pending:** add `VERCEL_TOKEN` to `.env.agent`, install the Vercel CLI, and run `pnpm deploy:all`.

## 1. Purpose and content rules

This public portfolio demonstrates Ian Miyazato’s product/design execution, frontend craft, and distributed-systems judgment. The decision lens for every change is **design, UI/UX, and architecture**.

- Never use real company names. Use only Maré, Atlas, Pulse, and their fictitious products and partners.
- Data is deterministic synthetic demo data. Maré is pt-BR; Pulse mixes EN/KR/JP.
- AI is simulated in v0.1. Every AI surface must show **Simulated AI**, sources, and an explicit human approval.
- Only state these real metrics verbatim: API latency 450 → ~200 ms; Error rate 1.8% → 0.5–0.7%; Uptime 99.5 → 99.9%; Batch runtime 60–90 → 5–15 min; Deploys 2 → 8–12 per week; Recovery time (MTTR) 2–3 h → 30–45 min; Catalog reads 3–5× faster; Dashboard load 2.8 s → 1.2 s; Feature adoption +30–40%; Analytics queries 5–10× faster; Availability 99.8%.
- Every page footer reads: “All names are fictitious · data is synthetic · AI behavior is simulated in v0.1”.

## 2. Architecture map

```text
ian-systems-portfolio (pnpm + Turborepo)
├── apps/shell       Next.js 15 · port 3000 · default zone
│   ├── /, /work/*, /system-design/*, /atlas/*
│   └── local reviewer fallback for every route when child zones are absent
├── apps/mare-ops    Vite/React boundary · port 3001 · /mare/ops/*
├── apps/mare-shop   Astro boundary · port 3002 · /mare/shop/* + /mare/apps/*
├── apps/pulse       SvelteKit boundary · port 3003 · /pulse/*
├── remotes/*        Balcão, Product Hub, Pay, Circle, Mesh runtime bundles
├── packages
│   ├── tokens       semantic token contract and nine themes
│   ├── ai-sim       deterministic retrieval, streaming, tools, judge, eval
│   ├── events       Zod contracts + BroadcastChannel local transport
│   ├── headless     accessible behavior contracts
│   ├── overlays     URL-addressable modal stack
│   ├── ai-surface   one cross-system trust pattern
│   └── web components / motion / mocks / React adapters
└── microfrontends.json · current Vercel microfrontend routing contract
```

Vercel projects: `ian-portfolio-shell`, `ian-portfolio-mare-ops`, `ian-portfolio-mare-shop`, `ian-portfolio-pulse`. The requested Next rewrites remain in `apps/shell/next.config.ts`; `microfrontends.json` records the current platform-native grouping route. Until those projects exist, the shell renders all routes so the reviewer tour remains coherent.

Maré Ops remotes expose `mount(el, ctx) → unmount`. On Hobby, their independent artifacts are served by the Maré Ops project rather than five additional Vercel projects. This preserves runtime isolation but couples deployment rollback at the hosting-project level.

## 3. Commands

```bash
corepack enable && corepack prepare pnpm@10.17.1 --activate
pnpm install
pnpm dev                         # shell on :3000
pnpm dev:all                     # every implemented workspace dev server
pnpm --filter @portfolio/shell dev
pnpm build
pnpm lint && pnpm typecheck && pnpm test
pnpm e2e
pnpm screenshots
pnpm deploy:all                  # preview without --prod; CI owns production
```

Database mode is optional. When Supabase is present: `supabase db push` and `supabase db reset`. No database command is needed for local mode.

## 4. Environments and secrets

| Variable | Location | Exposure | Purpose |
|---|---|---|---|
| `AI_MODE` | `.env.agent`, Vercel | server-only | `simulated` or guarded `live` adapter |
| `DATA_MODE` | `.env.agent`, Vercel | server-only | `local` or `supabase` |
| `NEXT_PUBLIC_AI_MODE` | Vercel | client-safe | badge/telemetry mode only |
| `NEXT_PUBLIC_DATA_MODE` | Vercel | client-safe | transport selection only |
| `VERCEL_TOKEN` | `.env.agent`, GitHub secret | secret | scripted deploys |
| `SUPABASE_*` | `.env.agent`, GitHub/Vercel | secret except public URL/anon key | optional migrations/data |
| `GROQ_API_KEY`, `GEMINI_API_KEY` | Vercel server env | secret | v0.2 LiveProvider only |

Never commit `.env.agent`; `.gitignore` excludes every `.env*` except `.env.example`.

## 5. Design system

All colors are semantic CSS variables emitted by `@portfolio/tokens`: `ground`, `surface`, `ink`, `muted`, `line`, `accent`, `risk`, `success`, and `ai`. Themes: portfolio, balcao, product-hub, pay, circle, mesh, consumer, atlas, pulse. Do not add component-level color literals. New values belong in the token package.

Motion uses `rise`, `draw`, `scan`, `float`, `breathe`, and route/view-transition-friendly transform/opacity only. Every animation must stop under `prefers-reduced-motion`. Touch targets are at least 44px globally and 56px for Balcão primary tasks.

Inventory: portfolio bar, system tabs, KPI tile, record row, status pill, AI suggestion, trace, source chip, modal, nested sub-modal, drawer/sheet treatment, state banner, command palette, decision hotspot, animated architecture node, chart. AI always uses the theme’s AI color, sparkle, badge, sources, and approval button.

## 6. Decision lens

The lens is framework-agnostic in behavior: press `D` or use **Show decisions**. A screen needs at least four annotations covering Frontend, Backend, Data, and AI. Content is authored in `decisions/<screen>.json` and must include `decision`, `why`, `alternative`, `value`, and `tag`. The shell currently supplies a safe four-item fallback so unfinished routes never lose the lens.

## 7. AI simulation

`packages/ai-sim` exports `AIProvider` with `retrieve`, `rerank`, `generateStream`, `runAgent`, `judge`, and `runEval`. `SimulatedProvider` is deterministic and scenario-driven. `LiveProvider` deliberately throws until it is instantiated inside a server-only route with both live provider keys. Never import provider keys into a client component.

## 8. Workflow

- `main`: production; milestone PRs only.
- `develop`: integration; preview deployment.
- Work: `feat/<area>-<short-desc>`, `fix/...`, `docs/...`, or `chore/...` from `develop`.
- Conventional commits with scope; one concern per commit.
- PR checklist: lint, strict typecheck, unit tests, build, Playwright smoke, axe, screenshots where visual, AGENTS decision/changelog update.

## 9. Milestones

- [x] M1 · repository, operating manual, CI skeleton, local shell
- [x] M2 · token contract, AI simulation, event contracts, decision lens behavior
- [x] M3 · shell home and route-based case study experience
- [ ] M4 · extract Maré Ops host and all five production remote bundles
- [ ] M5 · extract Astro Maré consumer zone and language board
- [ ] M6 · extract Atlas flows from shell route fallback
- [ ] M7 · extract SvelteKit Pulse zone with full i18n
- [x] M8 · interactive system-design scenario player
- [ ] M9 · Supabase data mode and server-only live adapter wiring
- [ ] M10 · exhaustive visual QA, screenshots, Lighthouse, production release

## 10. Decision log

| Date | Decision | Alternatives considered | Why | Value |
|---|---|---|---|---|
| 2026-09-26 | Multi-zones between products | One framework/application | Preserves independent stack and deploy ownership | Architecture mirrors real team boundaries |
| 2026-09-26 | Runtime federation inside Maré Ops | Build-time package imports | Each operations team can ship its own chrome and runtime | Demonstrates version isolation; Hobby trade-off is documented |
| 2026-09-26 | Web Components for cross-stack chrome | Four framework implementations | Stable browser contract crosses Next, Vite, Astro, and Svelte | Consistent navigation without framework coupling |
| 2026-09-26 | Five Maré languages on one token contract | One universal visual theme | Users and work contexts differ while semantics/accessibility repeat | Distinction without component fragmentation |
| 2026-09-26 | One shared AI trust surface | Bespoke agent UI per product | Trust behavior should be learned once | Sources and approval remain recognizable |
| 2026-09-26 | URL-addressable overlay stack | Local component state only | Demos and tests must reproduce nested decisions directly | Shareable, deterministic deep links |
| 2026-09-26 | Astro for the consumer boundary | Next.js everywhere | Content-first pages benefit from HTML-first delivery and islands | Strong SEO/performance story |
| 2026-09-26 | SvelteKit for Pulse | React-only portfolio | Lightweight reactive primitives fit live market signals | Proves architecture skill beyond one ecosystem |
| 2026-09-26 | Shell renders child routes in local mode | Broken routes until every zone exists | Credentials and package tools were absent in preflight | Reviewer tour stays usable while extraction proceeds |
| 2026-09-26 | Add `microfrontends.json` beside rewrites | Rewrites only | Installed Vercel guidance describes platform-native grouping | Clear production evolution without blocking local work |
| 2026-09-26 | Local mode and simulated AI | Wait for missing Supabase/API credentials | The prompt defines both as supported fallbacks | Deterministic, zero-secret demo |

## 11. Micro-task changelog

- 2026-09-26 · `chore(repo)`: bootstrap repository, policy, workspace, and deployment fallback.
- 2026-09-26 · `feat(platform)`: semantic themes, simulated AI provider, event contracts, and unit tests.
- 2026-09-26 · `feat(shell)`: responsive portfolio home, system workspaces, overlays, command palette, decisions, states, and scenario replay.
- 2026-09-26 · `feat(zones)`: add deployable Vite/React, Astro, and SvelteKit child boundaries.
- 2026-09-26 · `test(browser)`: verify 10 key routes, keyboard lens, nested overlays, i18n control, screenshots, and zero serious/critical axe violations.
- 2026-09-26 · `chore(ci)`: publish main/develop and require PR review plus the green `quality` check on main.
- 2026-09-26 · `fix(ci)`: move the optional Vercel-secret guard to preview steps so GitHub can parse the workflow without deployment credentials.

## 12. Known gaps / next steps

- No `.env.agent` was supplied; Vercel/Supabase deployment and GitHub secrets are intentionally untouched.
- Host Node is 24; CI and `.nvmrc` pin the requested Node 22.
- Vercel and Supabase CLIs were not installed at preflight.
- Full runtime-federated Maré remote extraction, approved-artboard parity for every subpage/variation, Supabase migrations, exhaustive per-screen JSON, mobile screenshot expansion, Lighthouse, and production URLs remain before v0.1.0.
- The browser suite passes 13/13 interaction/accessibility checks and screenshot generation passes 10/10. Lighthouse was not run, so no score is claimed.
- Never claim a Lighthouse score or deployed URL until the command has run and the URL has been opened successfully.
