import type { Metadata } from 'next';
import '@portfolio/tokens/fonts/atlas';
import '@portfolio/tokens/fonts/pulse';
import { notFound } from 'next/navigation';
import { SystemDesign } from '@/components/system-design';
import { WorldControls } from '@/components/world-controls';
import { ZLink } from '@/components/zone-link';
import { architectures } from '@/lib/architectures';

type Props = { params: Promise<{ project: string }> };

export function generateStaticParams() {
  return Object.keys(architectures).map((project) => ({ project }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const arch = architectures[(await params).project];
  return { title: arch ? `${arch.name} system design` : 'System design', description: arch ? `Replay ${arch.name}'s architecture under load and inspect each boundary.` : undefined };
}

export default async function SystemDesignPage({ params }: Props) {
  const arch = architectures[(await params).project];
  if (!arch) notFound();
  return (
    <main className="sd" data-theme={arch.theme}>
      <header className="sd-head" data-anchor="sd-head">
        <div>
          <span className="eyebrow">Interactive architecture · {arch.name}</span>
          <h1>Decisions under load</h1>
          <p>Pick a scenario and step through it. Paths light up as events travel; click any node to see why that boundary exists.</p>
        </div>
        <nav className="sd-projects" aria-label="System design pages">
          {Object.values(architectures).map((item) => <ZLink key={item.project} href={`/system-design/${item.project}`} aria-current={item.project === arch.project ? 'page' : undefined}>{item.name}</ZLink>)}
          {arch.project === 'mare' && <ZLink href="/system-design/mare/request-path">Request path →</ZLink>}
        </nav>
      </header>
      <div className="sd-world"><WorldControls anchor="sd-world" /></div>
      <SystemDesign arch={arch} />
      <section className="sd-metrics" data-anchor="sd-metrics" aria-label="Before and after">
        {arch.metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
        <p className="note">Before → after, measured on the real systems this fictitious design is modeled on.</p>
      </section>
    </main>
  );
}
