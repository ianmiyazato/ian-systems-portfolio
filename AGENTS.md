# Systems portfolio operating manual

> **Deployment pending:** four Vercel projects and their environment contracts exist; source deployment still needs either the Vercel GitHub App or an authenticated CLI/token.

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
│   ├── tokens       themes.json → generated themes.css + TS; nine themes; self-hosted fonts per theme
│   ├── chrome       <im-portfolio-bar>, <im-decision-lens>, <im-command-palette> + parity route registry
│   ├── overlays     URL-addressable layer stack (Esc closes top-most, focus trap/restore) + overlay CSS
│   ├── ai-surface   the one shared AI suggestion CSS contract (sparkle, badge, sources, approve)
│   ├── mocks        seeded deterministic generators (pt-BR Maré, EN/KR/JP Pulse)
│   ├── ai-sim       deterministic retrieval, streaming, tools, judge, eval
│   └── events       Zod contracts + BroadcastChannel local transport
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

All colors are semantic CSS variables emitted by `@portfolio/tokens` from `packages/tokens/src/themes.json` (run `node packages/tokens/scripts/emit-css.mjs` after editing; a unit test fails if `themes.css` drifts). Contract: `ground`, `surface`, `surface-2`, `ink`, `muted`, `line`, `accent`, `accent-ink`, `accent-text`, `accent-2`, `risk`, `warn`, `success`, `info`, `ai`, `ai-ink`, derived `*-soft`, `shade`, `scrim`, `elevation`; plus `font-display/ui/mono`, `radius`, `radius-sm`, `display-weight/tracking/stretch`, `overlay-in`, `drawer-in`, `ease`, `duration`. Themes: portfolio, balcao, product-hub, pay, circle, mesh, consumer, atlas, pulse. A contrast test enforces WCAG AA for every text pair in every theme. Do not add component-level color literals. New values belong in the token package.

Fonts are self-hosted through Fontsource and imported per theme with `import '@portfolio/tokens/fonts/<theme>'`; Pulse CJK faces load lazily via `fonts/pulse-cjk`.

Motion uses `rise`, `draw`, `scan`, `float`, `breathe`, and route/view-transition-friendly transform/opacity only. Every animation must stop under `prefers-reduced-motion`. Touch targets are at least 44px globally and 56px for Balcão primary tasks.

Inventory: portfolio bar, system tabs, KPI tile, record row, status pill, AI suggestion, trace, source chip, modal, nested sub-modal, drawer/sheet treatment, state banner, command palette, decision hotspot, animated architecture node, chart. AI always uses the theme’s AI color, sparkle, badge, sources, and approval button.

## 6. Decision lens

`<im-decision-lens>` (packages/chrome) is one web component used by all four stacks: press `D` or use **Show decisions** in `<im-portfolio-bar>`. It resolves the current screen from `packages/chrome/src/routes.ts` (path + `modal`/`drawer`/`sub` params), lazy-loads `decisions/<screen>.json`, and pins numbered hotspots to each decision's `anchor` (a `[data-anchor="…"]` selector). Each file needs at least four decisions mixing Frontend and Backend and spanning three of Frontend/Backend/Data/AI; every entry has `id`, `anchor`, `tag`, `decision`, `why`, `alternative`, `value`. To add one: add a `data-anchor` attribute to the element, then append the entry to that screen's JSON. `?lens=on` opens the lens on load (used by screenshots).

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
- [x] M9 · Supabase data mode and server-only live adapter wiring
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
| 2026-09-26 | Solo-maintainer branch protection | Require an independent approval | One maintainer cannot approve their own PR, while PRs and green CI still provide the intended gate | PRs and `quality` stay required; add reviewer approval when a second maintainer joins |
| 2026-09-26 | Token contract as JSON → generated CSS + TS, with a contrast test | Hand-written CSS per theme; Style Dictionary | One source feeds CSS, TypeScript and tests without another build dependency; drift fails CI | Nine themes stay AA-compliant by construction |
| 2026-09-26 | Self-host every typeface with Fontsource, imported per theme | Google Fonts `<link>` per zone | No third-party render-blocking request; each zone ships only its families; CJK loads on demand | Better Lighthouse performance and privacy |
| 2026-09-26 | Web Components with shadow DOM for bar, lens and palette | Lit; one implementation per framework | Zero-dependency custom elements run unchanged in Next, Vite, Astro and SvelteKit; lens/palette take the portfolio identity from tokens so reviewers recognise them in every theme | One behaviour, four stacks |
| 2026-09-26 | One parity registry (`packages/chrome/src/routes.ts`) drives ⌘K, lens resolution, tests and screenshots | Separate lists per consumer | 40 artboards must stay in sync across four stacks | Adding a screen updates every consumer at once |
| 2026-09-26 | Overlays as URL state + a shared layer stack + CSS contract | A React-only headless dialog package | Remotes (Preact), shell (React), Astro and Svelte need the same Esc/focus/deep-link behaviour | `?modal=…&sub=…` reproduces nested states in any zone |
| 2026-09-26 | AI surface as one CSS contract with a CSS-mask sparkle | A component per framework | Markup is trivially portable; trust visuals (colour, badge, sources, approve) cannot drift | Recognisable AI pattern in all nine themes |
| 2026-09-26 | Visual checks use Playwright Chromium when Chrome DevTools MCP cannot launch | Block on installing Chrome | The sandbox has no sudo to install Chrome stable | Screens are still verified at 1440 × 900 with screenshots |
| 2026-09-26 | Public Supabase Broadcast with read-only tables | Anonymous database writes or a permanent cron | The demo driver runs only while a reviewer is watching and broadcasts deterministic payloads without granting write access | Two tabs receive the same live event while RLS keeps synthetic records read-only |

## 11. Micro-task changelog

- 2026-09-26 · `chore(repo)`: bootstrap repository, policy, workspace, and deployment fallback.
- 2026-09-26 · `feat(platform)`: semantic themes, simulated AI provider, event contracts, and unit tests.
- 2026-09-26 · `feat(shell)`: responsive portfolio home, system workspaces, overlays, command palette, decisions, states, and scenario replay.
- 2026-09-26 · `feat(zones)`: add deployable Vite/React, Astro, and SvelteKit child boundaries.
- 2026-09-26 · `test(browser)`: verify 10 key routes, keyboard lens, nested overlays, i18n control, screenshots, and zero serious/critical axe violations.
- 2026-09-26 · `chore(ci)`: publish main/develop and require PR review plus the green `quality` check on main.
- 2026-09-26 · `fix(ci)`: move the optional Vercel-secret guard to preview steps so GitHub can parse the workflow without deployment credentials.
- 2026-09-26 · `feat(supabase)`: provision the free São Paulo project, apply five RLS migrations, and verify a two-tab Broadcast feed.
- 2026-09-26 · `feat(platform)`: JSON token contract with AA contrast test and self-hosted fonts; chrome web components (bar, Decision Lens, ⌘K) with the 40-screen parity registry; overlay stack; AI surface contract; seeded mocks.

## 12. Session tool availability

Recorded 2026-09-26 (session 2, Claude Code):

| Tool | Status | Notes |
|---|---|---|
| GitHub CLI | ✅ `ianmiyazato`, scopes `repo`, `workflow`, `read:org` | PRs, merges, protection, releases |
| Vercel CLI 60.1.3 | ✅ logged in as `ianmiyazato`, team `miyazato` (Hobby) | used for linking and deploys |
| Vercel MCP | ✅ OAuth | project/env inspection and settings |
| Supabase CLI | ✅ with `SUPABASE_ACCESS_TOKEN`; needs `HOME` pointed at a writable dir because `~/.supabase` is read-only in the sandbox | `supabase projects list` shows `ian-portfolio` (sa-east-1, healthy) |
| Supabase MCP | ✅ OAuth | migrations, SQL, keys, advisors |
| `codex mcp list` | chrome-devtools, playwright, supabase, vercel configured for Codex | informational |
| Chrome DevTools MCP | ❌ cannot start: Chrome stable missing at `/opt/google/chrome/chrome`, and the sandbox has no sudo | Playwright Chromium (`~/.cache/ms-playwright`) is the visual-check fallback |

## 13. Known gaps / next steps

- No `.env.agent` or `VERCEL_TOKEN` was supplied; Vercel environment variables were configured through MCP and no secret was committed.
- Host Node is 24; CI and `.nvmrc` pin the requested Node 22.
- Vercel and Supabase CLIs were not installed at preflight. The exact Vercel unblock is: install the Vercel GitHub App for `ianmiyazato/ian-systems-portfolio`, or run `npm i -g vercel && vercel login` and supply `VERCEL_TOKEN` for CI.
- Full runtime-federated Maré remote extraction, approved-artboard parity for every subpage/variation, exhaustive per-screen JSON, mobile screenshot expansion, Lighthouse, and production URLs remain before v0.1.0.
- The Supabase project `ian-portfolio` is active in `sa-east-1`; five RLS tables, deterministic seeds, and three public Broadcast feeds are verified. No database blocker remains.
- The browser suite passes 13/13 interaction/accessibility checks and screenshot generation passes 10/10. Lighthouse was not run, so no score is claimed.
- Never claim a Lighthouse score or deployed URL until the command has run and the URL has been opened successfully.
