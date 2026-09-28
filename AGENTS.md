# Systems portfolio operating manual

> **Production:** https://ian-portfolio-shell.vercel.app serves every zone under one domain (the shell rewrites to `ian-portfolio-mare-ops`, `ian-portfolio-mare-shop`, `ian-portfolio-pulse`). v0.1.0 verified 2026-09-26; v0.2.0 release candidate is complete on `develop`.
>
> **Free-tier ledger (v0.2):** 0/12 production deploys · 0/0 preview deploys · 24/2,000 Supabase rows · 11/20 MB · 0 new projects, functions, crons or storage. Run `pnpm budget` for live totals.

This file is the index. Detail lives in `docs/agents/`:

| File | What it holds |
|---|---|
| [architecture.md](docs/agents/architecture.md) | Zones, runtime federation, Vercel projects, environments and secrets |
| [design-languages.md](docs/agents/design-languages.md) | Token contract, nine themes, fonts, motion, inventory |
| [overlays.md](docs/agents/overlays.md) | URL-addressable layer stack, Decision Lens contract and tags |
| [simulation.md](docs/agents/simulation.md) | AI simulation (and, from v0.2 M4, the `packages/world` simulation) |
| [observability.md](docs/agents/observability.md) | Tidewatch, traces, chaos (v0.2 M6) |
| [budgets.md](docs/agents/budgets.md) | Free-tier hard limits and the ledger procedure |
| [free-tier-ledger.json](docs/agents/free-tier-ledger.json) | Every deploy and database snapshot (read by `pnpm budget`) |
| [decisions.md](docs/agents/decisions.md) | Decision log (v0.1 and v0.2) |
| [parity.md](docs/agents/parity.md) | Parity table, generated from the routes manifest |
| [changelog.md](docs/agents/changelog.md) | Micro-task changelog |
| [quality.md](docs/agents/quality.md) | Measured Lighthouse, axe and Playwright results |

## 1. Purpose and content rules

This public portfolio demonstrates Ian Miyazato's product/design execution, frontend craft and distributed-systems judgment. Every change is judged through **design, UI/UX and architecture/engineering**.

- **Stay free forever.** [budgets.md](docs/agents/budgets.md) beats every other rule: reuse the four Vercel projects and the one Supabase project, zero preview deploys, at most 12 production deploys in v0.2, static-first, simulation in the browser.
- Never use real company names. Use only Maré, Atlas, Pulse and their fictitious products, partners and vendors (e.g. "Tidewatch" for the APM). Open-source technology keeps its real name (Kafka, Postgres, Redis, OpenTelemetry…); commercial vendors get generic roles.
- Consumer patterns borrow interactions from well-known apps, never their logos, colors, typefaces or signature layouts. The Decision Lens may name the pattern ("row carousels popularized by streaming apps").
- Data is deterministic synthetic demo data. v0.2 moves all copy and mock data to US English (`en-US` formatting; money stays BRL, e.g. `R$1,249.90`); Pulse mixes EN/KR/JP.
- AI is simulated. Every AI surface shows **Simulated AI**, sources and an explicit human approval.
- Only state these real metrics verbatim: API latency 450 → ~200 ms; Error rate 1.8% → 0.5–0.7%; Uptime 99.5 → 99.9%; Batch runtime 60–90 → 5–15 min; Deploys 2 → 8–12 per week; Recovery time (MTTR) 2–3 h → 30–45 min; Catalog reads 3–5× faster; Dashboard load 2.8 s → 1.2 s; Feature adoption +30–40%; Analytics queries 5–10× faster; Availability 99.8%. Anything else unmeasured is a `[value]` placeholder.
- Every page footer reads: "All names are fictitious · data is synthetic · AI behavior is simulated in v0.2".

## 2. Map

```text
ian-systems-portfolio (pnpm + Turborepo)
├── apps/shell       Next.js 15 · :3000 · /, /work/*, /system-design/*, /atlas/* · proxies every other zone
├── apps/mare-ops    Vite/React host · :3001 · /mare/ops/* · runtime federation of five remotes
├── apps/mare-shop   Astro · :3002 · /mare/shop/*, /mare/apps/*
├── apps/pulse       SvelteKit · :3003 · /pulse/*
├── remotes/*        Counter, Product Hub, Pay, Circle, Mesh · independent Preact builds (mount(el, ctx) → unmount)
└── packages
    ├── routes       routes.manifest.ts: every route, deep link, nav view, board and expected heading
    ├── tokens       themes.json → themes.css + TS · nine themes · self-hosted fonts
    ├── chrome       <im-portfolio-bar>, <im-decision-lens>, <im-command-palette>
    ├── overlays     URL-addressable layer stack
    ├── ai-surface   the one AI suggestion CSS contract
    ├── remote-runtime  defineRemote, router, Layer, AiSurface, hooks, realtime feed
    ├── mocks · ai-sim · events
```

Details: [architecture.md](docs/agents/architecture.md).

## 3. Routes manifest (read this before adding a screen)

`packages/routes/src/routes.manifest.ts` is the single source of truth. Each `RouteEntry` has `id`, `system`, `title`, `href`, `zone`, `owner` package, design `board`, expected `heading`, `release`, optional `parity: false`/`mobile`/`checked`. Overlay params are derived from the href. `remoteViews` lists every Maré Ops view per remote; remote navs render only from it and remote routers are typed against it.

Readers: ⌘K palette and Decision Lens (via `@portfolio/chrome`), `tests/e2e/*` (crawler, lens anchors, axe, screenshots), `pnpm verify:route`, `pnpm shots`, and the generated [parity.md](docs/agents/parity.md).

To add a screen: add the route (and view) to the manifest → build it with a `data-anchor` on each decision target → add `decisions/<id>.json` (≥4) → `pnpm verify:route <href>` → `WRITE_PARITY=1 pnpm --filter @portfolio/routes test` → `pnpm shots <id>`.

## 4. Commands

```bash
corepack enable && corepack prepare pnpm@10.17.1 --activate && pnpm install
pnpm dev                          # all four zones; open :3000
pnpm check                        # lint + typecheck + test + build
pnpm verify:route <path> [path…]  # build if needed, open in Chromium, assert heading, 0 console errors, 0 error boundaries
pnpm shots <path|id|system>       # screenshots on demand → docs/screenshots/<system>/
pnpm budget                       # free-tier ledger: deploys used, Supabase rows, static output per app
pnpm js:budget                    # gzip JS gate: shell 130 kB, remote 180 kB, shop 60 kB
pnpm build && pnpm e2e            # crawler, flows, lens anchors, axe against production builds behind :3000
pnpm build && pnpm screenshots    # everything; then node scripts/readme-gallery.mjs
pnpm build && pnpm lighthouse     # Lighthouse (mobile, median of 3) on the local production build
node scripts/browser-probe.mjs    # console errors + failed requests (BASE, PATHS, SHOTS env)
APPS="pulse" pnpm deploy:prod     # production deploy of changed zones only (log it in the ledger)
```

`scripts/lib/servers.mjs` starts or reuses the four production previews (`BASE_URL` targets a deployment instead). Database: `supabase/seed.sql` is generated from `@portfolio/mocks` (`WRITE_SEED=1 pnpm --filter @portfolio/mocks test`); apply only when the schema changes.

## 5. Workflow

- `main`: production, milestone merges only. `develop`: integration. Work branches `feat/<area>-<desc>`, `fix/…`, `docs/…`, `chore/…` from `develop`.
- One micro-task per branch and per commit, conventional commits with scope, pushed after every micro-task.
- PR checklist: `pnpm check`, `pnpm verify:route` for touched routes, `pnpm build && pnpm e2e` when UI changed, screenshots where visual, and updates to [changelog.md](docs/agents/changelog.md), [decisions.md](docs/agents/decisions.md) and the ledger. `gh pr create --base develop --fill`, green CI, `gh pr merge --squash --delete-branch`.
- CI: `quality` (required, includes `pnpm budget`), `e2e` (skipped for docs-only changes), `screenshots` (only on the `develop → main` PR), `production` (main only, changed zones only, needs `VERCEL_TOKEN`). No preview deploys.
- Work autonomously: when something is ambiguous, pick what best serves visual quality, credibility and demo-ability, log it in decisions.md and continue.

## 6. v0.2 milestones

- [x] M1 · agent ergonomics (routes manifest, verify:route/shots/budget, docs split) and free-tier configuration
- [x] M2 · every nav item a real screen (12 broken views), crawler in CI, Balcão → Counter with redirects
- [x] M3 · US English pass and copy lint
- [x] M4 · `packages/world` wired into every system
- [x] M5 · `/system-design/mare/request-path` with scenario replays
- [x] M6 · Tidewatch observability, "View trace" everywhere, chaos panel
- [x] M7 · consumer patterns (shop home, PDP, apps, Academy) + ops-tool patterns
- [x] M7b · ten Atlas and Pulse features with the shared now-playing bar
- [x] M8 · motion system, power-user UX, AI audit
- [x] M9 · contract checker, performance HUD, JS budgets, Lighthouse
- [ ] M10 · Decision Lens and parity completion, README tour, v0.2.0 release

v0.1 milestones M1–M10 are complete (see [changelog.md](docs/agents/changelog.md)).

## 7. Session tool availability

Recorded 2026-09-27 (v0.2 session, Claude Code):

| Tool | Status | Notes |
|---|---|---|
| GitHub CLI | ✅ `ianmiyazato` (`repo`, `workflow`, `read:org`) | PRs, merges, releases |
| Vercel CLI 60.1.3 | ✅ `ianmiyazato`, team `miyazato` (Hobby) | CLI deploys only; projects are not Git-connected |
| Vercel MCP | ✅ OAuth (claude.ai connector) | docs search, project inspection |
| Supabase MCP | ✅ OAuth (claude.ai connector) | `ian-portfolio` = `mtsgotwfnryoljdjsgcd` (sa-east-1, healthy); SQL for ledger snapshots |
| Supabase CLI / env | ⚠️ no `SUPABASE_ACCESS_TOKEN` or `SUPABASE_PROJECT_REF` in the shell env | `pnpm budget` falls back to the last ledger snapshot |
| Chrome DevTools MCP | ❌ "Could not find Google Chrome executable for channel 'stable'" | Playwright Chromium is the visual-check fallback |

## 8. Known gaps / next steps

- **CI deploys need `VERCEL_TOKEN`.** `vercel tokens add` is refused for the CLI's OAuth app and the Vercel GitHub App is not installed. Fix: create a token at https://vercel.com/account/tokens and `gh secret set VERCEL_TOKEN --repo ianmiyazato/ian-systems-portfolio`. Until then production deploys run from an authenticated session with `APPS="…" pnpm deploy:prod`.
- **Chrome DevTools MCP** needs Chrome stable (absent; no sudo). Fix: install Google Chrome, or `claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest --executablePath ~/.cache/ms-playwright/chromium-1187/chrome-linux/chrome`.
- **`@lhci/cli` on WSL** cannot launch Chrome (EACCES on the Windows temp dir); `pnpm lighthouse` uses the Lighthouse Node API over Playwright's Chromium instead. `pnpm lighthouse:ci` works on plain Linux.
- **adapter-vercel + `paths.base`** writes prerender overrides without the base; `apps/pulse/scripts/fix-vercel-overrides.mjs` re-keys them. Remove once fixed upstream.
- **Deployment protection is off** on all four projects so the shell can proxy zones server-side.
- **Remotes on Hobby** share the Maré Ops project, so hosting-level rollback is shared (runtime isolation and independent builds are not).
- **Decision anchors** resolve only in a browser, so their check is Playwright-based; the unit test covers counts, fields, tags and selector shape.
- Host Node is 24; CI, `.nvmrc` and the Vercel projects use Node 22.
- Never claim a Lighthouse score or deployed URL until the command has run and the URL has been opened successfully.
