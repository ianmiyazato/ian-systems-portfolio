# Free-tier budgets

**Stay free forever.** The owner runs other projects on the same Vercel Hobby and Supabase Free accounts, so these limits beat every other rule. If a task would break one, choose a cheaper design (static rendering, simulation in the browser) and log why in [decisions.md](decisions.md).

`pnpm budget` prints the ledger ([free-tier-ledger.json](free-tier-ledger.json)): deploys used, Supabase rows and size, created resources, and static output per app. It exits non-zero when anything is over, and CI runs it after `pnpm build`.

## Vercel (Hobby)

- Reuse the four existing projects. Never create projects, domains, storage (KV, Blob, Postgres, Edge Config), cron jobs, Analytics or Speed Insights.
- **At most 12 production deploys for all of v0.2, counted per project deployment** (a four-zone release is four), and **zero preview deploys**. Deploy at milestone boundaries only, changed zones only (`scripts/changed-apps.sh HEAD^` never adds the shell for a zone-only change, because the production shell already rewrites to production zones).
- Every `apps/<app>/vercel.json` sets `git.deploymentEnabled` (only `main` may deploy) and an `ignoreCommand` that skips the build when neither the app nor shared code changed. The projects are not Git-connected today (CLI deploys), so these are the guard for the day the GitHub App is installed.
- Static-first: pre-render everything that can be; no new serverless or edge functions, no ISR, no Vercel image optimization (ship pre-sized SVG/AVIF/WebP, `unoptimized`). Keep each app's static output under 25 MB.
- JavaScript budgets are measured from the production previews as gzip-9 of every script a route loads before network idle: shell ≤130 kB, each ops remote's own bundle ≤180 kB, Astro shop pages ≤60 kB, which includes every `/system-design/*` story page (v0.3 removed React Flow and with it the last exceptions); measured results live in [js-budgets.json](js-budgets.json). Run `pnpm js:budget`; the same test is part of `pnpm e2e` in CI.
- Verify locally: `pnpm build`, `pnpm verify:route <path>`, `pnpm e2e`, `pnpm js:budget`, `pnpm shots`, `pnpm lighthouse`. Lighthouse and screenshots run against local production builds, never against Vercel previews.

## Supabase (Free)

- Reuse project `ian-portfolio` (`mtsgotwfnryoljdjsgcd`, sa-east-1). Never create a project; if credentials are missing, run with `DATA_MODE=local`.
- At most **2,000 rows** across all tables, database under **20 MB**, **no Storage buckets, no Edge Functions, no pg_cron**, no `postgres_changes` on large tables.
- Realtime is Broadcast only: open a channel only while a live screen is visible, close it when the tab is hidden, at most 2 channels per browser, at most 1 message per second per client.
- Production data mode defaults to `local` (the in-browser world simulation). Supabase powers only persisted demo state (with a client-triggered TTL cleanup) and the explicit "Live across tabs" toggle.
- Seeding is idempotent (upserts with fixed ids) and runs only when the schema changes.

## GitHub Actions

Public repo, so minutes are free, but CI stays lean: pnpm is cached, docs-only changes skip the browser jobs, and the full screenshot suite runs only on the `develop → main` PR.

## Ledger procedure

After every production deploy append `{ "date", "kind": "production", "apps": [...], "reason" }` to `vercel.deploys`; after every database change append a snapshot (row counts from `pg_stat_user_tables`, size from `pg_database_size`). Then run `pnpm budget` and paste the totals into the AGENTS.md summary line.
