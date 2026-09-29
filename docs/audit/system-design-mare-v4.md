# System design audit · Maré case (v0.4 pilot)

Audited 2026-09-29 on the local production build, with all four zones behind the shell on `:3000`. Same tooling as the v2 audit (Playwright Chromium, CDP tracing, `PerformanceObserver`, axe): `LABEL=system-design-mare-v4 PATHS=/system-design/mare,/system-design/mare/black-friday,/system-design/mare/storefront node scripts/sd-audit.mjs`. Raw measurements: [system-design-mare-v4.json](system-design-mare-v4.json). Every presentation step is captured at 1440 × 900 and 1920 × 1080 in [the step gallery](../screenshots/system-design/steps/) (`sd-mare-*`, 31 steps, 62 images).

## Result

| Route | Steps | Trace (whole walk) | Frames | CLS load → after steps | Console | axe serious / critical | Min text | JS gzip |
|---|---:|---|---|---:|---:|---:|---:|---:|
| `/system-design/mare` | 3 | 0 tasks >50 ms; longest 2 ms | 60 fps; worst 21 ms | 0 → 0 | 0 | 0 | 14 px | 8.6 kB |
| `/system-design/mare/black-friday` | 15 | 0 tasks >50 ms; longest 6 ms | 60 fps; worst 20 ms | 0 → 0 | 0 | 0 | 14 px | 8.9 kB |
| `/system-design/mare/storefront` | 13 | 0 tasks >50 ms; longest 8 ms | 60 fps; worst 21 ms | 0 → 0 | 0 | 0 | 14 px | 9.9 kB |

- **Motion:** at most two packets, only `offset-distance` and opacity, zero DOM mutations per second. Nothing runs off-screen or in a hidden tab. Reduced motion runs zero animations and keeps every caption.
- **Live demo:** its own CLS readout, which counts every shift inside the demo after the page settles (including shifts right after clicks), reads `0.000` at every presentation step and after the e2e walk through stock bands, add to bag and all five busy levels.
- **Plain layer:** the story engine's lint passes on every caption, title and note (unit and e2e). The broader audit word list flags nothing on the two problem pages. On the hub it flags the "What this case teaches" list (idempotency, backpressure, cache at the edge…) and the verbatim metric label "API latency". Both are deliberate: the concepts list is the study map for engineers, and the metric label is stated as measured.
- **The overlap heuristic** counts plain captions and engineering labels that share one reserved box in each node, the same false positive recorded in v2. Screenshots show one layer at a time.

## What the review changed before release

| Found | Change |
|---|---|
| Seven-step rails wrapped and left the ← and → buttons on lines of their own | Rails wrap inside the stepper and the arrows stay on the first line (`story.css`); v0.3 pages are unchanged |
| The demo's busy banner reserved an empty row at levels 0–3 | The banner sits over the product photo; showing it still moves nothing |
| Five busy-level names overflowed a 300 px column | Buttons show `L0`–`L4`, with the current level's name underneath |
| Decision cards left an empty half-row; the verdict box left a hole in the 2 × 2 readout | "What we give up" spans the row with "If we get it wrong" beside it; cost and verdict share a row |
| In presentation mode the demo overflowed the 16:9 stage into the caption | Presentation hides the demo heading and note, and packs the readout 2 × 2 |
| The demo's CLS readout showed 0.243 in presentation mode: the stage's own setup shift was counted | The readout starts after load, fonts and the presentation stage settle, as the v0.3 demo does |
| axe: "In stock" green text at 4.4:1 | Band text darkened (border keeps the brand green) |
| The audit word list flagged "Queue" as a busy-level name | Renamed to "Line", matching "a fair line" in the story |

## Lighthouse

Lighthouse, default mobile simulated throttling, median of three local-production runs (`PATHS=… node scripts/lighthouse.mjs`):

| Page | Performance | Accessibility | Best practices | SEO | LCP |
|---|---:|---:|---:|---:|---:|
| `/system-design/mare` | 99 | 100 | 100 | 100 | 1.821 s |
| `/system-design/mare/black-friday` | 99 | 100 | 100 | 100 | 1.818 s |
| `/system-design/mare/storefront` | 99 | 100 | 100 | 100 | 1.817 s |

## Gates

- `pnpm check`: lint, typecheck, unit tests (57 in `@portfolio/system-design`, including the case schema, the decision math and the call-script drift test) and all builds pass.
- `pnpm e2e`: 665 tests. Of the first run's 664 passes and 1 failure, the failure was the contrast finding above. After the fix, the a11y, crawler, Decision Lens, budget and Maré suites (191 tests) pass.
- JS budgets: all routes within budget; the three Maré pages are 8.6–9.9 kB against 60 kB.
