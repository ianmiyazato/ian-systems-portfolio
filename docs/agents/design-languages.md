# Design languages

All colors are semantic CSS variables emitted by `@portfolio/tokens` from `packages/tokens/src/themes.json` (run `node packages/tokens/scripts/emit-css.mjs` after editing; a unit test fails if `themes.css` drifts). Contract: `ground`, `surface`, `surface-2`, `ink`, `muted`, `line`, `accent`, `accent-ink`, `accent-text`, `accent-2`, `risk`, `warn`, `success`, `info`, `ai`, `ai-ink`, derived `*-soft`, `shade`, `scrim`, `elevation`; plus `font-display/ui/mono`, `radius`, `radius-sm`, `display-weight/tracking/stretch`, `overlay-in`, `drawer-in`, `ease`, `duration`. Themes: portfolio, counter, product-hub, pay, circle, mesh, consumer, atlas, pulse. A contrast test enforces WCAG AA for every text pair in every theme. Do not add component-level color literals. New values belong in the token package.

Fonts are self-hosted through Fontsource and imported per theme with `import '@portfolio/tokens/fonts/<theme>'`; Pulse CJK faces load lazily via `fonts/pulse-cjk`.

Touch targets are at least 44px globally and 56px for Counter primary tasks.

## Motion system

`@portfolio/motion` is the one motion engine; each design language maps it to a personality: Counter **snaps**, Product Hub **fades**, Pay **sweeps**, Circle **bounces**, Mesh **slides**, Atlas **springs** gently, Pulse **pulses** (Portfolio and the consumer site rise, Tidewatch fades). `themeMotion` is the source of truth for every theme's `ease`, `duration`, `overlay-in`, `drawer-in`, `enter` and `personality`; `packages/motion/src/index.test.ts` fails if `themes.json` drifts.

- `motion.css` (loaded by all four zones): an entrance keyframe per personality (`[data-enter]` uses the theme's `--enter`), Pulse's `ov-pulse` overlay, and `@view-transition { navigation: auto }` so moving between zones cross-fades.
- Shared elements: product card → PDP (`product-<slug>`, cross-document), order card → picking header (`order-<id>`) and creator card → profile avatar (`creator-<code>`) inside same-document view transitions (the remote router's `navigate` and Circle's profile open run in `withViewTransition`).
- Helpers: `tween()` for numbers, `flip()` for reordering lists, `withViewTransition()`; all no-ops under reduced motion.
- Only `transform` and `opacity` animate (a unit test checks every keyframe). Nothing loops forever except live indicators.
- Reduced motion is enforced globally in `packages/tokens/src/base.css` (every animation jumps to its end state, every transition is instant), and `tests/e2e/reduced-motion.spec.ts` emulates `prefers-reduced-motion: reduce` on every manifest route and fails if any animation is still running a second after load. Shadow-DOM chrome (bar, lens, palette, now-playing) carries its own rules.

Inventory: portfolio bar, system tabs, KPI tile, record row, status pill, AI suggestion, trace, source chip, modal, nested sub-modal, drawer/sheet treatment, state banner, command palette, decision hotspot, animated architecture node, chart. AI always uses the theme’s AI color, sparkle, badge, sources, and approval button.
