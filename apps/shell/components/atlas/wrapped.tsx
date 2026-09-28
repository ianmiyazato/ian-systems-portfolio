'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_START, MINUTE } from '@portfolio/world';
import { ZLink } from '@/components/zone-link';
import { Layer, closeLayers, openLayer, useDemoState, useParams } from '@/components/overlay';
import { useSimNow } from '@/lib/world';
import { funnel, pipelineTimeline, skills, velocity } from '@/lib/atlas';
import { AtlasHeader } from './header';

const FRAME_MS = 6000;
const replays = [52, 58, 61, 66, 70, 74];
const top = [...skills].sort((a, b) => b[1] - a[1])[0]!;
const onsites = funnel.find(([stage]) => stage === 'Onsite')![1];
const offers = funnel.find(([stage]) => stage === 'Offer')![1];

type Card = { id: string; tone: string; kicker: string; title: string; body: React.ReactNode };

function useCards(few: boolean, screensToday: number): Card[] {
  const sessions = few ? 3 : velocity.reduce((sum, [, count]) => sum + count, 0);
  const maxMonth = Math.max(...velocity.map(([, count]) => count));
  if (few) {
    return [
      { id: 'start', tone: 'mint', kicker: 'Atlas Wrapped · 2026', title: 'You started.', body: <p className="aw-big">3 sessions</p> },
      { id: 'next', tone: 'indigo', kicker: 'What unlocks the full recap', title: 'Two more and we can see your trend.', body: <p>Five sessions is enough to chart growth, find your top skill and your most replayed prompt. Your next 20-minute drill is ready.</p> },
      { id: 'go', tone: 'amber', kicker: 'Keep going', title: 'Pick up where you left off.', body: <ZLink className="aw-cta" href="/atlas/arena/mix/today">Open today&apos;s mix</ZLink> }
    ];
  }
  return [
    { id: 'sessions', tone: 'mint', kicker: 'Atlas Wrapped · 2026', title: `You practiced ${sessions} times.`, body: (
      <div className="aw-bars" role="img" aria-label={`Sessions per month: ${velocity.map(([month, count]) => `${month} ${count}`).join(', ')}`}>
        {velocity.map(([month, count], index) => <span key={month} style={{ '--h': count / maxMonth, '--i': index } as React.CSSProperties}><i /><b>{count}</b><small>{month}</small></span>)}
      </div>
    ) },
    { id: 'skill', tone: 'indigo', kicker: 'Your top skill', title: `${top[0]}, ${top[1]}/100.`, body: (
      <div className="aw-ring" role="img" aria-label={`${top[0]} scored ${top[1]} of 100`}>
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" className="track" /><circle cx="60" cy="60" r="50" className="fill" style={{ strokeDasharray: `${(top[1] / 100) * 314} 314` }} /></svg>
        <b>{top[1]}</b>
      </div>
    ) },
    { id: 'replay', tone: 'amber', kicker: 'Most replayed prompt', title: 'Design a payments ledger, 6 times.', body: (
      <svg className="aw-line" viewBox="0 0 300 120" role="img" aria-label={`Score by attempt: ${replays.join(', ')}`}>
        <polyline points={replays.map((score, index) => `${20 + index * 52},${110 - (score - 45) * 3}`).join(' ')} pathLength={1} />
        {replays.map((score, index) => <text key={index} x={20 + index * 52} y={100 - (score - 45) * 3}>{score}</text>)}
      </svg>
    ) },
    { id: 'outcomes', tone: 'coral', kicker: 'Where it took you', title: `${onsites} onsites, ${offers} offer.`, body: (
      <ul className="aw-outcomes">
        <li><b>{funnel[1][1]}</b> applied</li><li><b>{funnel[2][1]}</b> screens</li><li><b>{onsites}</b> onsites</li><li><b>{offers}</b> offer</li>
        {screensToday > 0 && <li className="aw-live"><b>+{screensToday}</b> {screensToday === 1 ? 'screen' : 'screens'} booked today</li>}
      </ul>
    ) },
    { id: 'share', tone: 'ink', kicker: 'That was your year', title: 'Share it without sharing your business.', body: (
      <div className="aw-share">
        <p>The share image leaves out company names and salary. Only your practice, your top skill and your outcome counts.</p>
        <button type="button" className="aw-cta" onClick={() => openLayer({ modal: 'share' })}>Share your recap</button>
      </div>
    ) }
  ];
}

/** Privacy-safe share image, drawn client-side: counts only, no company names, no salary. */
function ShareModal({ few }: { few: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const context = node.getContext('2d');
    if (!context) return;
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim() || '#000';
    const display = css.getPropertyValue('--font-display').trim();
    const gradient = context.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, token('--accent'));
    gradient.addColorStop(1, token('--accent-2'));
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1080, 1350);
    context.fillStyle = token('--accent-ink');
    context.font = `600 44px ${display}`;
    context.fillText('ATLAS WRAPPED · 2026', 80, 140);
    context.font = `700 150px ${display}`;
    const lines = few ? [['3', 'sessions to start']] : [[String(velocity.reduce((sum, [, count]) => sum + count, 0)), 'practice sessions'], [String(top[1]), `top skill · ${top[0]}`], [`${onsites} · ${offers}`, 'onsites · offer']];
    lines.forEach(([big, small], index) => {
      context.font = `700 150px ${display}`;
      context.fillText(big!, 80, 420 + index * 300);
      context.font = `500 44px ${display}`;
      context.fillText(small!, 80, 490 + index * 300);
    });
    context.font = `500 32px ${display}`;
    context.fillText('Company names and salary are never included.', 80, 1270);
    node.toBlob((blob) => blob && setUrl(URL.createObjectURL(blob)), 'image/png');
  }, [few]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return (
    <Layer kind="modal" title="Share your recap" eyebrow="Privacy-safe image · 1080 × 1350" onClose={() => closeLayers(['modal'])} width={520} anchor="aw-share-modal"
      footer={<>{url ? <a className="at-btn primary" href={url} download="atlas-wrapped-2026.png">Download image</a> : <span className="at-muted">Rendering…</span>}<button type="button" className="at-btn" onClick={() => closeLayers(['modal'])}>Done</button></>}>
      <canvas ref={canvas} width={1080} height={1350} className="aw-canvas" role="img" aria-label="Share image: practice sessions, top skill and outcome counts, with no company names or salary" />
      <ul className="aw-privacy">
        <li><span aria-hidden="true">✓</span> Practice counts and scores</li>
        <li><span aria-hidden="true">✕</span> Company names are left out</li>
        <li><span aria-hidden="true">✕</span> Salary and offer amounts are left out</li>
      </ul>
    </Layer>
  );
}

export function AtlasWrapped() {
  const state = useDemoState();
  const params = useParams();
  const now = useSimNow(5000) ?? DEFAULT_START;
  const few = state === 'empty';
  const screensToday = pipelineTimeline.filter((item) => item.stage === 'screen' && now >= DEFAULT_START + item.afterMinutes * MINUTE).length;
  const cards = useCards(few, screensToday);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [reduce, setReduce] = useState(false);
  const stopped = paused || held || reduce || params.get('modal') === 'share';

  useEffect(() => setReduce(matchMedia('(prefers-reduced-motion: reduce)').matches), []);
  useEffect(() => { if (index >= cards.length) setIndex(cards.length - 1); }, [cards.length, index]);
  useEffect(() => {
    if (stopped || index >= cards.length - 1) return;
    const timer = window.setTimeout(() => setIndex(index + 1), FRAME_MS);
    return () => window.clearTimeout(timer);
  }, [index, stopped, cards.length]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (params.get('modal')) return;
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(cards.length - 1, value + 1));
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards.length, params]);

  const card = cards[Math.min(index, cards.length - 1)]!;
  return (
    <>
      <AtlasHeader active="Arena" />
      <main className="aw" data-anchor="aw-main">
        <h1 className="visually-hidden">Atlas Wrapped</h1>
        <section className={`aw-story t-${card.tone}`} aria-roledescription="story" aria-label={`Card ${index + 1} of ${cards.length}`} data-anchor="aw-story">
          <div className="aw-bars-top" aria-hidden="true">
            {cards.map((item, position) => <span key={item.id}><i className={position < index ? 'done' : position === index ? (stopped ? 'hold' : 'now') : ''} style={{ animationDuration: `${FRAME_MS}ms` }} /></span>)}
          </div>
          <div className="aw-card" key={card.id} aria-live="polite">
            <span className="aw-kicker">{card.kicker}</span>
            <h2>{card.title}</h2>
            <div className="aw-body">{card.body}</div>
          </div>
          <button type="button" className="aw-hit prev" aria-label="Previous card" onClick={() => setIndex(Math.max(0, index - 1))}
            onPointerDown={() => setHeld(true)} onPointerUp={() => setHeld(false)} onPointerLeave={() => setHeld(false)} />
          <button type="button" className="aw-hit next" aria-label="Next card" onClick={() => setIndex(Math.min(cards.length - 1, index + 1))}
            onPointerDown={() => setHeld(true)} onPointerUp={() => setHeld(false)} onPointerLeave={() => setHeld(false)} />
          <div className="aw-controls">
            <button type="button" className="aw-pause" aria-pressed={paused} onClick={() => setPaused(!paused)} data-anchor="aw-pause">{paused ? 'Play' : 'Pause'}</button>
            <span>{index + 1} / {cards.length}</span>
            <button type="button" className="aw-pause" onClick={() => openLayer({ modal: 'share' })} data-anchor="aw-share-btn">Share</button>
          </div>
        </section>
      </main>
      {params.get('modal') === 'share' && <ShareModal few={few} />}
    </>
  );
}
