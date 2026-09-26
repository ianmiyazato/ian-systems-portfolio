import { areaOf, areas, resolveScreen, screens } from './routes';
import { chromeVars, escapeHtml } from './shared';

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
a[aria-current='page']::before{content:'●';margin-right:6px;color:var(--lens-accent)}
.states{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:12px 14px;border-top:1px solid var(--lens-line);background:var(--lens-surface-2)}
.states span{margin-right:4px;color:var(--lens-muted);font:600 11px var(--lens-font)}
.states button{min-height:36px;padding:0 12px;border:1px solid var(--lens-line);border-radius:999px;background:var(--lens-surface);color:var(--lens-ink);cursor:pointer;font:600 11px var(--lens-mono)}
.states button[aria-pressed='true']{border-color:var(--lens-accent);background:var(--lens-accent);color:var(--lens-accent-ink)}
.empty{padding:24px;color:var(--lens-muted);text-align:center}
@keyframes fade{from{opacity:0}}@keyframes rise{from{opacity:0;transform:translateY(-8px)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
`;

/** <im-command-palette> — ⌘K / Ctrl+K: jump to any artboard or show a design state. */
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

  private filtered() {
    const query = this.query.trim().toLowerCase();
    return screens.filter((screen) => !query || `${screen.label} ${screen.href} ${areaOf(screen.area).label}`.toLowerCase().includes(query));
  }

  private render() {
    if (!this.open) {
      this.root.innerHTML = '';
      return;
    }
    const current = resolveScreen(location.pathname, location.search);
    const area = current ? areaOf(current.area) : undefined;
    const activeState = new URLSearchParams(location.search).get('state') ?? 'live';
    const results = this.filtered();
    let flatIndex = -1;
    const groups = areas
      .map((group) => {
        const items = results.filter((screen) => screen.area === group.id);
        if (!items.length) return '';
        return `<h3>${escapeHtml(group.label)}</h3>${items
          .map((screen) => {
            flatIndex += 1;
            return `<a role="option" href="${escapeHtml(screen.href)}" data-flat="${flatIndex}" aria-selected="${flatIndex === this.selected}" ${current?.id === screen.id ? 'aria-current="page"' : ''}><span>${escapeHtml(screen.label)}</span><small>${escapeHtml(screen.href)}</small></a>`;
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
      <div><label for="q">Jump to a screen</label><input id="q" autocomplete="off" placeholder="Search 40 artboards, routes and states…" value="${escapeHtml(this.query)}" role="combobox" aria-expanded="true" aria-controls="results"></div>
      <div class="list" id="results" role="listbox" aria-label="Screens">${groups || '<p class="empty">No screen matches that search.</p>'}</div>${states}</section></div>`;
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
      const count = this.filtered().length;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.selected = (this.selected + (event.key === 'ArrowDown' ? 1 : -1) + count) % Math.max(count, 1);
        this.root.querySelectorAll('[data-flat]').forEach((link) => link.setAttribute('aria-selected', String(Number((link as HTMLElement).dataset.flat) === this.selected)));
        this.root.querySelector(`[data-flat="${this.selected}"]`)?.scrollIntoView({ block: 'nearest' });
      } else if (event.key === 'Enter') {
        const target = this.root.querySelector<HTMLAnchorElement>(`[data-flat="${this.selected}"]`);
        if (target) location.assign(target.href);
      }
    });
    this.root.querySelector('[data-scrim]')!.addEventListener('mousedown', (event) => {
      if (event.target === event.currentTarget) this.show(false);
    });
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
