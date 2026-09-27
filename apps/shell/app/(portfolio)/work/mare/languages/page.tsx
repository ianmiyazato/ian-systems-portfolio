import type { Metadata } from 'next';
import '@portfolio/tokens/fonts/counter';
import '@portfolio/tokens/fonts/product-hub';
import '@portfolio/tokens/fonts/pay';
import '@portfolio/tokens/fonts/circle';
import '@portfolio/tokens/fonts/mesh';
import { themes } from '@portfolio/tokens';
import { ZLink } from '@/components/zone-link';

export const metadata: Metadata = { title: 'Five design languages', description: 'Five Maré systems, five users, five design languages on one token contract.' };

const systems = [
  { theme: 'counter', name: 'Counter', user: 'Store staff, standing, mid-conversation', word: 'Pronto!', motion: 'Snappy pops · scan line · progress ring', density: 'Low · 56 px targets · one action per card', why: 'A tablet at a busy counter needs big, obvious next steps.', href: '/mare/ops/counter' },
  { theme: 'product-hub', name: 'Product Hub', user: 'HQ merchandisers at a desk', word: 'Margin 42%', motion: 'Almost none · charts draw once', density: 'High · 13 px tables · hairlines', why: 'Comparing hundreds of SKUs rewards density and stillness.', href: '/mare/ops/product-hub' },
  { theme: 'pay', name: 'Pay', user: 'Credit analysts making careful calls', word: '588', motion: 'Slow sweeps · card float · shine', density: 'Medium · soft 16 px cards', why: 'Credit decisions should feel calm, deliberate and explainable.', href: '/mare/ops/pay' },
  { theme: 'circle', name: 'Circle', user: 'Partnership managers and creators', word: 'Oba!', motion: 'Bouncy · wiggling stickers', density: 'Medium · 24 px radii · pills', why: 'A creator program should feel like the creators it serves.', href: '/mare/ops/circle' },
  { theme: 'mesh', name: 'Mesh', user: 'Integration engineers on call', word: 'half-open', motion: 'Packets on paths · streaming logs · no bounce', density: 'High · lowercase mono', why: 'An incident console must be dense, dark and literal.', href: '/mare/ops/mesh' }
] as const;

const shared = [
  ['One token contract', 'ground, surface, ink, accent, risk, success, ai: every theme maps the same semantic names, so components and contrast tests are shared.'],
  ['One overlay stack', 'URL-addressable modals, sheets, drawers and sub-layers with the same Esc and focus rules in every system.'],
  ['One event contract', 'canonical.order.v4 and friends: systems disagree on pixels, never on what an order is.'],
  ['One identity and chrome', 'The same portfolio bar, ⌘K and Decision Lens across Next, Vite, Astro and SvelteKit.'],
  ['One AI surface', 'Sparkle, "Simulated AI", sources and an explicit approval, re-skinned only by radius and type.']
];

export default function Languages() {
  return (
    <main className="langs">
      <header className="langs-head" data-anchor="langs-head">
        <span className="eyebrow">Maré · design system</span>
        <h1>Five systems, five users, five design languages.</h1>
        <p>Each Maré team designs for a different person in a different posture. They share a token contract, behaviour and trust patterns, not a look.</p>
      </header>
      <div className="lang-board" data-anchor="lang-board">
        {systems.map((system) => {
          const color = themes[system.theme].color as Record<string, string>;
          const swatches = ['ground', 'ink', 'accent', 'risk', 'success', 'ai'].map((key) => [key, color[key]!]);
          return (
            <article key={system.theme} className={`lang-card lang-${system.theme}`} data-theme={system.theme}>
              <header><h2>{system.name}</h2><span>{system.user}</span></header>
              <p className="lang-word" aria-label={`Sample word: ${system.word}`}>{system.word}</p>
              <ul className="lang-swatches" aria-label={`${system.name} palette`}>
                {swatches.map(([key, hex]) => <li key={key} style={{ background: hex }} title={`${key} ${hex}`}><span className="visually-hidden">{key} {hex}</span></li>)}
              </ul>
              <dl>
                <div><dt>Type</dt><dd>{themes[system.theme].font.display.split(',')[0]!.replace(/'/g, '').replace(' Variable', '')}</dd></div>
                <div><dt>Motion</dt><dd>{system.motion}</dd></div>
                <div><dt>Density</dt><dd>{system.density}</dd></div>
                <div><dt>Why</dt><dd>{system.why}</dd></div>
              </dl>
              <ZLink className="lang-open" href={system.href}>Open {system.name} →</ZLink>
            </article>
          );
        })}
      </div>

      <section className="langs-shared" aria-labelledby="shared-title" data-anchor="langs-shared">
        <header className="section-head"><span>What stays the same everywhere</span><h2 id="shared-title">Different surfaces, shared foundations.</h2></header>
        <ol>{shared.map(([title, copy]) => <li key={title}><strong>{title}</strong><p>{copy}</p></li>)}</ol>
      </section>

      <section className="langs-ai" aria-labelledby="ai-demo-title" data-anchor="langs-ai-demo">
        <header className="section-head"><span>Live demo</span><h2 id="ai-demo-title">The shared AI surface, re-skinned in all five themes.</h2></header>
        <div className="ai-row">
          {systems.map((system) => (
            <div key={system.theme} data-theme={system.theme} className="ai-cell">
              <span className="ai-cell-label">{system.name}</span>
              <section className="ai-surface" aria-label={`Simulated AI in ${system.name}`}>
                <header className="ai-head"><span className="ai-spark" aria-hidden="true" /><span className="ai-badge">Simulated AI</span></header>
                <h3 className="ai-title">Proposal ready</h3>
                <p className="ai-body">Grounded in 3 sources. Nothing changes until you approve.</p>
                <ul className="ai-sources"><li className="ai-source">policy <b>0.91</b></li><li className="ai-source">events <b>0.88</b></li></ul>
                <div className="ai-actions"><button type="button" className="ai-approve">Approve</button><button type="button" className="ai-explain">Why?</button></div>
              </section>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
