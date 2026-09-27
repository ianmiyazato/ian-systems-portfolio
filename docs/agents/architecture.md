# Architecture

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

## Environments and secrets

| Variable | Location | Exposure | Purpose |
|---|---|---|---|
| `AI_MODE` | `.env.agent`, Vercel | server-only | `simulated` or guarded `live` adapter |
| `DATA_MODE` | `.env.agent`, Vercel | server-only | `local` or `supabase` |
| `NEXT_PUBLIC_AI_MODE` | Vercel | client-safe | badge/telemetry mode only |
| `NEXT_PUBLIC_DATA_MODE` | Vercel | client-safe | transport selection only |
| `PUBLIC_DATA_MODE`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel (mare-ops, mare-shop, pulse) | client-safe (publishable key only) | Realtime Broadcast in Vite/Astro/SvelteKit zones (`envPrefix: 'PUBLIC_'`); Maré Ops passes them to remotes through `ctx.data` |
| `MARE_OPS_URL`, `MARE_SHOP_URL`, `PULSE_URL` | Vercel (shell), `--build-env` for previews | server/build only | multi-zone rewrite targets; default to localhost ports off Vercel |
| `ENABLE_EXPERIMENTAL_COREPACK` | Vercel (all four) | build only | use `packageManager` pnpm@10.17.1 |
| `VERCEL_TOKEN` | `.env.agent`, GitHub secret | secret | scripted deploys |
| `SUPABASE_*` | `.env.agent`, GitHub/Vercel | secret except public URL/anon key | optional migrations/data |
| `GROQ_API_KEY`, `GEMINI_API_KEY` | Vercel server env | secret | v0.2 LiveProvider only |

Never commit `.env.agent`; `.gitignore` excludes every `.env*` except `.env.example`.
