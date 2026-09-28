import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RequestPath } from '@/components/request-path';
import { ZLink } from '@/components/zone-link';
import { architectures } from '@/lib/architectures';

type Props = { params: Promise<{ project: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ project: 'mare' }];
}

export const metadata: Metadata = {
  title: 'Maré request path',
  description: 'The full request path: clients, edge, BFFs, middleware, services with their own databases, the event backbone, partner adapters and the observability plane, live.'
};

export default async function RequestPathPage({ params }: Props) {
  if ((await params).project !== 'mare') notFound();
  const arch = architectures.mare!;
  return (
    <main className="sd rp" data-theme="portfolio">
      <header className="sd-head" data-anchor="rp-head">
        <div>
          <span className="eyebrow">Interactive architecture · Maré · the full request path</span>
          <h1>Every hop, live</h1>
          <p>Packets are real events from the world simulation following their real path. Hover a component for its golden signals, click it for its decisions, database and failure modes, or replay an incident and run it live across the portfolio.</p>
        </div>
        <nav className="sd-projects" aria-label="System design pages">
          <ZLink href="/system-design/mare">Maré overview</ZLink>
          <ZLink href="/system-design/mare/request-path" aria-current="page">Request path</ZLink>
          <ZLink href="/system-design/atlas">Atlas</ZLink>
          <ZLink href="/system-design/pulse">Pulse</ZLink>
        </nav>
      </header>
      <RequestPath />
      <section className="sd-metrics" data-anchor="rp-metrics" aria-label="Before and after">
        {arch.metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
        <p className="note">Before → after, measured on the real systems this fictitious design is modeled on. Throughput shown on the diagram is the browser world&apos;s sample × 1,500.</p>
      </section>
    </main>
  );
}
