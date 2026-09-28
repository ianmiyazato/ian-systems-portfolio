import { resolveScreen, routes, systemOf, systems } from './routes';
import { DEFAULT_START, clock, getWorld, localHour, parseLocalTime, speeds } from '@portfolio/world';
import { chromeVars, escapeHtml } from './shared';
import { paletteActions } from './actions';

const styles = `
:host{${chromeVars}}
.scrim{position:fixed;inset:0;z-index:2147482000;display:grid;align-items:start;justify-items:center;padding:10vh 16px 16px;background:color-mix(in srgb,var(--lens-ink) 50%,transparent);animation:fade .15s ease both;font-family:var(--lens-font)}
.panel{width:min(720px,100%);max-height:78vh;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden;border:1px solid var(--lens-line);border-radius:18px;background:var(--lens-surface);color:var(--lens-ink);box-shadow:0 30px 90px color-mix(in srgb,var(--lens-ink) 40%,transparent);animation:rise .2s ease both}
label{display:block;padding:14px 16px 0;color:var(--lens-muted);font:600 11px var(--lens-mono);text-transform:uppercase;letter-spacing:.08em}
input{width:100%;padding:10px 16px 14px;border:0;border-bottom:1px solid var(--lens-line);background:transparent;color:var(--lens-ink);font:500 18px var(--lens-font);outline:none}
.list{overflow:auto;padding:8px}
h3{margin:12px 8px 4px;color:var(--lens-muted);font:700 10px var(--lens-mono);text-transform:uppercase;letter-spacing:.1em}
a{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:8px 10px;border-radius:10px;color:var(--lens-ink);text-decoration:none;font:600 13px var(--lens-font)}
a small{color:var(--lens-muted);font:500 10px var(--lens-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%}
a[aria-selected='true'],a:hover{background:var(--lens-surface-2)}
.action{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:44px;padding:8px 10px;border:0;border-radius:10px;background:transparent;color:var(--lens-ink);cursor:pointer;font:600 13px var(--lens-font);text-align:left}
.action small{color:var(--lens-muted);font:500 10px var(--lens-mono)}
.action[aria-selected='true'],.action:hover{background:var(--lens-surface-2)}
.action.on span{color:var(--lens-orange)}
a[aria-current='page']::before{content:'●';margin-right:6px;color:var(--lens-accent)}
.states{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:12px 14px;border-top:1px solid var(--lens-line);background:var(--lens-surface-2)}
.states span{margin-right:4px;color:var(--lens-muted);font:600 11px var(--lens-font)}
.states button{min-height:36px;padding:0 12px;border:1px solid var(--lens-line);border-radius:999px;background:var(--lens-surface);color:var(--lens-ink);cursor:pointer;font:600 11px var(--lens-mono)}
.states button[aria-pressed='true']{border-color:var(--lens-accent);background:var(--lens-accent);color:var(--lens-accent-ink)}
.empty{padding:24px;color:var(--lens-muted);text-align:center}
.world{display:grid;grid-template-columns:auto 1fr;gap:8px 12px;align-items:center;padding:12px 14px;border-top:1px solid var(--lens-line);font:600 11px var(--lens-font)}
.world>span{color:var(--lens-muted)}
.world .row{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.world time{min-width:64px;font:600 13px var(--lens-mono);font-variant-numeric:tabular-nums}
.world button{min-height:32px;padding:0 10px;border:1px solid var(--lens-line);border-radius:999px;background:var(--lens-surface);color:var(--lens-ink);cursor:pointer;font:600 11px var(--lens-mono)}
.world button[aria-pressed='true']{border-color:var(--lens-ink);background:var(--lens-ink);color:var(--lens-surface)}
.world input[type=range]{flex:1;min-width:160px;accent-color:var(--lens-accent)}
@keyframes fade{from{opacity:0}}@keyframes rise{from{opacity:0;transform:translateY(-8px)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
`;

/** Minutes after 06:00 for the scrubber (06:00–23:59 Maré time). */
const SCRUB_FROM = 6 * 60;

/** <im-command-palette> — ⌘K / Ctrl+K: jump to any screen, show a design state, drive the world clock. */
export class CommandPalette extends HTMLElement {
  private root: ShadowRoot;
  private open = false;
  private query = '';
  private selected = 0;
  private returnFocus: Element | null = null;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('im:palette-open', this.onOpen);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('im:palette-open', this.onOpen);
  }

  private onOpen = () => this.show(true);

  private onKey = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.show(!this.open);
    } else if (this.open && event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.show(false);
    }
  };

  show(next: boolean) {
    if (next === this.open) return;
    this.open = next;
    if (next) {
      this.returnFocus = document.activeElement;
      this.query = '';
      this.selected = 0;
    }
    this.render();
    if (next) this.root.querySelector('input')?.focus();
    else (this.returnFocus as HTMLElement | null)?.focus?.();
  }

  /** The shared world clock: pause, speed, scrub and the Black Friday scenario, synced to every tab. */
  private worldPanel() {
    const world = getWorld();
    const { state } = world;
    const now = world.now();
    const minutes = Math.round(localHour(now) * 60);
    const speed = speeds.map((value) => `<button type="button" data-speed="${value}" aria-pressed="${!state.paused && state.speed === value}">${value}×</button>`).join('');
    return `<div class="world" role="group" aria-label="World clock">
      <span>World</span>
      <div class="row"><time data-world-clock>${clock(now, true)}</time><button type="button" data-pause aria-pressed="${state.paused}">${state.paused ? 'Resume' : 'Pause'}</button>${speed}
        <button type="button" data-scenario aria-pressed="${state.scenario === 'black-friday'}">Black Friday 3.4×</button></div>
      <span><label for="scrub">Time</label></span>
      <div class="row"><input id="scrub" type="range" min="${SCRUB_FROM}" max="1439" step="1" value="${Math.max(SCRUB_FROM, minutes)}" aria-valuetext="${clock(now)}"><button type="button" data-reset>Back to 16:18</button></div>
    </div>`;
  }

  private bindWorld() {
    const world = getWorld();
    const rerender = () => {
      const focusId = (this.root.activeElement as HTMLElement | null)?.id;
      this.render();
      if (focusId) (this.root.getElementById(focusId) as HTMLElement | null)?.focus();
    };
    this.root.querySelector('[data-pause]')?.addEventListener('click', () => { world.setPaused(!world.state.paused); rerender(); });
    this.root.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((button) => button.addEventListener('click', () => { world.setSpeed(Number(button.dataset.speed) as 1 | 10 | 60); rerender(); }));
    this.root.querySelector('[data-scenario]')?.addEventListener('click', () => { world.setScenario(world.state.scenario === 'black-friday' ? 'normal' : 'black-friday'); rerender(); });
    this.root.querySelector('[data-reset]')?.addEventListener('click', () => { world.seek(DEFAULT_START); rerender(); });
    const scrub = this.root.querySelector<HTMLInputElement>('#scrub');
    scrub?.addEventListener('change', () => {
      const minutes = Number(scrub.value);
      const target = parseLocalTime(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, world.now());
      if (target) world.seek(target);
      rerender();
    });
    scrub?.addEventListener('input', () => {
      const minutes = Number(scrub.value);
      const label = this.root.querySelector('[data-world-clock]');
      if (label) label.textContent = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`;
    });
    // Keep the clock ticking while the palette is open.
    clearInterval(this.tick);
    this.tick = window.setInterval(() => {
      const label = this.root.querySelector('[data-world-clock]');
      if (!this.open) return clearInterval(this.tick);
      if (label && document.activeElement !== this && !this.root.querySelector('#scrub:active')) label.textContent = clock(world.now(), true);
    }, 1000);
  }

  private tick = 0;

  private filtered() {
    const query = this.query.trim().toLowerCase();
    return routes.filter((screen) => !query || `${screen.title} ${screen.href} ${systemOf(screen.system).title}`.toLowerCase().includes(query));
  }

  private render() {
    if (!this.open) {
      this.root.innerHTML = '';
      return;
    }
    const current = resolveScreen(location.pathname, location.search);
    const area = current ? systemOf(current.system) : undefined;
    const activeState = new URLSearchParams(location.search).get('state') ?? 'live';
    const results = this.filtered();
    const actions = paletteActions(this.query);
    let flatIndex = -1;
    const actionGroup = actions.length
      ? `<h3>Actions</h3>${actions.map((action) => {
          flatIndex += 1;
          const on = action.active?.() ?? false;
          return `<button type="button" role="option" class="action ${on ? 'on' : ''}" data-action="${escapeHtml(action.id)}" data-flat="${flatIndex}" aria-selected="${flatIndex === this.selected}"><span>${escapeHtml(action.title)}${on ? ' · running' : ''}</span><small>${escapeHtml(action.hint)}</small></button>`;
        }).join('')}`
      : '';
    const groups = systems
      .map((group) => {
        const items = results.filter((screen) => screen.system === group.id);
        if (!items.length) return '';
        return `<h3>${escapeHtml(group.title)}</h3>${items
          .map((screen) => {
            flatIndex += 1;
            return `<a role="option" href="${escapeHtml(screen.href)}" data-flat="${flatIndex}" aria-selected="${flatIndex === this.selected}" ${current?.id === screen.id ? 'aria-current="page"' : ''}><span>${escapeHtml(screen.title)}</span><small>${escapeHtml(screen.href)}</small></a>`;
          })
          .join('')}`;
      })
      .join('');
    const states = area?.states.length
      ? `<div class="states" role="group" aria-label="Show state"><span>Show state:</span>${['live', ...area.states]
          .map((state) => `<button type="button" data-state="${state}" aria-pressed="${state === activeState}">${state}</button>`)
          .join('')}</div>`
      : `<div class="states"><span>Open a product screen to preview its empty, loading, error, offline and locked states.</span></div>`;
    this.root.innerHTML = `<style>${styles}</style><div class="scrim" data-scrim><section class="panel" role="dialog" aria-modal="true" aria-label="Command palette">
      <div><label for="q">Jump to a screen or run an action</label><input id="q" autocomplete="off" placeholder="Search screens, routes, states and actions (try “chaos”)…" value="${escapeHtml(this.query)}" role="combobox" aria-expanded="true" aria-controls="results"></div>
      <div class="list" id="results" role="listbox" aria-label="Actions and screens">${actionGroup}${groups || (actionGroup ? '' : '<p class="empty">No screen or action matches that search.</p>')}</div>${states}${this.worldPanel()}</section></div>`;
    const input = this.root.querySelector('input')!;
    input.addEventListener('input', () => {
      this.query = input.value;
      this.selected = 0;
      const position = input.selectionStart;
      this.render();
      const next = this.root.querySelector('input')!;
      next.focus();
      next.setSelectionRange(position, position);
    });
    input.addEventListener('keydown', (event) => {
      const count = this.filtered().length + paletteActions(this.query).length;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.selected = (this.selected + (event.key === 'ArrowDown' ? 1 : -1) + count) % Math.max(count, 1);
        this.root.querySelectorAll('[data-flat]').forEach((link) => link.setAttribute('aria-selected', String(Number((link as HTMLElement).dataset.flat) === this.selected)));
        this.root.querySelector(`[data-flat="${this.selected}"]`)?.scrollIntoView({ block: 'nearest' });
      } else if (event.key === 'Enter') {
        const target = this.root.querySelector<HTMLElement>(`[data-flat="${this.selected}"]`);
        if (target instanceof HTMLAnchorElement) location.assign(target.href);
        else target?.click();
      }
    });
    this.root.querySelector('[data-scrim]')!.addEventListener('mousedown', (event) => {
      if (event.target === event.currentTarget) this.show(false);
    });
    this.bindWorld();
    this.root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) =>
      button.addEventListener('click', () => {
        paletteActions('').find((action) => action.id === button.dataset.action)?.run();
        this.render();
      })
    );
    this.root.querySelectorAll<HTMLButtonElement>('[data-state]').forEach((button) =>
      button.addEventListener('click', () => {
        const url = new URL(location.href);
        if (button.dataset.state === 'live') url.searchParams.delete('state');
        else url.searchParams.set('state', button.dataset.state!);
        location.assign(url.toString());
      })
    );
  }
}
