import { MINUTE, getWorld } from '@portfolio/world';
import { chromeVars, eventIsTyping } from './shared';

/**
 * <im-perf-hud> — Shift+P (or ?hud=1): Core Web Vitals for the current route, JS transferred per zone,
 * and the live world event rate. Hidden until asked for; it reads PerformanceObserver entries only.
 */
const styles = `
:host{${chromeVars}}
.hud{position:fixed;right:16px;bottom:16px;z-index:2147481000;width:300px;padding:12px 14px;border:1px solid var(--lens-line);border-radius:14px;background:color-mix(in srgb,var(--lens-surface) 94%,transparent);color:var(--lens-ink);font:500 12px var(--lens-mono);box-shadow:0 20px 50px color-mix(in srgb,var(--lens-ink) 25%,transparent);backdrop-filter:blur(10px)}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font:700 12px var(--lens-font)}
button{min-width:32px;min-height:32px;border:0;border-radius:8px;background:transparent;color:var(--lens-ink);font-size:16px;cursor:pointer}
dl{display:grid;grid-template-columns:1fr auto auto;gap:4px 8px;margin:0}
dt{color:var(--lens-muted)}dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}
.good{color:var(--lens-success)}.poor{color:var(--lens-orange)}
h4{margin:10px 0 4px;color:var(--lens-muted);font:700 10px var(--lens-mono);text-transform:uppercase;letter-spacing:.08em}
`;

const zones: Array<[string, (url: URL) => boolean]> = [
  ['shell · Next', (url) => url.pathname.startsWith('/_next/')],
  ['mare-ops host · Vite', (url) => url.pathname.startsWith('/mare/ops/assets/')],
  ['remotes · Preact', (url) => url.pathname.startsWith('/mare/ops/remotes/')],
  ['mare-shop · Astro', (url) => url.pathname.startsWith('/mare/_astro/')],
  ['pulse · SvelteKit', (url) => url.pathname.startsWith('/pulse/_app/')]
];

const rate = (value: number, good: number, poor: number) => (value <= good ? 'good' : value > poor ? 'poor' : '');

export class PerfHud extends HTMLElement {
  private root = this.attachShadow({ mode: 'open' });
  private open = false;
  private lcp = 0;
  private cls = 0;
  private inp = 0;
  private timer = 0;
  private observers: PerformanceObserver[] = [];

  connectedCallback() {
    window.addEventListener('keydown', this.onKey);
    this.observe('largest-contentful-paint', (entries) => { this.lcp = entries.at(-1)!.startTime; });
    this.observe('layout-shift', (entries) => {
      for (const entry of entries as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) this.cls += entry.value;
    });
    this.observe('event', (entries) => {
      for (const entry of entries as Array<PerformanceEntry & { interactionId?: number }>) if (entry.interactionId) this.inp = Math.max(this.inp, entry.duration);
    });
    if (new URLSearchParams(location.search).get('hud') === '1') this.toggle(true);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.onKey);
    this.observers.forEach((observer) => observer.disconnect());
    window.clearInterval(this.timer);
  }

  private observe(type: string, handle: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => { handle(list.getEntries()); if (this.open) this.render(); });
      observer.observe({ type, buffered: true, ...(type === 'event' ? { durationThreshold: 16 } : {}) } as PerformanceObserverInit);
      this.observers.push(observer);
    } catch {
      // Entry type not supported in this browser: that vital shows as —.
    }
  }

  private onKey = (event: KeyboardEvent) => {
    if (event.key === 'P' && event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && !eventIsTyping(event)) {
      event.preventDefault();
      this.toggle(!this.open);
    }
  };

  toggle(next: boolean) {
    this.open = next;
    window.clearInterval(this.timer);
    if (next) {
      this.render();
      this.timer = window.setInterval(() => this.render(), 1000);
    } else this.root.innerHTML = '';
  }

  private render() {
    const kb = new Map<string, number>();
    for (const entry of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
      if (!entry.name.endsWith('.js') && entry.initiatorType !== 'script') continue;
      const url = new URL(entry.name, location.href);
      const zone = zones.find(([, match]) => match(url))?.[0] ?? 'other';
      kb.set(zone, (kb.get(zone) ?? 0) + (entry.transferSize || entry.encodedBodySize) / 1024);
    }
    const world = getWorld();
    const now = world.now();
    const perMinute = world.between(now - MINUTE, now).length;
    const vital = (label: string, value: number, unit: string, good: number, poor: number, digits = 0) =>
      `<dt>${label}</dt><dd class="${value ? rate(value, good, poor) : ''}">${value ? value.toFixed(digits) : '—'}</dd><dd>${unit}</dd>`;
    this.root.innerHTML = `<style>${styles}</style><section class="hud" role="region" aria-label="Performance HUD">
      <header><span>Performance · ${location.pathname}</span><button type="button" aria-label="Close performance HUD">×</button></header>
      <dl>${vital('LCP', this.lcp, 'ms', 2500, 4000)}${vital('INP', this.inp, 'ms', 200, 500)}${vital('CLS', this.cls || 0.0001, '', 0.1, 0.25, 3)}</dl>
      <h4>JS transferred</h4>
      <dl>${[...kb.entries()].map(([zone, value]) => `<dt>${zone}</dt><dd>${value.toFixed(1)}</dd><dd>kB</dd>`).join('') || '<dt>none yet</dt><dd></dd><dd></dd>'}</dl>
      <h4>World</h4>
      <dl><dt>events · last sim minute</dt><dd>${perMinute}</dd><dd>/min</dd><dt>speed</dt><dd>${world.state.paused ? 'paused' : `${world.state.speed}×`}</dd><dd></dd></dl>
    </section>`;
    this.root.querySelector('button')?.addEventListener('click', () => this.toggle(false));
  }
}
