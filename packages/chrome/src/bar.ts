import { escapeHtml } from './shared';

// The bar inherits the zone's theme tokens, so it reads as native chrome in every design language.
const styles = `
:host{display:block;position:sticky;top:0;z-index:1000}
.bar{display:flex;align-items:center;gap:20px;height:48px;padding:0 20px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--ground) 88%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:var(--ink);font:500 13px var(--font-ui)}
a{color:inherit;text-decoration:none}
.id{display:flex;align-items:center;gap:9px;font-weight:700;letter-spacing:-.01em;white-space:nowrap}
.mono{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--ink);color:var(--ground);font:800 11px var(--font-ui);letter-spacing:-.04em}
nav{display:flex;gap:18px;color:var(--muted)}
nav a{display:inline-flex;align-items:center;min-height:44px}
nav a:hover,nav a[aria-current='page']{color:var(--ink)}
.context{padding:4px 9px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font:600 11px var(--font-mono);white-space:nowrap}
.actions{display:flex;align-items:center;gap:8px;margin-left:auto}
.open{display:flex;align-items:center;gap:7px;color:var(--muted);font-size:12px;white-space:nowrap}
.open i{width:7px;height:7px;border-radius:50%;background:var(--success);box-shadow:0 0 0 4px color-mix(in srgb,var(--success) 18%,transparent);animation:breathe 2.4s ease-in-out infinite}
button{display:inline-flex;align-items:center;gap:8px;min-height:44px;min-width:44px;justify-content:center;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);cursor:pointer;font:600 12px var(--font-ui)}
button[aria-pressed='true']{background:var(--ink);border-color:var(--ink);color:var(--ground)}
kbd{padding:1px 5px;border:1px solid currentColor;border-radius:4px;font:600 10px var(--font-mono);opacity:.75}
:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 65%,var(--ink));outline-offset:2px}
@keyframes breathe{50%{transform:scale(1.25);opacity:.7}}
@media(max-width:900px){nav,.open{display:none}.context{display:none}}
@media(max-width:520px){.id span:last-child{display:none}.bar{gap:10px;padding:0 12px}kbd{display:none}}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
`;

const links: Array<[string, string]> = [
  ['Work', '/work'],
  ['Systems', '/system-design/mare'],
  ['Design languages', '/work/mare/languages']
];

/** <im-portfolio-bar context="Maré Ops · Balcão"> — the same top nav in Next, Vite, Astro and SvelteKit. */
export class PortfolioBar extends HTMLElement {
  static observedAttributes = ['context'];
  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    window.addEventListener('im:lens-change', this.onLens);
  }

  disconnectedCallback() {
    window.removeEventListener('im:lens-change', this.onLens);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  private onLens = (event: Event) => {
    const open = (event as CustomEvent<{ open: boolean }>).detail.open;
    this.root.querySelector('[data-lens]')?.setAttribute('aria-pressed', String(open));
  };

  private render() {
    const context = this.getAttribute('context');
    const lensOpen = document.documentElement.dataset.lens === 'on';
    this.root.innerHTML = `<style>${styles}</style><header class="bar">
      <a class="id" href="/" aria-label="Ian Miyazato — portfolio home"><span class="mono">IM</span><span>Ian Miyazato</span></a>
      <nav aria-label="Portfolio">${links.map(([label, href]) => `<a href="${href}" ${location.pathname === href ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
      ${context ? `<span class="context">${escapeHtml(context)}</span>` : ''}
      <div class="actions"><span class="open"><i></i>Open to roles</span>
        <button type="button" data-palette aria-label="Open command palette"><kbd>⌘K</kbd></button>
        <button type="button" data-lens aria-pressed="${lensOpen}">Show decisions <kbd>D</kbd></button></div></header>`;
    this.root.querySelector('[data-palette]')!.addEventListener('click', () => window.dispatchEvent(new CustomEvent('im:palette-open')));
    this.root.querySelector('[data-lens]')!.addEventListener('click', () => window.dispatchEvent(new CustomEvent('im:lens-toggle')));
  }
}
