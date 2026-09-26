import type { Metadata } from 'next';
import { ZLink } from '@/components/zone-link';
import { studies } from '@/lib/work';

export const metadata: Metadata = { title: 'Work', description: 'Three fictitious platforms that show product judgement, frontend craft and distributed-systems depth.' };

export default function WorkIndex() {
  return (
    <main className="work">
      <header className="work-head" data-anchor="work-head">
        <span className="eyebrow">Work index</span>
        <h1>Three platforms, each built around the people who use it.</h1>
        <p>Names, data and AI are fictitious and simulated; the decisions and trade-offs are real. Every screen is live: open it, break it, and press <kbd>D</kbd> to see why it works the way it does.</p>
      </header>
      <div className="work-list" data-anchor="work-list">
        {studies.map((study, index) => (
          <ZLink key={study.slug} className="work-row" href={`/work/${study.slug}`} style={{ '--i': index } as React.CSSProperties}>
            <span className="work-num">0{index + 1}</span>
            <div><h2>{study.name}</h2><p>{study.pitch}</p></div>
            <span className="work-kind">{study.kind}</span>
          </ZLink>
        ))}
      </div>
    </main>
  );
}
