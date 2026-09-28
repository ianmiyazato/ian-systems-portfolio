'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ZLink } from '@/components/zone-link';
import { useDemoState } from '@/components/overlay';
import { artFocus, billboard, continueWatching, rubricAreas, topFive, weakestArea, type Motif, type RubricArea } from '@/lib/atlas';
import { AtlasHeader } from './header';

const INTENT_MS = 300;

/** Card art: a diagram motif per title, re-drawn to emphasize the member's weakest rubric area. */
const estimate: Record<Motif, [string, string]> = {
  ledger: ['10×', 'writes/s · 2 TB/yr'], cache: ['95%', 'hit rate · 40 ms saved'], queue: ['48k', 'lag · 2 min drain'], shard: ['4', 'shards · 25% each'],
  limit: ['100', 'req/s · burst 20'], search: ['80ms', 'p95 · top 10'], feed: ['1:5k', 'fan-out · 3 s'], retry: ['3×', 'retries · jitter 200ms']
};

export function TitleArt({ motif, focus, label, shape = 'wide' }: { motif: Motif; focus: RubricArea; label: string; shape?: 'wide' | 'tall' | 'cover' }) {
  const base: Record<Motif, ReactNode> = {
    ledger: <>{[0, 1, 2, 3].map((row) => <rect key={row} x="70" y={40 + row * 26} width="180" height="18" rx="4" className="ta-shape" />)}</>,
    cache: <><rect x="50" y="60" width="80" height="60" rx="8" className="ta-shape" /><rect x="190" y="60" width="80" height="60" rx="8" className="ta-shape alt" /><path d="M130 90 H190" className="ta-link" /></>,
    queue: <>{[0, 1, 2, 3, 4].map((box) => <rect key={box} x={50 + box * 44} y="70" width="34" height="40" rx="6" className={box === 4 ? 'ta-shape alt' : 'ta-shape'} />)}<path d="M40 130 H280" className="ta-link" /></>,
    shard: <>{[0, 1, 2, 3].map((cell) => <rect key={cell} x={90 + (cell % 2) * 74} y={34 + Math.floor(cell / 2) * 58} width="66" height="50" rx="8" className={cell === 0 ? 'ta-shape alt' : 'ta-shape'} />)}</>,
    limit: <><path d="M110 50 H210 L196 140 H124 Z" className="ta-shape" />{[0, 1, 2].map((dot) => <circle key={dot} cx={140 + dot * 20} cy="110" r="7" className="ta-dot" />)}</>,
    search: <><circle cx="130" cy="84" r="36" className="ta-ring" /><path d="M156 110 L186 140" className="ta-link" />{[0, 1, 2].map((bar) => <rect key={bar} x="200" y={56 + bar * 22} width={70 - bar * 18} height="12" rx="4" className="ta-shape" />)}</>,
    feed: <><circle cx="80" cy="90" r="14" className="ta-dot" />{[0, 1, 2, 3].map((line) => <path key={line} d={`M94 90 L240 ${48 + line * 28}`} className="ta-link" />)}</>,
    retry: <><path d="M110 90 a50 50 0 1 1 30 46" className="ta-ring" /><path d="M140 136 l-2 -18 l16 10 z" className="ta-dot" /><rect x="200" y="74" width="70" height="32" rx="6" className="ta-shape alt" /></>
  };
  const overlay: Record<RubricArea, ReactNode> = {
    'Estimation': <><text x="48" y="44" className="ta-num">{estimate[motif][0]}</text><text x="48" y="164" className="ta-num small">{estimate[motif][1]}</text></>,
    'Trade-offs': <><path d="M160 20 V160" className="ta-split" /><text x="48" y="40" className="ta-num small">A · consistent</text><text x="176" y="164" className="ta-num small">B · available</text></>,
    'Failure modes': <><path d="M150 70 L170 90 M170 70 L150 90" className="ta-fail" /><text x="48" y="40" className="ta-num small">what breaks first?</text></>,
    'Data modeling': <><rect x="44" y="22" width="92" height="44" rx="6" className="ta-table" /><text x="52" y="40" className="ta-num small">pk account_id</text><text x="52" y="58" className="ta-num small">entries[]</text></>
  };
  return (
    // tall: a 4:5 crop around the motif; cover: fill any box (billboard).
    <svg className={`ta ta-${motif}`} viewBox={shape === 'tall' ? '36 -60 248 310' : shape === 'cover' ? '-240 -40 600 260' : '0 0 320 180'} preserveAspectRatio={shape === 'cover' ? 'xMaxYMid slice' : 'xMidYMid meet'} role="img" aria-label={`${label}: artwork emphasizing ${artFocus[focus]}`}>
      <rect x="-200" y="-200" width="720" height="580" className="ta-bg" />
      <g className="ta-motif">{base[motif]}</g>
      <g className="ta-overlay">{overlay[focus]}</g>
    </svg>
  );
}

/** Hover expands after 300 ms of intent; keyboard focus expands at once and wins over the pointer. */
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
