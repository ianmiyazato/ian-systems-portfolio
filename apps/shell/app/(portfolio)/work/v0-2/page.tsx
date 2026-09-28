import type { Metadata } from 'next';
import { ZLink } from '@/components/zone-link';

export const metadata: Metadata = {
  title: 'v0.2 improvement map',
  description: 'Twelve product, design and engineering changes that make the systems portfolio live, deep and operational.'
};

type Improvement = {
  title: string;
  changed: string;
  value: string;
  href: string;
  link: string;
  tags: Array<'Design' | 'UX' | 'Architecture' | 'Engineering' | 'Cost'>;
  anchor?: string;
};

const improvements: Improvement[] = [
  { title: 'Every nav item is a real screen', changed: 'A typed router, permanent legacy redirects and a crawler now cover every route and nav item—including the 12 views that failed in v0.1.', value: 'A reviewer can explore freely without finding a blank or silently wrong screen.', href: '/mare/ops/pay/disputes', link: 'Open a formerly broken view', tags: ['UX', 'Engineering'] },
  { title: 'A living world, simulated in the browser', changed: 'One seeded world clock drives arrivals, KPIs, freshness, countdowns, incidents and cross-zone consequences at $0.', value: 'The portfolio behaves like one company instead of a collection of static mockups.', href: '/mare/ops/counter', link: 'Watch Counter live', tags: ['UX', 'Architecture', 'Cost'], anchor: 'map-live' },
  { title: 'The full request path', changed: 'Clients, gateways, BFFs, middleware, service-owned databases, Kafka, queues, partner adapters and OpenTelemetry share one interactive path.', value: 'Platform judgment is visible at every hop, including data ownership and failure modes.', href: '/system-design/mare/request-path', link: 'Follow a packet', tags: ['Architecture', 'Engineering'], anchor: 'map-architecture' },
  { title: 'Observability as a product', changed: 'Tidewatch turns the world’s OpenTelemetry-shaped data into problems, service flow, golden signals, traces, logs and SLOs.', value: 'Reviewers can investigate cause and effect instead of reading an architecture claim.', href: '/observability', link: 'Open Tidewatch', tags: ['Design', 'Architecture'] },
  { title: 'Chaos scenarios with one switch', changed: 'Carrier, database, topic, e-invoice and traffic faults propagate consistently through Counter, Pay, Mesh and Tidewatch.', value: 'Resilience becomes a demoable product behavior, including recovery.', href: '/system-design/mare/request-path', link: 'Replay an incident', tags: ['UX', 'Engineering'] },
  { title: 'Patterns people already know', changed: 'Stories, hover-expand rows, private balances, live ETA, mixes, wrapped recaps, wallets, seasons and dispatch reuse familiar interaction models in each product’s own identity.', value: 'Consumer fluency is obvious without copying another company’s brand.', href: '/atlas/arena/mix/today', link: 'Play Practice Mix', tags: ['Design', 'UX'], anchor: 'map-patterns' },
  { title: 'One motion system, five personalities', changed: 'Shared duration and easing tokens let Counter snap, Pay sweep, Circle bounce, Mesh slide, Atlas spring and Pulse pulse—with reduced motion guaranteed.', value: 'Motion explains state while every system still feels distinct and accessible.', href: '/work/mare/languages', link: 'Compare the languages', tags: ['Design', 'Engineering'] },
  { title: 'Power-user speed', changed: 'Keyboard navigation, executable command-palette actions, bulk selection, saved views, density controls and optimistic undo are shared across ops tools.', value: 'The tools feel built for people who operate them all day.', href: '/mare/ops/product-hub', link: 'Use the catalog workspace', tags: ['UX', 'Engineering'] },
  { title: 'AI you can audit', changed: 'Every AI card exposes sources, scores, tool latency, model route, eval, tokens, cost and the later outcome of human approvals.', value: 'AI is reviewable product infrastructure, not decorative copy.', href: '/observability/ai-audit', link: 'Inspect the audit', tags: ['UX', 'Architecture'] },
  { title: 'Contracts that cannot break', changed: 'Versioned JSON schemas, compatibility rules and consumer-declared reads power both CI and Mesh’s real contract diff.', value: 'A breaking field names the consumers it would hurt before it ships.', href: '/mare/ops/mesh/contracts', link: 'Review a blocked change', tags: ['Architecture', 'Engineering'] },
  { title: 'Performance you can see', changed: 'Shift+P reports Core Web Vitals, JS by zone and live event rate; CI gates actual route-loaded bytes and Lighthouse scores.', value: 'Performance is measured in the product and enforced in delivery.', href: '/observability', link: 'Open Tidewatch, then press Shift+P', tags: ['UX', 'Engineering'] },
  { title: 'Free-tier by design', changed: 'Static rendering, local simulation, four reused Vercel projects and tightly scoped optional Broadcast keep the whole release inside a hard ledger.', value: 'The architecture demonstrates cost judgment and remains sustainable at $0.', href: '/system-design/mare/request-path', link: 'See the static-first architecture', tags: ['Architecture', 'Cost'], anchor: 'map-free-tier' }
];

export default function V02ImprovementMap() {
  return (
    <main className="v2-map">
      <header className="v2-map-head" data-anchor="map-head">
        <ZLink className="back" href="/work">← Work</ZLink>
        <span className="eyebrow">v0.2 · improvement map</span>
        <h1>Twelve changes. One living portfolio.</h1>
        <p>Every change connects design, UI/UX and architecture/engineering—and every card opens the working proof.</p>
        <div className="v2-map-summary" aria-label="Release summary">
          <span><b>77</b> approved routes</span>
          <span><b>12</b> broken views repaired</span>
          <span><b>$0</b> recurring demo cost</span>
        </div>
      </header>

      <section className="v2-map-grid" aria-label="Twelve v0.2 improvements" data-anchor="map-grid">
        {improvements.map((item, index) => (
          <article key={item.title} className="v2-map-card" data-anchor={item.anchor}>
            <div className="v2-map-card-top">
              <span className="v2-map-number">{String(index + 1).padStart(2, '0')}</span>
              <div className="v2-map-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
            <h2>{item.title}</h2>
            <dl>
              <div><dt>What changed</dt><dd>{item.changed}</dd></div>
              <div><dt>Reviewer value</dt><dd>{item.value}</dd></div>
            </dl>
            <ZLink href={item.href}>{item.link} <span aria-hidden="true">↗</span></ZLink>
          </article>
        ))}
      </section>
    </main>
  );
}
