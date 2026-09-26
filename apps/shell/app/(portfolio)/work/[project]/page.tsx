import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ZLink } from '@/components/zone-link';
import { studies, studyBySlug } from '@/lib/work';

type Props = { params: Promise<{ project: string }> };

export function generateStaticParams() {
  return studies.map((study) => ({ project: study.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = studyBySlug((await params).project);
  return { title: study ? `${study.name} case study` : 'Case study', description: study?.pitch };
}

export default async function CaseStudy({ params }: Props) {
  const study = studyBySlug((await params).project);
  if (!study) notFound();
  return (
    <main className="case">
      <header className="case-hero" data-anchor="case-hero">
        <ZLink className="back" href="/work">← Work</ZLink>
        <span className="eyebrow">{study.kind}</span>
        <h1>{study.name}</h1>
        <p>{study.pitch}</p>
        <div className="case-actions">
          <ZLink className="btn primary" href={study.shots[0]!.href}>Open the live product</ZLink>
          <ZLink className="btn" href={`/system-design/${study.slug}`}>See the system design</ZLink>
        </div>
      </header>
      <section className="case-grid">
        <article className="case-problem" data-anchor="case-problem">
          <h2>The problem</h2>
          {study.problem.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </article>
        <article className="case-owned" data-anchor="case-owned">
          <h2>What I owned</h2>
          <ul>{study.owned.map((item) => <li key={item.tag}><span className={`tag ${item.tag.toLowerCase()}`}>{item.tag}</span>{item.text}</li>)}</ul>
        </article>
        <aside className="case-metrics" data-anchor="case-metrics">
          <h2>Outcomes</h2>
          <p className="note">Measured on the real systems this fictitious case is modelled on.</p>
          <ul>{study.metrics.map((metric) => <li key={metric}>{metric}</li>)}</ul>
        </aside>
      </section>
      <section className="case-gallery" aria-labelledby="gallery-title" data-anchor="case-gallery">
        <header className="section-head"><span>Screen gallery</span><h2 id="gallery-title">Open any screen; each one is the live product.</h2></header>
        <div className="gallery">
          {study.shots.map((shot) => (
            <ZLink key={shot.src} className="shot" href={shot.href}>
              <Image src={`/gallery/${shot.src}`} alt={`${shot.label} screenshot`} width={720} height={450} sizes="(max-width: 900px) 100vw, 33vw" />
              <span>{shot.label} →</span>
            </ZLink>
          ))}
        </div>
      </section>
      <ZLink className="case-next" href={`/system-design/${study.slug}`} data-anchor="case-system-design">
        <span className="eyebrow">Next</span><strong>Replay {study.name}&apos;s architecture under load →</strong>
      </ZLink>
    </main>
  );
}
