# Design languages

All colors are semantic CSS variables emitted by `@portfolio/tokens` from `packages/tokens/src/themes.json` (run `node packages/tokens/scripts/emit-css.mjs` after editing; a unit test fails if `themes.css` drifts). Contract: `ground`, `surface`, `surface-2`, `ink`, `muted`, `line`, `accent`, `accent-ink`, `accent-text`, `accent-2`, `risk`, `warn`, `success`, `info`, `ai`, `ai-ink`, derived `*-soft`, `shade`, `scrim`, `elevation`; plus `font-display/ui/mono`, `radius`, `radius-sm`, `display-weight/tracking/stretch`, `overlay-in`, `drawer-in`, `ease`, `duration`. Themes: portfolio, counter, product-hub, pay, circle, mesh, consumer, atlas, pulse. A contrast test enforces WCAG AA for every text pair in every theme. Do not add component-level color literals. New values belong in the token package.

Fonts are self-hosted through Fontsource and imported per theme with `import '@portfolio/tokens/fonts/<theme>'`; Pulse CJK faces load lazily via `fonts/pulse-cjk`.

Motion uses `rise`, `draw`, `scan`, `float`, `breathe`, and route/view-transition-friendly transform/opacity only. Every animation must stop under `prefers-reduced-motion`. Touch targets are at least 44px globally and 56px for Counter primary tasks.

Inventory: portfolio bar, system tabs, KPI tile, record row, status pill, AI suggestion, trace, source chip, modal, nested sub-modal, drawer/sheet treatment, state banner, command palette, decision hotspot, animated architecture node, chart. AI always uses the theme’s AI color, sparkle, badge, sources, and approval button.
