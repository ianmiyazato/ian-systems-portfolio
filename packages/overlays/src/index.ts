/**
 * URL-addressable overlay stack shared by every zone and framework.
 * The URL is the state: ?modal=…&sub=… or ?drawer=…&sub=… reproduces any nested layer.
 */
type Layer = { element: HTMLElement; close: () => void; restore: Element | null };
type OverlayGlobal = { layers: Layer[]; installed: boolean };

const globalKey = '__imOverlayStack';
const state = (): OverlayGlobal => {
  const host = globalThis as unknown as Record<string, OverlayGlobal>;
  host[globalKey] ??= { layers: [], installed: false };
  return host[globalKey];
};

export const overlayKeys = ['modal', 'drawer', 'sheet', 'sub'] as const;

export function readParams(): URLSearchParams {
  return new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
}

/** Patch query params; null removes a key. Pushes history so Back closes the top layer. */
export function setParams(patch: Record<string, string | null>, options: { replace?: boolean } = {}) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  history[options.replace ? 'replaceState' : 'pushState'](history.state, '', `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new CustomEvent('im:urlchange'));
}

/** Client-side navigation inside a zone; other zones use normal links. */
export function navigate(href: string, options: { replace?: boolean } = {}) {
  history[options.replace ? 'replaceState' : 'pushState'](null, '', href);
  window.dispatchEvent(new CustomEvent('im:urlchange'));
  if (!options.replace) window.scrollTo({ top: 0 });
}

export function onUrlChange(callback: () => void): () => void {
  window.addEventListener('popstate', callback);
  window.addEventListener('im:urlchange', callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener('im:urlchange', callback);
  };
}

const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function install() {
  const stack = state();
  if (stack.installed) return;
  stack.installed = true;
  document.addEventListener('keydown', (event) => {
    const top = stack.layers.at(-1);
    if (!top) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      top.close();
    } else if (event.key === 'Tab') {
      const items = [...top.element.querySelectorAll<HTMLElement>(focusable)].filter((item) => item.offsetParent !== null);
      if (!items.length) return;
      const first = items[0]!;
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!top.element.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

/**
 * Register a mounted layer. Esc closes only the top-most layer; focus moves in on open
 * and returns to the trigger on release.
 */
export function pushLayer(element: HTMLElement, close: () => void): () => void {
  install();
  const layer: Layer = { element, close, restore: document.activeElement };
  state().layers.push(layer);
  const target = element.querySelector<HTMLElement>('[data-autofocus]') ?? element.querySelector<HTMLElement>(focusable) ?? element;
  if (target === element && !element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
  queueMicrotask(() => target.focus({ preventScroll: true }));
  return () => {
    const layers = state().layers;
    const index = layers.indexOf(layer);
    if (index >= 0) layers.splice(index, 1);
    const restore = layer.restore as HTMLElement | null;
    if (restore?.isConnected) restore.focus({ preventScroll: true });
  };
}

export function layerDepth() {
  return state().layers.length;
}
