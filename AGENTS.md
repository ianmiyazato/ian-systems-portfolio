# Systems portfolio operating manual

> **Production:** https://ian-portfolio-shell.vercel.app serves every zone under one domain (shell rewrites to `ian-portfolio-mare-ops`, `ian-portfolio-mare-shop`, `ian-portfolio-pulse`). Deploys run with the Vercel CLI via `pnpm deploy:prod`; CI deploys activate once the `VERCEL_TOKEN` secret exists.

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
├── remotes/*        Balcão, Product Hub, Pay, Circle, Mesh: independent Preact builds with their own
│                    theme + fonts + chrome, each emitting remote-[hash].js, CSS and mf-manifest.json
├── packages
│   ├── tokens       themes.json → generated themes.css + TS; nine themes; self-hosted fonts per theme
│   ├── chrome       <im-portfolio-bar>, <im-decision-lens>, <im-command-palette> + parity route registry
│   ├── overlays     URL-addressable layer stack (Esc closes top-most, focus trap/restore) + overlay CSS
│   ├── ai-surface   the one shared AI suggestion CSS contract (sparkle, badge, sources, approve)
│   ├── remote-runtime  defineRemote(), URL router, overlay Layer, AiSurface, hooks, realtime feed, remote Vite config
│   ├── mocks        seeded deterministic generators (pt-BR Maré, EN/KR/JP Pulse)
│   ├── ai-sim       deterministic retrieval, streaming, tools, judge, eval
│   └── events       Zod contracts + BroadcastChannel local transport
└── microfrontends.json · current Vercel microfrontend routing contract
```

Vercel projects (team `miyazato`, Hobby): `ian-portfolio-shell`, `ian-portfolio-mare-ops`, `ian-portfolio-mare-shop`, `ian-portfolio-pulse`, each with Root Directory `apps/<app>` and an `apps/<app>/vercel.json` that installs and builds from the monorepo root (`pnpm run build --filter=<pkg>...`).

Zone prefixes and outputs:

| Zone | Prefix(es) | Base config | Output |
|---|---|---|---|
| shell (Next 15) | `/`, `/work/*`, `/system-design/*`, `/atlas/*` | — | `.next` |
| mare-ops (Vite) | `/mare/ops/*` | `base: '/mare/ops/'`, `outDir: dist/mare/ops`, SPA rewrite in `vercel.json` | `dist` |
| mare-shop (Astro) | `/mare/shop/*`, `/mare/apps/*`, assets `/mare/_astro/*` | `base: '/mare'`, `outDir: dist/mare` | `dist` |
| pulse (SvelteKit) | `/pulse/*` | `paths.base: '/pulse'`, prerendered | `.vercel/output` |

`apps/shell/next.config.ts` rewrites each prefix in `beforeFiles` to `MARE_OPS_URL`, `MARE_SHOP_URL` and `PULSE_URL`. Production reads the zones' production domains from the Vercel env; previews get the matching preview URLs through `vercel deploy --build-env` from `scripts/deploy-all.sh`; locally they default to ports 3001–3003. `microfrontends.json` records the equivalent platform-native grouping.

Maré Ops runtime federation:

1. The host (`apps/mare-ops`, React) fetches `remotes.config.json`, which maps each remote to a manifest URL with a per-environment base (`development`/`production`: same-origin `/mare/ops/remotes`; `preview`: that deployment's own URL).
2. For the active route it fetches `remotes/<name>/mf-manifest.json`, loads the manifest's CSS, then `import()`s the hashed entry and calls `mount(el, ctx) → unmount`. `ctx` carries `basePath`, `mode` (`page` or `tile`), environment, locale and data-mode config.
3. Each remote renders its own chrome and theme. `/mare/ops` mounts all five in `tile` mode side by side.
4. Every slot sits in a React error boundary with a designed fallback card and a retry; the switcher shows per-remote health from the manifests.

On Hobby the five remotes are built independently and staged into the Maré Ops output (`scripts/stage-remotes.mjs`) as separate static bundles rather than five more Vercel projects. Runtime isolation and independent builds are preserved; the trade-off is that hosting-level rollback is shared by all five.

## 3. Commands

```bash
corepack enable && corepack prepare pnpm@10.17.1 --activate
pnpm install
pnpm dev                         # all four zones; open the shell on :3000 (it proxies the others)
pnpm dev:shell                   # shell only
pnpm --filter @portfolio/shell dev
pnpm build
pnpm lint && pnpm typecheck && pnpm test
pnpm e2e
pnpm screenshots
pnpm deploy:all                  # preview deploy of every zone; shell previews rewrite to zone previews
pnpm deploy:prod                 # production deploy (zones first, shell last)
APPS="pulse shell" pnpm deploy:all   # only some zones
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

`<im-decision-lens>` (packages/chrome) is one web component used by all four stacks: press `D` or use **Show decisions** in `<im-portfolio-bar>`. It resolves the current screen from `packages/chrome/src/routes.ts` (path + `modal`/`drawer`/`sub` params), lazy-loads `decisions/<screen>.json`, and pins numbered hotspots to each decision's `anchor` (a `[data-anchor="…"]` selector). Each file needs at least four decisions mixing Frontend and Backend and spanning three of Frontend/Backend/Data/AI; every entry has `id`, `anchor`, `tag`, `decision`, `why`, `alternative`, `value`. To add one: add a `data-anchor` attribute to the element, then append the entry to that screen's JSON. `?lens=on` opens the lens on load (used by screenshots). `packages/chrome/src/decisions.test.ts` fails the build if any registry screen has fewer than four decisions, a missing field, an anchor that isn't a `[data-anchor]` selector, or an orphan file; `tests/e2e/decision-lens.spec.ts` opens every screen in Chromium and fails if any anchor doesn't resolve in the rendered DOM (anchors can only be resolved in a browser because they span four frameworks).

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
- [x] M3 · shell home, /work case studies and the design-languages board
- [x] M4 · extract Maré Ops host and all five production remote bundles (runtime federation; parity per remote tracked in §14)
- [x] M5 · Astro Maré consumer zone (site + three apps); language board ships with the shell (M6 row)
- [x] M6 · Atlas flows as real shell routes (10 artboards)
- [x] M7 · SvelteKit Pulse zone with EN/KR/JP
- [x] M8 · interactive system-design pages (React Flow, eight scenarios, node decisions, before/after)
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
| 2026-09-26 | Shell renders child routes in local mode (superseded the same day) | Broken routes until every zone exists | Credentials and package tools were absent in preflight | Replaced by real zones behind env-driven rewrites once deploys worked |
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
| 2026-09-26 | Deploy with the Vercel CLI from the monorepo root using `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` | Git-linked projects; `vercel link --repo` | The Vercel GitHub App is not installed (`vercel git connect` fails) and `--repo` needs a Git link; deploying from `apps/<app>` uploads only that folder | Every zone deploys reproducibly from this session and from CI with one script |
| 2026-09-26 | Nest each static zone's build output under its URL prefix | Vercel rewrites that strip the prefix | Static files then resolve at the same path through the shell proxy and on the zone's own domain | No path translation layer; assets and SPA fallback just work |
| 2026-09-26 | Proxy `/pulse` to `/pulse/` | Let the SvelteKit redirect pass through | SvelteKit serves the base root as a directory index; its 308 would bounce against Next's trailing-slash redirect | No redirect loop at the zone root |
| 2026-09-26 | Disable Vercel Authentication on all four projects | Keep SSO protection | The shell proxies server-side to zone domains and previews; protected zones would return 401; the content is public synthetic data | Previews and production compose correctly |
| 2026-09-26 | Build through the root `build` script, not `pnpm turbo` | `pnpm turbo run build` | Turbo 2.8 could not spawn the package manager when not launched from a package script (locally and on Vercel) | Reliable builds everywhere |
| 2026-09-26 | Remotes are Preact apps behind `mount(el, ctx) → unmount`, loaded from `mf-manifest.json` | Module Federation 2 with shared React singletons; React inside every remote | A plain ES-module contract has no shared-singleton coupling, so each remote can upgrade its runtime alone; Preact keeps each remote ≈7 kB gzipped | True runtime isolation with a small per-page cost |
| 2026-09-26 | Remote builds use an app build with a JS entry, not Vite library mode | Vite `build.lib` | Library mode inlines every font file as base64 into the CSS | Fonts stay separate, cacheable and subset-loaded |
| 2026-09-26 | Stage all five remotes inside the Maré Ops project on Hobby | Five additional Vercel projects | Stays within Hobby limits while keeping independent builds and manifests | Shared hosting-level rollback is the documented trade-off |
| 2026-09-26 | Per-remote error boundary with a designed fallback and retry | One page-level error screen | A remote failing is a normal distributed-systems event, so it gets a designed state | Four systems keep working when one is down (covered by Playwright) |
| 2026-09-26 | Realtime in remotes via `@supabase/realtime-js`, lazy-loaded only in Supabase mode, with BroadcastChannel as the local transport | Full `supabase-js` in every remote | The remote needs Broadcast only; the same `openFeed()` API works in both data modes | Two tabs update together in either mode; the local bundle stays small |
| 2026-09-26 | Apply-plan motion uses the View Transitions API with a name per order card | A JS animation library | Cards glide between lanes with transform/opacity only and degrade to an instant update | Motion explains the change without adding a dependency |
| 2026-09-26 | Screenshots, the lens anchor test and ⌘K all iterate the parity registry | Hand-maintained lists | New screens are covered automatically | No screen can silently miss a screenshot or decision check |
| 2026-09-26 | One guardrail function shared by the agent trace, the edit form and the tests | Validate only in the form | The approval path must enforce exactly what the agent claims to have checked | Save stays disabled until the same four rules pass |
| 2026-09-26 | Commission confirms after the 30-day return window, one rule per item by priority | Pay on order and claw back; stack matching rules | Clawbacks create negative balances and distrust; stacked rules are unauditable | Receipts are final and the math is deterministic (unit-tested) |
| 2026-09-26 | Packets move with CSS `offset-path` on the same SVG path strings as the edges | SMIL `animateMotion`; a canvas renderer | Transform-only motion that the reduced-motion rule stops, with zero JS per frame | Topology stays animated at 60 fps without a graph library |
| 2026-09-26 | Astro pages use vanilla island scripts instead of React islands | React islands | Interactions are small (layers, typing, flips); vanilla keeps the consumer pages near-zero JS and reuses the shared overlay stack directly | HTML-first pages with the same URL-addressable layers as every zone |
| 2026-09-26 | Products are drawn as SVG garment silhouettes in their swatch colours | Stock photography | No real-brand imagery, no licensing, tiny payloads, and the product colour is the hero | Editorial look that stays fictitious and fast |
| 2026-09-26 | `SimulatedProvider` takes a domain corpus and grounded canned answers | A separate fake per product | Every AI surface goes through the same `AIProvider` interface the live adapter implements | Swapping to `LiveProvider` is configuration, not a rewrite |
| 2026-09-26 | CJK faces load after first paint, relying on unicode-range subsets | Load Noto KR/JP up front; system fonts only | ~190 kB of @font-face CSS would block the first paint; system CJK fonts are missing on many machines | Fast EN first paint with correct KR/JP glyphs a moment later |
| 2026-09-26 | Cross-zone links are plain anchors; in-zone Next links don't prefetch | Next `<Link>` everywhere | The Next router would try an RSC fetch against another zone, and aborted prefetches show up as failed requests | Clean navigations and zero failed requests in the browser probe |
| 2026-09-26 | Case-study outcomes are labelled "measured on the real systems this fictitious case is modelled on" | Attribute metrics to Maré/Atlas/Pulse | The products are fictitious; the outcomes are real and must not be re-attributed | Credible numbers without pretending |
| 2026-09-26 | React Flow for system design with custom packet edges | Hand-drawn SVG; a static diagram | Nodes, handles and fit-to-view come for free; custom edges keep the packet motion on the same path strings as the rest of the portfolio | Interactive diagrams in ~55 kB for the only route that needs them |
| 2026-09-26 | Atlas plan changes broadcast over BroadcastChannel + storage events | Poll the plan; reload after checkout | "Its confirmation updates the plan in every zone" without a backend round-trip in the demo; mirrors a plan.changed event | Every open tab flips to Pro immediately (Playwright-tested) |
| 2026-09-26 | Public Supabase Broadcast with read-only tables | Anonymous database writes or a permanent cron | The demo driver runs only while a reviewer is watching and broadcasts deterministic payloads without granting write access | Two tabs receive the same live event while RLS keeps synthetic records read-only |

## 11. Micro-task changelog

- 2026-09-26 · `chore(repo)`: bootstrap repository, policy, workspace, and deployment fallback.
- 2026-09-26 · `feat(atlas)`: onboarding with a live plan panel and dual-thumb salary range, pipeline overview, kanban board with drag/drop + application drawer + log-outcome sub-modal, company page with a Pro-locked loop panel, Arena library + setup modal, live session (add a cache node, streamed follow-up), feedback with count-up score and cited rubric, transcript drawer, Academy lesson with paywall + checkout; plan.changed propagates across tabs.
- 2026-09-26 · `feat(system-design)`: React Flow architecture pages for Maré, Atlas and Pulse with custom packet edges, eight narrated scenario replays, clickable node decisions, a synchronous-before toggle and the real before/after metrics.
- 2026-09-26 · `feat(shell)`: replace the catch-all fallback with real routes: home (staggered hero, metrics marquee, animated topology/funnel/equalizer previews, principles, founder table), /work and three case studies with a screenshot gallery, and the five-design-languages board with the AI surface re-skinned in five themes.
- 2026-09-26 · `feat(pulse)`: SvelteKit intelligence (live market clocks, self-drawing comparison chart with moment marker, merged EN/KR/JP leaderboard, Ask Pulse streaming cited answers from the shared `AIProvider`), distribution (moment banner, equalizer asset card, draggable time-zone schedule, fit-weighted reach, Broadcast posting feed) and AI harness (stage-by-stage RAG trace, top-5 chunks, eval gate, running eval, canary split, failures); EN/KR/JP switch with lazy CJK fonts.
- 2026-09-26 · `feat(mare-shop)`: Astro consumer site (editorial hero, AI stylist bubble and semantic results, picked-for-you grid, bag drawer, PDP with store stock, checkout) and three phone-frame apps (shopping, Pay customer, Circle creator) in their own design languages; global `[hidden]` rule.
- 2026-09-26 · `feat(mesh)`: live topology with packets on offset-path edges, partner table, Broadcast log tail and AI triage; partner adapter with circuit state machine, field mapping, payload and request log; DLQ dry-run replay + sandboxed transform drawer; invoice chain with NCM triage; calm, down and replayed variations.
- 2026-09-26 · `feat(circle)`: program dashboard with wiggling sticker, creator cards, campaign week, leak AI card and summary tiles; rule builder with condition chips and a live receipt driven by unit-tested commission math; leak modal + rotate-code sub-modal; no-sales, contract-pending and payout-failed variations.
- 2026-09-26 · `feat(pay)`: applications with floating shining cards, highlighted review band, score histogram and model card; application detail with diverging contribution bars (unit-tested to sum to 588), explanation, timeline and documents; decision modal with policy-max slider + policy override sub-modal; approved, declined-letter and drift variations.
- 2026-09-26 · `feat(product-hub)`: catalog workspace with facets, dense table and bulk agent bar; pricing detail with self-drawing chart, heat grid, offers and rules; agent run + edit proposal with live guardrails (unit-tested); seller onboarding with confidence-gated mapping; variations and decisions.
- 2026-09-26 · `feat(balcao)`: order lanes, picking mode with scan-to-success, handover + third-party sub-modal, cutoff plan sheet + why drawer, seven variations, live orders over Supabase Broadcast with a client-side demo driver, Decision Lens content and registry-driven screenshots.
- 2026-09-26 · `feat(mare-ops)`: runtime federation host, five independently built Preact remotes with manifests, per-remote boundaries and fallback, remote health, and the block-one-remote Playwright suite.
- 2026-09-26 · `feat(deploy)`: zone base paths and nested outputs, env-driven multi-zone rewrites, CLI deploy script, CI preview/production jobs with PR comments; first production deploy of all four zones.
- 2026-09-26 · `feat(platform)`: semantic themes, simulated AI provider, event contracts, and unit tests.
- 2026-09-26 · `feat(atlas)`: onboarding with a live plan panel and dual-thumb salary range, pipeline overview, kanban board with drag/drop + application drawer + log-outcome sub-modal, company page with a Pro-locked loop panel, Arena library + setup modal, live session (add a cache node, streamed follow-up), feedback with count-up score and cited rubric, transcript drawer, Academy lesson with paywall + checkout; plan.changed propagates across tabs.
- 2026-09-26 · `feat(system-design)`: React Flow architecture pages for Maré, Atlas and Pulse with custom packet edges, eight narrated scenario replays, clickable node decisions, a synchronous-before toggle and the real before/after metrics.
- 2026-09-26 · `feat(shell)`: responsive portfolio home, system workspaces, overlays, command palette, decisions, states, and scenario replay.
- 2026-09-26 · `feat(zones)`: add deployable Vite/React, Astro, and SvelteKit child boundaries.
- 2026-09-26 · `test(browser)`: verify 10 key routes, keyboard lens, nested overlays, i18n control, screenshots, and zero serious/critical axe violations.
- 2026-09-26 · `chore(ci)`: publish main/develop and require PR review plus the green `quality` check on main.
- 2026-09-26 · `fix(ci)`: move the optional Vercel-secret guard to preview steps so GitHub can parse the workflow without deployment credentials.
- 2026-09-26 · `feat(supabase)`: provision the free São Paulo project, apply five RLS migrations, and verify a two-tab Broadcast feed.
- 2026-09-26 · `feat(atlas)`: onboarding with a live plan panel and dual-thumb salary range, pipeline overview, kanban board with drag/drop + application drawer + log-outcome sub-modal, company page with a Pro-locked loop panel, Arena library + setup modal, live session (add a cache node, streamed follow-up), feedback with count-up score and cited rubric, transcript drawer, Academy lesson with paywall + checkout; plan.changed propagates across tabs.
- 2026-09-26 · `feat(system-design)`: React Flow architecture pages for Maré, Atlas and Pulse with custom packet edges, eight narrated scenario replays, clickable node decisions, a synchronous-before toggle and the real before/after metrics.
- 2026-09-26 · `feat(shell)`: replace the catch-all fallback with real routes: home (staggered hero, metrics marquee, animated topology/funnel/equalizer previews, principles, founder table), /work and three case studies with a screenshot gallery, and the five-design-languages board with the AI surface re-skinned in five themes.
- 2026-09-26 · `feat(pulse)`: SvelteKit intelligence (live market clocks, self-drawing comparison chart with moment marker, merged EN/KR/JP leaderboard, Ask Pulse streaming cited answers from the shared `AIProvider`), distribution (moment banner, equalizer asset card, draggable time-zone schedule, fit-weighted reach, Broadcast posting feed) and AI harness (stage-by-stage RAG trace, top-5 chunks, eval gate, running eval, canary split, failures); EN/KR/JP switch with lazy CJK fonts.
- 2026-09-26 · `feat(mare-shop)`: Astro consumer site (editorial hero, AI stylist bubble and semantic results, picked-for-you grid, bag drawer, PDP with store stock, checkout) and three phone-frame apps (shopping, Pay customer, Circle creator) in their own design languages; global `[hidden]` rule.
- 2026-09-26 · `feat(mesh)`: live topology with packets on offset-path edges, partner table, Broadcast log tail and AI triage; partner adapter with circuit state machine, field mapping, payload and request log; DLQ dry-run replay + sandboxed transform drawer; invoice chain with NCM triage; calm, down and replayed variations.
- 2026-09-26 · `feat(circle)`: program dashboard with wiggling sticker, creator cards, campaign week, leak AI card and summary tiles; rule builder with condition chips and a live receipt driven by unit-tested commission math; leak modal + rotate-code sub-modal; no-sales, contract-pending and payout-failed variations.
- 2026-09-26 · `feat(pay)`: applications with floating shining cards, highlighted review band, score histogram and model card; application detail with diverging contribution bars (unit-tested to sum to 588), explanation, timeline and documents; decision modal with policy-max slider + policy override sub-modal; approved, declined-letter and drift variations.
- 2026-09-26 · `feat(product-hub)`: catalog workspace with facets, dense table and bulk agent bar; pricing detail with self-drawing chart, heat grid, offers and rules; agent run + edit proposal with live guardrails (unit-tested); seller onboarding with confidence-gated mapping; variations and decisions.
- 2026-09-26 · `feat(balcao)`: order lanes, picking mode with scan-to-success, handover + third-party sub-modal, cutoff plan sheet + why drawer, seven variations, live orders over Supabase Broadcast with a client-side demo driver, Decision Lens content and registry-driven screenshots.
- 2026-09-26 · `feat(mare-ops)`: runtime federation host, five independently built Preact remotes with manifests, per-remote boundaries and fallback, remote health, and the block-one-remote Playwright suite.
- 2026-09-26 · `feat(deploy)`: zone base paths and nested outputs, env-driven multi-zone rewrites, CLI deploy script, CI preview/production jobs with PR comments; first production deploy of all four zones.
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

- **CI deploys need `VERCEL_TOKEN`.** `vercel tokens add` is refused for the CLI's OAuth app and `vercel git connect` fails because the Vercel GitHub App is not installed. Fix either way: create a token at https://vercel.com/account/tokens and run `gh secret set VERCEL_TOKEN --repo ianmiyazato/ian-systems-portfolio`, or install the Vercel GitHub App for this repo and run `vercel git connect` in each `apps/<app>`. Until then, deploy with `pnpm deploy:prod` from an authenticated session.
- **Chrome DevTools MCP** needs Chrome stable. Fix: install Google Chrome, or re-register the server with Playwright's Chromium: `claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest --executablePath ~/.cache/ms-playwright/chromium-1187/chrome-linux/chrome`.
- Host Node is 24; CI and `.nvmrc` pin Node 22, and Vercel projects use 22.x.
- The Supabase project `ian-portfolio` is active in `sa-east-1`; five RLS tables, deterministic seeds, and three public Broadcast feeds are verified.
- Never claim a Lighthouse score or deployed URL until the command has run and the URL has been opened successfully.

## 14. Parity

Source of truth: `packages/chrome/src/routes.ts` (40 approved artboards). "Visual check" means the route was opened at 1440 × 900 in Chromium and compared against the original build prompt's *Pages and screens* and *Flows, overlays and variations* specs. Variations for each area are captured as `<main-screen>--<state>.png` in the same folder.

| # | Route | Built | Visual check passed | Screenshot |
|---|---|---|---|---|
| 1 | `/` | ✅ | ✅ | `docs/screenshots/overview/home.png` |
| 2 | `/work/mare/languages` | ✅ | ✅ | `docs/screenshots/mare/mare-languages.png` |
| 3 | `/system-design/mare` | ✅ | ✅ | `docs/screenshots/mare/system-design-mare.png` |
| 4 | `/mare/ops/balcao` | ✅ | ✅ | `docs/screenshots/balcao/balcao-lanes.png` |
| 5 | `/mare/ops/balcao/pick/MR-904117` | ✅ | ✅ | `docs/screenshots/balcao/balcao-picking.png` |
| 6 | `/mare/ops/balcao?modal=handover&order=MR-904112&sub=third-party` | ✅ | ✅ | `docs/screenshots/balcao/balcao-handover.png` |
| 7 | `/mare/ops/balcao?modal=cutoff-plan&sub=why` | ✅ | ✅ | `docs/screenshots/balcao/balcao-cutoff-plan.png` |
| 8 | `/mare/ops/product-hub` | ✅ | ✅ | `docs/screenshots/product-hub/product-hub-catalog.png` |
| 9 | `/mare/ops/product-hub/products/510233?tab=pricing` | ✅ | ✅ | `docs/screenshots/product-hub/product-hub-detail.png` |
| 10 | `/mare/ops/product-hub/products/510233?modal=agent-run&sub=edit` | ✅ | ✅ | `docs/screenshots/product-hub/product-hub-agent-run.png` |
| 11 | `/mare/ops/product-hub/marketplace/onboarding/linho-co?step=mapping` | ✅ | ✅ | `docs/screenshots/product-hub/product-hub-onboarding.png` |
| 12 | `/mare/ops/pay` | ✅ | ✅ | `docs/screenshots/pay/pay-applications.png` |
| 13 | `/mare/ops/pay/applications/AP-77118` | ✅ | ✅ | `docs/screenshots/pay/pay-application-detail.png` |
| 14 | `/mare/ops/pay/applications/AP-77118?modal=decision&sub=override` | ✅ | ✅ | `docs/screenshots/pay/pay-decision.png` |
| 15 | `/mare/apps/pay` | ✅ | ✅ | `docs/screenshots/pay/pay-customer-app.png` |
| 16 | `/mare/ops/circle` | ✅ | ✅ | `docs/screenshots/circle/circle-program.png` |
| 17 | `/mare/ops/circle/rules/summer-swim` | ✅ | ✅ | `docs/screenshots/circle/circle-rule-builder.png` |
| 18 | `/mare/ops/circle?modal=leak&code=MARI15&sub=rotate` | ✅ | ✅ | `docs/screenshots/circle/circle-leak.png` |
| 19 | `/mare/apps/circle` | ✅ | ✅ | `docs/screenshots/circle/circle-creator-app.png` |
| 20 | `/mare/ops/mesh` | ✅ | ✅ | `docs/screenshots/mesh/mesh-topology.png` |
| 21 | `/mare/ops/mesh/partners/ligeiro-log` | ✅ | ✅ | `docs/screenshots/mesh/mesh-partner.png` |
| 22 | `/mare/ops/mesh/dlq?modal=replay&sub=transform` | ✅ | ✅ | `docs/screenshots/mesh/mesh-dlq-replay.png` |
| 23 | `/mare/ops/mesh/invoices/MR-904117` | ✅ | ✅ | `docs/screenshots/mesh/mesh-invoice-chain.png` |
| 24 | `/mare/apps/shop` | ✅ | ✅ | `docs/screenshots/consumer/consumer-app.png` |
| 25 | `/mare/shop` | ✅ | ✅ | `docs/screenshots/consumer/consumer-site.png` |
| 26 | `/atlas/welcome?step=2` | ✅ | ✅ | `docs/screenshots/atlas/atlas-onboarding.png` |
| 27 | `/atlas/pipeline` | ✅ | ✅ | `docs/screenshots/atlas/atlas-pipeline.png` |
| 28 | `/atlas/pipeline/board?drawer=parallax-pay&sub=log-outcome` | ✅ | ✅ | `docs/screenshots/atlas/atlas-board.png` |
| 29 | `/atlas/companies/parallax-pay` | ✅ | ✅ | `docs/screenshots/atlas/atlas-company.png` |
| 30 | `/atlas/arena?modal=setup&prompt=payments-ledger` | ✅ | ✅ | `docs/screenshots/atlas/atlas-arena-setup.png` |
| 31 | `/atlas/arena/session/14` | ✅ | ✅ | `docs/screenshots/atlas/atlas-arena-session.png` |
| 32 | `/atlas/arena/sessions/14` | ✅ | ✅ | `docs/screenshots/atlas/atlas-feedback.png` |
| 33 | `/atlas/arena/sessions/14?drawer=transcript&t=31:30` | ✅ | ✅ | `docs/screenshots/atlas/atlas-transcript.png` |
| 34 | `/atlas/academy/designing-for-10x` | ✅ | ✅ | `docs/screenshots/atlas/atlas-academy.png` |
| 35 | `/atlas/academy/designing-for-10x?modal=paywall&sub=checkout` | ✅ | ✅ | `docs/screenshots/atlas/atlas-paywall.png` |
| 36 | `/system-design/atlas` | ✅ | ✅ | `docs/screenshots/atlas/system-design-atlas.png` |
| 37 | `/pulse` | ✅ | ✅ | `docs/screenshots/pulse/pulse-intelligence.png` |
| 38 | `/pulse/distribution` | ✅ | ✅ | `docs/screenshots/pulse/pulse-distribution.png` |
| 39 | `/pulse/harness` | ✅ | ✅ | `docs/screenshots/pulse/pulse-harness.png` |
| 40 | `/system-design/pulse` | ✅ | ✅ | `docs/screenshots/pulse/system-design-pulse.png` |

Parity: **40/40**.
