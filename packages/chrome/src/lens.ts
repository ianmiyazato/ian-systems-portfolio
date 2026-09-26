import { loadDecisions, type Decision } from './decisions';
import { resolveScreen, type ScreenRoute } from './routes';
import { chromeVars, escapeHtml, eventIsTyping, tagColor } from './shared';

export type AnchorResolution = { id: string; anchor: string; resolved: boolean; visible: boolean };

const styles = `
:host{${chromeVars}}
.layer{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:var(--lens-font)}
.tint{position:fixed;inset:0;background:color-mix(in srgb,var(--lens-accent) 5%,transparent);animation:fade .2s ease both}
.outline{position:fixed;border:2px dashed var(--lens-accent);border-radius:10px;background:color-mix(in srgb,var(--lens-accent) 8%,transparent);opacity:0;transition:opacity .15s ease,transform .2s ease}
.outline.on{opacity:1}
.hotspot{position:fixed;display:grid;place-items:center;width:32px;height:32px;margin:-16px 0 0 -16px;border:3px solid var(--lens-surface);border-radius:50%;background:var(--tag);color:var(--lens-accent-ink);box-shadow:0 6px 20px color-mix(in srgb,var(--lens-ink) 35%,transparent);font:800 13px/1 var(--lens-font);pointer-events:auto;cursor:pointer;animation:pop .35s both;animation-delay:calc(var(--i) * 60ms)}
.hotspot::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid var(--tag);animation:ring 2.2s ease-out infinite;animation-delay:calc(var(--i) * 200ms)}
.hotspot[hidden]{display:none}
.hotspot:focus-visible{outline:3px solid var(--lens-ink);outline-offset:3px}
.legend{position:fixed;left:16px;bottom:16px;width:min(340px,calc(100vw - 32px));max-height:min(420px,60vh);overflow:auto;padding:14px;border:1px solid var(--lens-line);border-radius:16px;background:var(--lens-surface);color:var(--lens-ink);box-shadow:0 24px 70px color-mix(in srgb,var(--lens-ink) 28%,transparent);pointer-events:auto;animation:rise .3s ease both}
.legend header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.legend strong{font:800 13px var(--lens-display);letter-spacing:-.01em}
.legend small{display:block;color:var(--lens-muted);font:500 11px var(--lens-mono)}
.legend ol{display:grid;gap:4px;margin:0;padding:0;list-style:none}
.legend li button{display:grid;grid-template-columns:24px 1fr;gap:8px;align-items:start;width:100%;min-height:44px;padding:8px;border:0;border-radius:10px;background:transparent;color:var(--lens-ink);text-align:left;cursor:pointer;font:500 12px/1.35 var(--lens-font)}
.legend li button:hover,.legend li button:focus-visible{background:var(--lens-surface-2)}
.legend li b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--tag);color:var(--lens-accent-ink);font-size:11px}
.legend li em{display:block;color:var(--lens-muted);font:600 10px var(--lens-mono);font-style:normal;text-transform:uppercase;letter-spacing:.06em}
.close{display:grid;place-items:center;min-width:44px;min-height:44px;border:1px solid var(--lens-line);border-radius:12px;background:transparent;color:var(--lens-ink);cursor:pointer;font:600 12px var(--lens-font)}
.scrim{position:fixed;inset:0;display:grid;place-items:center;padding:16px;background:color-mix(in srgb,var(--lens-ink) 55%,transparent);pointer-events:auto;animation:fade .18s ease both}
.card{width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:24px;border-radius:20px;background:var(--lens-surface);color:var(--lens-ink);box-shadow:0 30px 90px color-mix(in srgb,var(--lens-ink) 40%,transparent);animation:rise .25s ease both}
.card .top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.tag{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:color-mix(in srgb,var(--tag) 14%,var(--lens-surface));color:var(--lens-ink);font:700 11px var(--lens-mono);text-transform:uppercase;letter-spacing:.08em}
.tag::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--tag)}
.card h2{margin:16px 0 14px;font:800 26px/1.08 var(--lens-display);letter-spacing:-.035em}
.card dl{display:grid;grid-template-columns:150px 1fr;margin:0;border-top:1px solid var(--lens-line)}
.card dt,.card dd{margin:0;padding:12px 0;border-bottom:1px solid var(--lens-line);font:500 13px/1.5 var(--lens-font)}
.card dt{color:var(--lens-muted);font-weight:700}
.card footer{display:flex;justify-content:space-between;gap:8px;margin-top:16px}
.card footer button{min-height:44px;padding:0 14px;border:1px solid var(--lens-line);border-radius:12px;background:transparent;color:var(--lens-ink);cursor:pointer;font:600 12px var(--lens-font)}
@media(max-width:640px){.card dl{grid-template-columns:1fr}.card dt{padding-bottom:0;border:0}}
@keyframes fade{from{opacity:0}}@keyframes rise{from{opacity:0;transform:translateY(12px)}}
@keyframes pop{0%{opacity:0;transform:scale(.4)}70%{transform:scale(1.12)}100%{opacity:1;transform:none}}
@keyframes ring{0%{transform:scale(.9);opacity:.8}100%{transform:scale(1.8);opacity:0}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`;

/**
 * <im-decision-lens> — framework-agnostic Decision Lens. Press D (or dispatch im:lens-toggle)
 * to pin numbered hotspots onto the anchors authored in decisions/<screen>.json.
 */
export class DecisionLens extends HTMLElement {
  private root: ShadowRoot;
  private open = false;
  private decisions: Decision[] = [];
  private screen: ScreenRoute | undefined;
  private active: number | null = null;
  private frame = 0;
  private observer: MutationObserver | null = null;
  private returnFocus: HTMLElement | null = null;
  private loadToken = 0;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('im:lens-toggle', this.onToggle);
    window.addEventListener('popstate', this.onUrl);
    window.addEventListener('im:urlchange', this.onUrl);
    window.addEventListener('scroll', this.schedule, true);
    window.addEventListener('resize', this.schedule);
    if (new URLSearchParams(location.search).get('lens') === 'on') void this.toggle(true);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('im:lens-toggle', this.onToggle);
    window.removeEventListener('popstate', this.onUrl);
    window.removeEventListener('im:urlchange', this.onUrl);
    window.removeEventListener('scroll', this.schedule, true);
    window.removeEventListener('resize', this.schedule);
    this.observer?.disconnect();
  }

  get isOpen() {
    return this.open;
  }

  /** Test hook: which anchors resolve in the current DOM. */
  async resolution(): Promise<AnchorResolution[]> {
    if (!this.decisions.length) await this.load();
    return this.decisions.map((decision) => {
      const element = document.querySelector(decision.anchor);
      const rect = element?.getBoundingClientRect();
      return { id: decision.id, anchor: decision.anchor, resolved: Boolean(element), visible: Boolean(rect && rect.width > 0 && rect.height > 0) };
    });
  }

  get screenId() {
    return this.screen?.id ?? this.getAttribute('screen') ?? '';
  }

  async toggle(force?: boolean) {
    const next = force ?? !this.open;
    if (next === this.open) return;
    this.open = next;
    document.documentElement.dataset.lens = next ? 'on' : 'off';
    window.dispatchEvent(new CustomEvent('im:lens-change', { detail: { open: next } }));
    if (next) {
      await this.load();
      this.observer = new MutationObserver(this.schedule);
      this.observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'open', 'style'] });
    } else {
      this.observer?.disconnect();
      this.active = null;
    }
    this.render();
  }

  private async load() {
    const token = ++this.loadToken;
    const override = this.getAttribute('screen');
    this.screen = override ? { id: override, area: 'overview', label: override, href: location.pathname, zone: 'shell' } : resolveScreen(location.pathname, location.search);
    const decisions = this.screen ? await loadDecisions(this.screen.id) : [];
    if (token === this.loadToken) this.decisions = decisions;
  }

  private onToggle = () => void this.toggle();

  private onUrl = () => {
    if (!this.open) return;
    void this.load().then(() => this.render());
  };

  private onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.active !== null) {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.closeCard();
      return;
    }
    if (event.key.toLowerCase() !== 'd' || event.metaKey || event.ctrlKey || event.altKey || eventIsTyping(event)) return;
    event.preventDefault();
    void this.toggle();
  };

  private schedule = () => {
    if (!this.open || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.position();
    });
  };

  private openCard(index: number) {
    this.returnFocus = (this.root.activeElement as HTMLElement | null) ?? null;
    this.active = index;
    const anchor = this.decisions[index] ? document.querySelector(this.decisions[index]!.anchor) : null;
    anchor?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    this.render();
    (this.root.querySelector('.card .close') as HTMLElement | null)?.focus();
  }

  private closeCard() {
    const index = this.active;
    this.active = null;
    this.render();
    const target = index !== null ? this.root.querySelector<HTMLElement>(`[data-index="${index}"]`) : null;
    (target ?? this.returnFocus)?.focus();
  }

  private render() {
    if (!this.open) {
      this.root.innerHTML = '';
      return;
    }
    const items = this.decisions
      .map((item, index) => `<li><button type="button" data-index="${index}" style="--tag:${tagColor[item.tag]}"><b>${index + 1}</b><span><em>${escapeHtml(item.tag)}</em>${escapeHtml(item.decision)}</span></button></li>`)
      .join('');
    const hotspots = this.decisions
      .map((item, index) => `<button type="button" class="hotspot" data-hotspot="${escapeHtml(item.id)}" data-index="${index}" style="--tag:${tagColor[item.tag]};--i:${index}" aria-label="Decision ${index + 1}: ${escapeHtml(item.decision)}" hidden>${index + 1}</button>`)
      .join('');
    const active = this.active !== null ? this.decisions[this.active] : undefined;
    const card = active
      ? `<div class="scrim" data-scrim><section class="card" role="dialog" aria-modal="true" aria-labelledby="lens-title" style="--tag:${tagColor[active.tag]}">
          <div class="top"><span class="tag">${escapeHtml(active.tag)}</span><button type="button" class="close" aria-label="Close decision">Close</button></div>
          <h2 id="lens-title">${escapeHtml(active.decision)}</h2>
          <dl><dt>Decision</dt><dd>${escapeHtml(active.decision)}</dd><dt>Why</dt><dd>${escapeHtml(active.why)}</dd><dt>Alternative considered</dt><dd>${escapeHtml(active.alternative)}</dd><dt>Value</dt><dd>${escapeHtml(active.value)}</dd></dl>
          <footer><button type="button" data-step="-1">← Previous</button><button type="button" data-step="1">Next →</button></footer>
        </section></div>`
      : '';
    this.root.innerHTML = `<style>${styles}</style><div class="layer" aria-label="Decision lens">
      <div class="tint"></div><div class="outline"></div>${hotspots}
      <aside class="legend" aria-label="Decisions on this screen"><header><div><strong>Decision lens · ${this.decisions.length}</strong><small>${escapeHtml(this.screen?.label ?? 'This screen')} · press D to hide</small></div><button type="button" class="close" data-hide>Hide</button></header><ol>${items}</ol></aside>
      ${card}</div>`;
    this.root.querySelectorAll<HTMLButtonElement>('[data-index]').forEach((button) => {
      const index = Number(button.dataset.index);
      button.addEventListener('click', () => this.openCard(index));
      button.addEventListener('mouseenter', () => this.highlight(index));
      button.addEventListener('mouseleave', () => this.highlight(null));
      button.addEventListener('focus', () => this.highlight(index));
      button.addEventListener('blur', () => this.highlight(null));
    });
    this.root.querySelector('[data-hide]')?.addEventListener('click', () => void this.toggle(false));
    this.root.querySelector('.card .close')?.addEventListener('click', () => this.closeCard());
    this.root.querySelector('[data-scrim]')?.addEventListener('mousedown', (event) => {
      if (event.target === event.currentTarget) this.closeCard();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((button) =>
      button.addEventListener('click', () => {
        const count = this.decisions.length;
        this.active = ((this.active ?? 0) + Number(button.dataset.step) + count) % count;
        this.render();
        (this.root.querySelector('.card .close') as HTMLElement | null)?.focus();
      })
    );
    this.position();
  }

  private highlight(index: number | null) {
    const outline = this.root.querySelector<HTMLElement>('.outline');
    if (!outline) return;
    const element = index !== null && this.decisions[index] ? document.querySelector(this.decisions[index]!.anchor) : null;
    if (!element) {
      outline.classList.remove('on');
      return;
    }
    const rect = element.getBoundingClientRect();
    Object.assign(outline.style, { left: `${rect.left - 4}px`, top: `${rect.top - 4}px`, width: `${rect.width + 8}px`, height: `${rect.height + 8}px` });
    outline.classList.add('on');
  }

  private position() {
    const placed: Array<[number, number]> = [];
    this.root.querySelectorAll<HTMLElement>('.hotspot').forEach((hotspot) => {
      const decision = this.decisions[Number(hotspot.dataset.index)];
      const element = decision ? document.querySelector(decision.anchor) : null;
      const rect = element?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) {
        hotspot.hidden = true;
        return;
      }
      let x = Math.min(Math.max(rect.left + 18, 20), innerWidth - 20);
      let y = Math.min(Math.max(rect.top + 18, 20), innerHeight - 20);
      // Nudge hotspots that would overlap so every number stays clickable.
      while (placed.some(([px, py]) => Math.abs(px - x) < 34 && Math.abs(py - y) < 34)) x += 36;
      placed.push([x, y]);
      hotspot.style.left = `${x}px`;
      hotspot.style.top = `${y}px`;
      hotspot.hidden = false;
    });
  }
}
