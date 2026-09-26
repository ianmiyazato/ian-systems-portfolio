// Astro islands without a framework: URL-addressable layers, ?state variations, chrome.
import { defineChrome } from '@portfolio/chrome';
import { onUrlChange, pushLayer, readParams, setParams } from '@portfolio/overlays';

defineChrome();

const releases = new WeakMap<HTMLElement, () => void>();

function sync() {
  const params = readParams();
  document.documentElement.dataset.state = params.get('state') ?? 'live';
  document.querySelectorAll<HTMLElement>('[data-layer]').forEach((layer) => {
    const open = layer.dataset.layer!.split('&').every((pair) => {
      const [key, value] = pair.split('=');
      return params.get(key!) === value;
    });
    if (open && layer.hidden) {
      layer.hidden = false;
      const dialog = layer.querySelector<HTMLElement>('[role="dialog"]') ?? layer;
      const keys = (layer.dataset.closes ?? '').split(',').filter(Boolean);
      releases.set(layer, pushLayer(dialog, () => setParams(Object.fromEntries(keys.map((key) => [key, null])))));
    } else if (!open && !layer.hidden) {
      layer.hidden = true;
      releases.get(layer)?.();
      releases.delete(layer);
    }
  });
  document.querySelectorAll<HTMLElement>('[data-state-only]').forEach((element) => {
    element.hidden = !element.dataset.stateOnly!.split(' ').includes(document.documentElement.dataset.state!);
  });
  document.querySelectorAll<HTMLElement>('[data-state-hide]').forEach((element) => {
    element.hidden = element.dataset.stateHide!.split(' ').includes(document.documentElement.dataset.state!);
  });
}

document.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-open],[data-close]');
  if (!target) return;
  event.preventDefault();
  if (target.dataset.open) setParams(Object.fromEntries(target.dataset.open.split('&').map((pair) => pair.split('=') as [string, string])));
  if (target.dataset.close) setParams(Object.fromEntries(target.dataset.close.split(',').map((key) => [key, null])));
});

onUrlChange(sync);
sync();
