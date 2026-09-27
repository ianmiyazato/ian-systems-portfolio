# Micro-task changelog

One line per merged micro-task, newest first.

## v0.2

- 2026-09-27 · `feat(counter)`: Returns (queue, receipt scan, condition checklist, refund to original payment with Maré Pay installment reversal, +10% store credit or exchange; refunds emit `returns.refunded` and reverse Circle commissions) and Stock lookup (search/scan, color and size grid projected from stock events with freshness, reserve 2 h, ship home, nearby stores with courier ETA and Pull, fit tip), both live from the world simulation.
- 2026-09-27 · `test(crawler)`: Playwright crawler over every manifest route and every nav item (heading, zero console errors, no error boundary or not-found, nav item current on arrival); `/pulse/distribution` gains its h1.
- 2026-09-27 · `feat(counter)`: Balcão renamed Counter with 308 redirects from `/mare/ops/balcao*`.
- 2026-09-27 · `feat(world)`: `@portfolio/world` deterministic in-browser simulation, domain event contracts, US English catalog, typed remote view router with designed not-found, live hooks.

- 2026-09-27 · `feat(platform)`: `@portfolio/routes` manifest (routes, deep links, remote views, boards, expected headings) read by ⌘K, the lens, e2e, screenshots and a generated parity table; `pnpm verify:route`, `pnpm shots`, `pnpm budget`; Decision Lens tags for Design/UX/Architecture/Engineering/Free-tier; main-only Vercel deploys with `ignoreCommand`; CI without preview deploys, docs-only skip and release-only screenshots; AGENTS.md split into an index plus `docs/agents/*`.

## v0.1

- 2026-09-26 · `chore(repo)`: bootstrap repository, policy, workspace, and deployment fallback.
- 2026-09-26 · `chore(release)`: production deploy of all zones, adapter-vercel override fix for Pulse subpages, deploy script parses JSON CLI output, Lighthouse scripts and measured scores, Maré Ops meta description, v0.1.0 notes.
- 2026-09-26 · `feat(supabase)`: generate `supabase/seed.sql` from the same mocks the UI renders (drift test) and upsert 15 orders into the live project.
- 2026-09-26 · `chore(quality)`: axe (WCAG 2.1 A/AA) over all 45 screens, deep links and 54 variations with zero serious/critical findings after contrast/ARIA fixes; full e2e (186 tests) through the shell domain; CI e2e job on production previews; 107 regenerated screenshots and a generated README gallery with the reviewer tour.
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
- 2026-09-26 · `feat(shell)`: responsive portfolio home, system workspaces, overlays, command palette, decisions, states, and scenario replay.
- 2026-09-26 · `feat(zones)`: add deployable Vite/React, Astro, and SvelteKit child boundaries.
- 2026-09-26 · `test(browser)`: verify 10 key routes, keyboard lens, nested overlays, i18n control, screenshots, and zero serious/critical axe violations.
- 2026-09-26 · `chore(ci)`: publish main/develop and require PR review plus the green `quality` check on main.
- 2026-09-26 · `fix(ci)`: move the optional Vercel-secret guard to preview steps so GitHub can parse the workflow without deployment credentials.
- 2026-09-26 · `feat(supabase)`: provision the free São Paulo project, apply five RLS migrations, and verify a two-tab Broadcast feed.
- 2026-09-26 · `feat(platform)`: JSON token contract with AA contrast test and self-hosted fonts; chrome web components (bar, Decision Lens, ⌘K) with the 40-screen parity registry; overlay stack; AI surface contract; seeded mocks.
