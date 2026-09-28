import { PortfolioBar } from './bar';
import { CommandPalette } from './palette';
import { DecisionLens } from './lens';
import { NowPlayingBar } from './now-playing';
import { Shortcuts } from './shortcuts';
import { enhanceAiSurfaces } from './provenance';

export { PortfolioBar, CommandPalette, DecisionLens, NowPlayingBar, Shortcuts };
export { viewsOf } from './shortcuts';
export { playQueue, togglePlay, step, seek, stopPlaying, nowPlaying, onNowPlaying, type Track, type NowPlaying } from './now-playing';
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
  if (!customElements.get('im-now-playing')) customElements.define('im-now-playing', NowPlayingBar);
  if (!customElements.get('im-shortcuts')) customElements.define('im-shortcuts', Shortcuts);
  // Shortcuts need no markup in any zone: one instance is added to the page.
  if (!document.querySelector('im-shortcuts')) document.body.append(document.createElement('im-shortcuts'));
  if (!document.documentElement.dataset.aiHow) {
    document.documentElement.dataset.aiHow = 'on';
    enhanceAiSurfaces();
  }
}
