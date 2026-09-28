'use client';

import { useEffect, useRef, useState } from 'react';
import { ZLink } from '@/components/zone-link';
import { useDemoState } from '@/components/overlay';
import { billboard, continueWatching, rubricAreas, topFive, weakestArea, type RubricArea } from '@/lib/atlas';
import { TitleArt } from './title-art';
import { AtlasHeader } from './header';

const INTENT_MS = 300;

function useIntent() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const timer = useRef<number>(0);
  const hover = (id: string) => ({
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setHovered(id), INTENT_MS);
    },
    onPointerLeave: () => {
      window.clearTimeout(timer.current);
      setHovered((current) => (current === id ? null : current));
    },
    onFocus: () => setFocused(id),
    onBlur: (event: React.FocusEvent) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused((current) => (current === id ? null : current)); }
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { expanded: focused ?? hovered, hover };
}

export function AcademyBrowse() {
  const state = useDemoState();
  const [focus, setFocus] = useState<RubricArea>(weakestArea);
  const [listed, setListed] = useState(false);
  const [paused, setPaused] = useState(false);
  const { expanded, hover } = useIntent();
  const loading = state === 'loading';

  return (
    <>
      <AtlasHeader active="Academy" />
      <main className="ab" data-anchor="ab-main">
        <section className={`ab-billboard ${paused ? 'is-paused' : ''}`} data-anchor="ab-billboard" aria-labelledby="ab-title">
          <div className="ab-bb-art" aria-hidden="true"><TitleArt motif={billboard.motif} focus={focus} label={billboard.title} shape="cover" /></div>
          <div className="ab-bb-copy">
            <span className="ab-new">New series · {billboard.episodes} episodes</span>
            <h1 id="ab-title">{billboard.title}</h1>
            <p className="ab-facts"><b className="ab-match">{billboard.match}% match</b><span>{billboard.level}</span><span>{billboard.minutes} min</span><span>ends with Arena drills</span></p>
            <p className="ab-blurb">{billboard.blurb}</p>
            <div className="ab-actions">
              <ZLink className="at-btn primary ab-play" href="/atlas/academy/designing-for-10x"><span aria-hidden="true">▶</span> Play episode 1</ZLink>
              <button type="button" className="at-btn" aria-pressed={listed} onClick={() => setListed(!listed)}>{listed ? '✓ In my list' : '+ My list'}</button>
              <button type="button" className="at-btn ab-pause" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Play preview' : 'Pause preview'}</button>
            </div>
          </div>
          <div className="ab-progress" aria-hidden="true"><i /></div>
        </section>

        <div className="ab-personal" role="group" aria-label="Personalized artwork" data-anchor="ab-personalized">
          <span>Artwork tuned to your weakest rubric area{focus === weakestArea ? ` (${weakestArea}, session 14)` : ''}:</span>
          {rubricAreas.map((area) => <button key={area} type="button" aria-pressed={focus === area} onClick={() => setFocus(area)}>{area}</button>)}
        </div>

        <section className="ab-row" aria-labelledby="ab-continue" data-anchor="ab-continue">
          <h2 id="ab-continue">Continue watching</h2>
          <ul className="ab-track" aria-busy={loading}>
            {continueWatching.map((title) => (
              <li key={title.id} className={`ab-card ${expanded === title.id ? 'is-expanded' : ''}`} {...hover(title.id)}>
                <ZLink className="ab-card-main" href="/atlas/academy/designing-for-10x" aria-label={`${title.title}, ${Math.round((title.progress ?? 0) * 100)}% watched, resume at ${title.resume}`}>
                  <span className="ab-card-art">
                    {loading ? <span className="skeleton ab-sk" /> : <TitleArt motif={title.motif} focus={focus} label={title.title} />}
                    <span className="ab-card-progress" role="progressbar" aria-label="Watched" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((title.progress ?? 0) * 100)}><i style={{ width: `${(title.progress ?? 0) * 100}%` }} /></span>
                  </span>
                  <span className="ab-card-title">{title.title}</span>
                  <span className="ab-card-sub">{title.kind === 'Series' ? `${title.episodes} episodes` : `${title.minutes} min`} · resume at {title.resume}</span>
                </ZLink>
                <div className="ab-card-more">
                  <p>{title.blurb}</p>
                  <div className="ab-card-actions">
                    <ZLink className="at-btn primary" href="/atlas/academy/designing-for-10x">Resume</ZLink>
                    <ZLink className="at-btn" href={`/atlas/arena?modal=setup&prompt=${title.drill}`}>Practice in Arena</ZLink>
                  </div>
                  <p className="ab-card-facts"><b className="ab-match">{title.match}% match</b> · {title.level}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="ab-row" aria-labelledby="ab-top" data-anchor="ab-top5">
          <h2 id="ab-top">Top 5 in Atlas this week</h2>
          <ol className="ab-top">
            {topFive.map((title, index) => (
              <li key={title.id}>
                <span className="ab-rank" aria-hidden="true">{index + 1}</span>
                <ZLink className="ab-top-card" href="/atlas/academy/designing-for-10x" aria-label={`Number ${index + 1}: ${title.title}${title.members ? ', Members' : ''}`}>
                  <TitleArt motif={title.motif} focus={focus} label={title.title} shape="tall" />
                  <span className="ab-top-title">{title.title}{title.members && <em>Members</em>}</span>
                </ZLink>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
