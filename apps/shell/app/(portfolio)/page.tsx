import { ZLink as Link } from '@/components/zone-link';

const metrics = [
  'API latency 450 → ~200 ms', 'Error rate 1.8% → 0.5–0.7%', 'Uptime 99.5 → 99.9%', 'Batch runtime 60–90 → 5–15 min',
  'Deploys 2 → 8–12 per week', 'Recovery time (MTTR) 2–3 h → 30–45 min', 'Catalog reads 3–5× faster', 'Dashboard load 2.8 s → 1.2 s',
  'Feature adoption +30–40%', 'Analytics queries 5–10× faster', 'Availability 99.8%'
];

const principles = [
  ['01', 'Make the system legible', 'Freshness, ownership, fallbacks and the cost of a decision belong on the screen, not in a runbook.'],
  ['02', 'Design for failure first', 'Offline queues, circuit breakers and replay tools are part of the primary UX, because they are part of the primary day.'],
  ['03', 'Earn automation', 'AI proposes with sources and guardrails. People approve the consequential step until the evidence says otherwise.']
];

const rows = [
  ['Turn ambiguity into a product', 'Decision maps, prototypes, thin vertical slices', 'Maré, Atlas, Pulse', '/work'],
  ['Build the hard platform layer', 'Events, reliability, integrations, data contracts', 'Maré Integration Mesh', '/mare/ops/mesh'],
  ['Ship an interface people trust', 'Dense operations UI and explainable automation', 'Counter · Pay · Product Hub', '/mare/ops/pay/applications/AP-77118'],
  ['Raise the learning rate', 'Instrumentation, eval gates, scenario replay', 'Pulse AI harness', '/pulse/harness']
];

export default function Home() {
  return (
    <main className="home">
      <section className="home-hero" data-anchor="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow">Backend depth · product judgment · frontend craft</span>
          <h1>
            <span>I build the core platform</span> <em>and the product people touch</em> <span>on top of it.</span>
          </h1>
          <p>Systems work is product work. The best architecture makes the next human decision faster, safer and easier to explain. Every screen here shows why it was built that way: press <kbd>D</kbd>.</p>
          <div className="home-actions">
            <Link className="btn primary" href="/work">Explore the work</Link>
            <Link className="btn" href="/system-design">See the system design</Link>
          </div>
        </div>
        <div className="home-orbit" aria-hidden="true">
          <span className="ring r1" /><span className="ring r2" /><span className="ring r3" />
          <div className="core">event<br />core</div>
          <span className="sat s1">UI</span><span className="sat s2">data</span><span className="sat s3">AI</span><span className="sat s4">ops</span>
        </div>
      </section>

      <div className="marquee" data-anchor="home-marquee" aria-label="Measured outcomes from past systems">
        <div className="marquee-track">
          {[...metrics, ...metrics].map((metric, index) => <span key={index} aria-hidden={index >= metrics.length}>{metric}</span>)}
        </div>
      </div>

      <section className="home-projects" aria-labelledby="projects-title" data-anchor="home-projects">
        <header className="section-head"><span>Selected systems</span><h2 id="projects-title">Three products. Three operating models. One decision lens.</h2></header>
        <div className="project-grid">
          <Link className="project mare" href="/work/mare">
            <div className="preview topology" aria-hidden="true">
              <svg viewBox="0 0 320 200">
                {['M40,50 C120,50 120,100 160,100', 'M40,100 H160', 'M40,150 C120,150 120,100 160,100', 'M160,100 C210,100 220,40 280,40', 'M160,100 H280', 'M160,100 C210,100 220,160 280,160'].map((d, index) => (
                  <g key={d}><path d={d} className={index === 5 ? 'warn' : ''} /><circle r="4" style={{ offsetPath: `path('${d}')`, animationDelay: `${index * -0.45}s` }} className={index === 5 ? 'warn' : ''} /></g>
                ))}
                {[[40, 50], [40, 100], [40, 150], [280, 40], [280, 100], [280, 160]].map(([x, y]) => <rect key={`${x}-${y}`} x={x! - 14} y={y! - 10} width="28" height="20" rx="5" />)}
                <rect className="core" x="140" y="84" width="40" height="32" rx="7" />
              </svg>
            </div>
            <div className="project-copy"><span className="eyebrow">Retail platform</span><h3>Maré</h3><p>Five teams keep five design languages while sharing contracts, events and one AI trust pattern.</p><b>Open case study →</b></div>
          </Link>
          <Link className="project atlas" href="/work/atlas">
            <div className="preview funnel" aria-hidden="true">
              {[['Applied', 48], ['Screen', 21], ['Onsite', 7], ['Offer', 2]].map(([label, value], index) => (
                <div key={label} style={{ '--w': `${100 - index * 22}%`, '--i': index } as React.CSSProperties}><span>{label}</span><b>{value}</b></div>
              ))}
            </div>
            <div className="project-copy"><span className="eyebrow">Careers platform</span><h3>Atlas</h3><p>Practice signals flow into a career pipeline without turning people into a single score.</p><b>Open case study →</b></div>
          </Link>
          <Link className="project pulse" href="/work/pulse">
            <div className="preview equalizer" aria-hidden="true">
              {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} />)}
            </div>
            <div className="project-copy"><span className="eyebrow">Entertainment concept</span><h3>Pulse</h3><p>Market intelligence, distribution and model evaluation share one evidence trail across LA, Seoul and Tokyo.</p><b>Open case study →</b></div>
          </Link>
        </div>
      </section>

      <section className="home-principles" aria-labelledby="principles-title" data-anchor="home-principles">
        <header className="section-head"><span>How I decide</span><h2 id="principles-title">Three rules that show up on every screen.</h2></header>
        <div className="principles">
          {principles.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="home-table" aria-labelledby="table-title" data-anchor="home-table">
        <header className="section-head"><span>Operating range</span><h2 id="table-title">What a founding engineer needs, and where I&apos;ve done it</h2></header>
        <div className="range" role="table" aria-label="Founding engineer needs">
          <div className="range-row head" role="row"><span role="columnheader">Need</span><span role="columnheader">How</span><span role="columnheader">Where to see it</span></div>
          {rows.map(([need, how, where, href]) => (
            <div className="range-row" role="row" key={need}><strong role="cell">{need}</strong><span role="cell">{how}</span><span role="cell"><Link href={href!}>{where} →</Link></span></div>
          ))}
        </div>
      </section>
    </main>
  );
}
