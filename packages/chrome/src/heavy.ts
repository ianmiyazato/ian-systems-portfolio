import { CommandPalette } from './palette';
import { DecisionLens } from './lens';
import { PerfHud } from './hud';

/**
 * The on-demand half of chrome: palette, Decision Lens and performance HUD bring the routes manifest,
 * the world simulation and the lens decisions with them, so they load on first use (⌘K, D, Shift+P, a
 * bar button, ?lens=on or ?hud=1) instead of on every page view.
 */
export function defineHeavy() {
  if (!customElements.get('im-command-palette')) customElements.define('im-command-palette', CommandPalette);
  if (!customElements.get('im-decision-lens')) customElements.define('im-decision-lens', DecisionLens);
  if (!customElements.get('im-perf-hud')) customElements.define('im-perf-hud', PerfHud);
  // Zones render <im-command-palette> and <im-decision-lens>; the HUD is added here.
  if (!document.querySelector('im-perf-hud')) document.body.append(document.createElement('im-perf-hud'));
}
