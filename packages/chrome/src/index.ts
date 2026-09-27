import { PortfolioBar } from './bar';
import { CommandPalette } from './palette';
import { DecisionLens } from './lens';

export { PortfolioBar, CommandPalette, DecisionLens };
export * from './routes';
export * from './decisions';
export { emitUrlChange } from './shared';
export { registerPaletteAction, paletteActions, type PaletteAction } from './actions';

/** Idempotent: every zone calls this once on the client. */
export function defineChrome() {
  if (typeof customElements === 'undefined') return;
  if (!customElements.get('im-portfolio-bar')) customElements.define('im-portfolio-bar', PortfolioBar);
  if (!customElements.get('im-command-palette')) customElements.define('im-command-palette', CommandPalette);
  if (!customElements.get('im-decision-lens')) customElements.define('im-decision-lens', DecisionLens);
}
