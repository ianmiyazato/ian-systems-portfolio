# Overlays and the Decision Lens

## URL-addressable overlay stack

`@portfolio/overlays` is one layer stack shared by every zone and framework. The URL is the state: `?modal=…&sub=…`, `?drawer=…&sub=…` or `?sheet=…` reproduces any nested layer, so demos, tests and screenshots deep-link straight into a nested decision.

- `pushLayer(element, close)` registers a mounted layer: focus moves in on open, returns to the trigger on close, Tab is trapped, and Esc closes only the top-most layer.
- `setParams(patch)` pushes history, so Back closes the top layer; `navigate(href)` is in-zone client navigation.
- Remotes use `Layer` from `@portfolio/remote-runtime` (kinds `modal`, `sheet`, `drawer`, `sub`, `sub-drawer`; level 2 layers get the lighter scrim). The shell uses `components/overlay.tsx`; Astro and Svelte use the same CSS contract (`@portfolio/overlays/overlays.css`).
- Every deep link a reviewer should reach is a manifest route (`packages/routes/src/routes.manifest.ts`), and its overlay params are derived from the href (`overlayParams()`).

## Decision Lens

`<im-decision-lens>` (packages/chrome) is one web component used by all four stacks: press `D` or use **Show decisions** in `<im-portfolio-bar>`. It resolves the current screen from `packages/chrome/src/routes.ts` (path + `modal`/`drawer`/`sub` params), lazy-loads `decisions/<screen>.json`, and pins numbered hotspots to each decision's `anchor` (a `[data-anchor="…"]` selector). Each file needs at least four decisions mixing Frontend and Backend and spanning three of Frontend/Backend/Data/AI; every entry has `id`, `anchor`, `tag`, `decision`, `why`, `alternative`, `value`. To add one: add a `data-anchor` attribute to the element, then append the entry to that screen's JSON. `?lens=on` opens the lens on load (used by screenshots). `packages/chrome/src/decisions.test.ts` fails the build if any registry screen has fewer than four decisions, a missing field, an anchor that isn't a `[data-anchor]` selector, or an orphan file; `tests/e2e/decision-lens.spec.ts` opens every screen in Chromium and fails if any anchor doesn't resolve in the rendered DOM (anchors can only be resolved in a browser because they span four frameworks).

### Tags

v0.1 tags `Frontend`, `Backend`, `Data`, `AI` stay valid. v0.2 adds `Design`, `UX`, `Architecture`, `Engineering` and `Free-tier` (choices made for cost reasons, e.g. "the simulation runs in the browser so the demo costs $0 and works offline"). A file needs at least four decisions spanning at least three tags, mixing an experience tag (Frontend/Design/UX) with a system tag (Backend/Architecture/Engineering/Data/Free-tier). New screens should name the pattern they borrow and why it fits.
