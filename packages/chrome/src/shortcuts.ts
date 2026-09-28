import { chromeVars, escapeHtml, eventIsTyping } from './shared';

/**
 * <im-shortcuts> — power-user keys for every system, in every stack. It works from DOM conventions,
 * so a screen opts in with attributes instead of code:
 *   [data-nav-row]            j / k move between rows (focus lands on the row's [data-nav-open] or first link)
 *   [data-shortcut-search]    / focuses it
 *   nav[data-shortcut-nav]    g then a letter switches to that view (letters derived from the labels)
 *   [data-shortcut=approve]   a clicks it, [data-shortcut=reject] x clicks it (in the open dialog first)
 * ? opens this sheet; D (Decision Lens) and ⌘K (palette) keep working as before.
 */
const styles = `
:host{${chromeVars}}
.scrim{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;padding:16px;background:color-mix(in srgb,var(--lens-ink) 50%,transparent);font-family:var(--lens-font)}
.panel{width:min(640px,100%);max-height:84vh;overflow:auto;padding:20px 22px;border:1px solid var(--lens-line);border-radius:18px;background:var(--lens-surface);color:var(--lens-ink);box-shadow:0 30px 90px color-mix(in srgb,var(--lens-ink) 40%,transparent)}
header{display:flex;justify-content:space-between;align-items:center;gap:12px}
h2{margin:0;font:700 20px var(--lens-display)}
h3{margin:16px 0 6px;color:var(--lens-muted);font:700 10px var(--lens-mono);text-transform:uppercase;letter-spacing:.1em}
dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0;font-size:14px}
dt{display:flex;gap:4px}
kbd{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border:1px solid var(--lens-line);border-bottom-width:2px;border-radius:6px;background:var(--lens-surface-2);font:600 12px var(--lens-mono)}
dd{margin:0;align-self:center}
dd.off{color:var(--lens-muted)}
button{min-width:44px;min-height:44px;border:1px solid var(--lens-line);border-radius:999px;background:var(--lens-surface);color:var(--lens-ink);font:600 18px var(--lens-font);cursor:pointer}
.hint{position:fixed;left:16px;bottom:16px;z-index:2147482000;padding:8px 12px;border-radius:10px;background:var(--lens-ink);color:var(--lens-surface);font:600 12px var(--lens-mono)}
`;

type View = { letter: string; label: string; href: string; link: HTMLAnchorElement };

const visible = (element: HTMLElement) => element.offsetParent !== null || element.getClientRects().length > 0;

/** The top-most open dialog outside chrome, if any: a/x act inside it first. */
function topDialog(): HTMLElement | null {
  const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')].filter(visible);
  return dialogs.at(-1) ?? null;
}

/** Views from the product nav, each with a unique letter taken from its label. */
export function viewsOf(nav: Element | null): View[] {
  if (!nav) return [];
  const taken = new Set<string>();
  return [...nav.querySelectorAll<HTMLAnchorElement>('a[href]')].flatMap((link) => {
    const label = (link.textContent ?? '').replace(/\s+/g, ' ').trim();
    const letter = [...label.toLowerCase()].find((char) => /[a-z]/.test(char) && !taken.has(char));
    if (!letter) return [];
    taken.add(letter);
    return [{ letter, label, href: link.getAttribute('href')!, link }];
  });
}

export class Shortcuts extends HTMLElement {
  private root = this.attachShadow({ mode: 'open' });
  private open = false;
  private pendingG = 0;

  connectedCallback() {
    window.addEventListener('keydown', this.onKey);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.onKey);
  }

  private nav() {
    return document.querySelector('nav[data-shortcut-nav]');
  }

  private rows() {
    return [...document.querySelectorAll<HTMLElement>('[data-nav-row]')].filter(visible);
  }

  private moveRow(step: number) {
    const rows = this.rows();
    if (!rows.length) return;
    const current = rows.findIndex((row) => row.contains(document.activeElement));
    const next = rows[current < 0 ? (step > 0 ? 0 : rows.length - 1) : Math.max(0, Math.min(rows.length - 1, current + step))]!;
    const target = next.querySelector<HTMLElement>('[data-nav-open]') ?? next.querySelector<HTMLElement>('a[href], button:not(:disabled)') ?? next;
    if (target === next && !next.hasAttribute('tabindex')) next.tabIndex = -1;
    target.focus();
    target.scrollIntoView({ block: 'nearest' });
  }

  private act(kind: 'approve' | 'reject') {
    const scope: ParentNode = topDialog() ?? document.activeElement?.closest('[data-nav-row]') ?? document;
    const button = [...scope.querySelectorAll<HTMLButtonElement>(`[data-shortcut="${kind}"]`)].find((item) => visible(item) && !item.disabled);
    if (button) { button.click(); return true; }
    return false;
  }

  private hint(text: string | null) {
    this.root.querySelector('.hint')?.remove();
    if (!text) return;
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.setAttribute('role', 'status');
    hint.textContent = text;
    this.root.append(hint);
  }

  private onKey = (event: KeyboardEvent) => {
    if (this.open && event.key === 'Escape') { event.preventDefault(); this.toggle(false); return; }
    if (event.metaKey || event.ctrlKey || event.altKey || eventIsTyping(event)) return;
    if (event.key === '?') { event.preventDefault(); this.toggle(!this.open); return; }
    if (this.open) return;

    if (this.pendingG) {
      window.clearTimeout(this.pendingG);
      this.pendingG = 0;
      this.hint(null);
      const view = viewsOf(this.nav()).find((item) => item.letter === event.key.toLowerCase());
      if (view) { event.preventDefault(); view.link.click(); }
      return;
    }
    if (topDialog() && event.key !== 'a' && event.key !== 'x') return;
    switch (event.key) {
      case 'j': event.preventDefault(); this.moveRow(1); break;
      case 'k': event.preventDefault(); this.moveRow(-1); break;
      case '/': {
        const search = document.querySelector<HTMLElement>('[data-shortcut-search], [role="search"] input, input[type="search"]');
        if (search) { event.preventDefault(); search.focus(); }
        break;
      }
      case 'g':
        if (!this.nav()) return;
        event.preventDefault();
        this.hint(`g · ${viewsOf(this.nav()).map((view) => `${view.letter} ${view.label}`).join(' · ')}`);
        this.pendingG = window.setTimeout(() => { this.pendingG = 0; this.hint(null); }, 1500);
        break;
      case 'a': if (this.act('approve')) event.preventDefault(); break;
      case 'x': if (this.act('reject')) event.preventDefault(); break;
    }
  };

  toggle(next: boolean) {
    this.open = next;
    if (!next) { this.root.querySelector('.scrim')?.remove(); return; }
    const views = viewsOf(this.nav());
    const rows = this.rows().length;
    const approve = document.querySelector('[data-shortcut="approve"]') !== null;
    const reject = document.querySelector('[data-shortcut="reject"]') !== null;
    const search = document.querySelector('[data-shortcut-search], [role="search"] input, input[type="search"]') !== null;
    const line = (keys: string[], text: string, on = true) => `<dt>${keys.map((key) => `<kbd>${escapeHtml(key)}</kbd>`).join('')}</dt><dd class="${on ? '' : 'off'}">${escapeHtml(text)}${on ? '' : ' · not on this screen'}</dd>`;
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.innerHTML = `<section class="panel" role="dialog" aria-modal="true" aria-labelledby="sc-title">
      <header><h2 id="sc-title">Keyboard shortcuts</h2><button type="button" data-close aria-label="Close shortcuts">×</button></header>
      <h3>Everywhere</h3><dl>${line(['?'], 'Show these shortcuts')}${line(['⌘', 'K'], 'Command palette: screens, actions, chaos, world clock')}${line(['D'], 'Decision Lens')}</dl>
      <h3>Lists</h3><dl>${line(['j'], 'Next row', rows > 0)}${line(['k'], 'Previous row', rows > 0)}${line(['Enter'], 'Open the focused row', rows > 0)}${line(['/'], 'Search', search)}</dl>
      <h3>Views</h3><dl>${views.length ? views.map((view) => line(['g', view.letter], view.label)).join('') : line(['g'], 'Switch views', false)}</dl>
      <h3>Actions</h3><dl>${line(['a'], 'Approve (only where it is safe to)', approve)}${line(['x'], 'Reject', reject)}</dl>
    </section>`;
    scrim.addEventListener('click', (event) => { if (event.target === scrim || (event.target as HTMLElement).closest('[data-close]')) this.toggle(false); });
    this.root.innerHTML = `<style>${styles}</style>`;
    this.root.append(scrim);
    this.root.querySelector<HTMLElement>('[data-close]')?.focus();
  }
}
