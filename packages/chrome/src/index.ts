import { PortfolioBar } from './bar';
import { eventIsTyping } from './shared';

export { PortfolioBar };
export { emitUrlChange } from './shared';

/*
 * Chrome ships in three parts so a page view only pays for what it uses:
 *   core (this file): the portfolio bar and a few tiny triggers;
 *   on first use: shortcuts (first shortcut key), palette + lens + HUD (⌘K, D, Shift+P, bar buttons,
 *   ?lens=on, ?hud=1), provenance (only when the page has an AI card), now-playing (only where a layout mounts it).
 */
let heavy: Promise<void> | null = null;
export function loadHeavyChrome() {
  heavy ??= import('./heavy').then(({ defineHeavy }) => defineHeavy());
  return heavy;
}

type ShortcutsElement = HTMLElement & { handleKey(key: string): void };
let shortcuts: Promise<ShortcutsElement> | null = null;
function loadShortcuts() {
  shortcuts ??= import('./shortcuts').then(({ Shortcuts }) => {
    if (!customElements.get('im-shortcuts')) customElements.define('im-shortcuts', Shortcuts);
    const element = (document.querySelector('im-shortcuts') ?? document.body.appendChild(document.createElement('im-shortcuts'))) as ShortcutsElement;
    return element;
  });
  return shortcuts;
}

const SHORTCUT_KEYS = new Set(['?', 'j', 'k', '/', 'g', 'a', 'x']);
const ready = () => customElements.get('im-command-palette') !== undefined;

function installTriggers() {
  const replay = (event: string) => void loadHeavyChrome().then(() => window.dispatchEvent(new CustomEvent(event)));
  window.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey) {
      if (!ready() && event.key.toLowerCase() === 'k') { event.preventDefault(); replay('im:palette-open'); }
      return;
    }
    if (event.altKey || eventIsTyping(event)) return;
    if (!ready() && event.key.toLowerCase() === 'd') replay('im:lens-toggle');
    if (!ready() && event.key === 'P' && event.shiftKey) void loadHeavyChrome().then(() => (document.querySelector('im-perf-hud') as (HTMLElement & { toggle(next: boolean): void }) | null)?.toggle(true));
    // The first shortcut key loads the engine and is handed to it, so nothing is lost.
    if (!customElements.get('im-shortcuts') && SHORTCUT_KEYS.has(event.key)) {
      if (event.key === '/' || event.key === '?') event.preventDefault();
      const key = event.key;
      void loadShortcuts().then((element) => element.handleKey(key));
    }
  });
  for (const name of ['im:palette-open', 'im:lens-toggle']) window.addEventListener(name, () => { if (!ready()) replay(name); });
  const params = new URLSearchParams(location.search);
  if (params.get('lens') === 'on' || params.get('hud') === '1' || document.documentElement.dataset.lens === 'on') void loadHeavyChrome();
}

/** Provenance and the now-playing bar load only on pages that need them. */
function watchForOptionalParts() {
  let provenance = false;
  let player = false;
  const scan = () => {
    if (!provenance && document.querySelector('.ai-surface')) {
      provenance = true;
      void import('./provenance').then(({ enhanceAiSurfaces }) => enhanceAiSurfaces());
    }
    if (!player && document.querySelector('im-now-playing')) {
      player = true;
      void import('./now-playing').then(({ NowPlayingBar }) => { if (!customElements.get('im-now-playing')) customElements.define('im-now-playing', NowPlayingBar); });
    }
    if (provenance && player) observer.disconnect();
  };
  const observer = new MutationObserver(scan);
  scan();
  observer.observe(document.body, { childList: true, subtree: true });
}

/** Idempotent: every zone calls this once on the client. */
export function defineChrome() {
  if (typeof customElements === 'undefined') return;
  if (!customElements.get('im-portfolio-bar')) customElements.define('im-portfolio-bar', PortfolioBar);
  if (document.documentElement.dataset.chrome) return;
  document.documentElement.dataset.chrome = 'on';
  installTriggers();
  watchForOptionalParts();
}
