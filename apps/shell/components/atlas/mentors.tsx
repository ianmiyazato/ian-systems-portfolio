'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_START, MINUTE, clock, duration } from '@portfolio/world';
import { ZLink } from '@/components/zone-link';
import { Layer, closeLayers, openLayer, useDemoState, useParams } from '@/components/overlay';
import { useSimNow } from '@/lib/world';
import { continents, isOnline, member, mentors, surgeAt, type Mentor } from '@/lib/atlas-mentors';
import { AtlasHeader } from './header';

type Phase = 'idle' | 'searching' | 'matched' | 'canceled' | 'waitlist';
const topics = ['System design', 'Coding', 'Behavioral'] as const;
const levels = ['Mid', 'Senior', 'Staff'] as const;
const lengths = [30, 45, 60] as const;
const languages = ['English', 'Portuguese', 'Spanish'] as const;
const steps = ['Matched', 'Joining', 'Mock', 'Feedback'] as const;
const utcHour = (ms: number) => new Date(ms).getUTCHours() + new Date(ms).getUTCMinutes() / 60;

function routePath(from: Mentor) {
  const midX = (from.x + member.x) / 2;
  const midY = Math.min(from.y, member.y) - 60;
  return `M${from.x} ${from.y} Q${midX} ${midY} ${member.x} ${member.y}`;
}

export function LiveMatch() {
  const state = useDemoState();
  const params = useParams();
  const now = useSimNow(1000) ?? DEFAULT_START;
  const [topic, setTopic] = useState<(typeof topics)[number]>('System design');
  const [level, setLevel] = useState<(typeof levels)[number]>('Senior');
  const [length, setLength] = useState<(typeof lengths)[number]>(45);
  const [language, setLanguage] = useState<(typeof languages)[number]>('English');
  const [phase, setPhase] = useState<Phase>('idle');
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const [matchedAt, setMatchedAt] = useState<number | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [canceledBy, setCanceledBy] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const hour = utcHour(now);
  const online = mentors.filter((mentor) => isOnline(mentor, hour));
  const surge = state === 'empty' ? 1 : surgeAt(hour);
  const credits = Math.ceil((length / 15) * surge);
  const matched = mentors.find((mentor) => mentor.id === matchedId) ?? null;
  const reduce = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const later = (ms: number, run: () => void) => { timers.current.push(window.setTimeout(run, reduce ? 0 : ms)); };
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const pick = (exclude: string[] = []) => online.filter((mentor) => mentor.languages.includes(language) && !exclude.includes(mentor.id)).sort((a, b) => b.rating - a.rating || b.mocks - a.mocks)[0] ?? null;
  const match = (mentor: Mentor) => { setMatchedId(mentor.id); setMatchedAt(now); setPhase('matched'); openLayer({ match: mentor.id }); };

  const request = () => {
    setPhase('searching');
    setSent(null);
    later(1800, () => {
      if (state === 'empty') { setPhase('waitlist'); openLayer({ match: 'waitlist' }); return; }
      const first = pick();
      if (!first) { setPhase('waitlist'); openLayer({ match: 'waitlist' }); return; }
      match(first);
      // Variation: the mentor cancels and Atlas rematches on its own.
      if (state === 'error') later(2600, () => {
        setCanceledBy(first.name);
        setPhase('canceled');
        later(1800, () => { const next = pick([first.id]); if (next) match(next); });
      });
    });
  };

  // Deep link (?match=priya) opens the sheet directly, e.g. from a notification.
  useEffect(() => {
    const id = params.get('match');
    if (id && id !== 'waitlist' && !matchedId) {
      const mentor = mentors.find((item) => item.id === id);
      if (mentor) { setMatchedId(mentor.id); setMatchedAt(DEFAULT_START); setPhase('matched'); }
    }
    if (id === 'waitlist' && phase === 'idle') setPhase('waitlist');
    if (!id && (phase === 'matched' || phase === 'waitlist')) { setPhase('idle'); setMatchedId(null); }
  }, [params]);

  const startsAt = (matchedAt ?? now) + 4 * MINUTE;
  const left = Math.max(0, startsAt - now);
  const stepIndex = left > MINUTE ? 0 : left > 0 ? 1 : 2;
  const cancel = () => { timers.current.forEach((id) => window.clearTimeout(id)); setPhase('idle'); setMatchedId(null); closeLayers(['match']); };
  const waitlistLeft = Math.max(0, DEFAULT_START + 12 * MINUTE - now);

  return (
    <>
      <AtlasHeader active="Mentors" />
      <main className="lm" data-anchor="lm-main">
        <section className="lm-map" aria-label={`Mentor map: ${online.length} of ${mentors.length} mentors online now`} data-anchor="lm-map">
          <svg viewBox="0 0 1000 500" role="img" aria-label={`${online.length} mentors online: ${online.map((mentor) => mentor.city).join(', ')}`}>
            {continents.map((d, index) => <path key={index} d={d} className="lm-land" />)}
            {mentors.map((mentor) => {
              const on = isOnline(mentor, hour);
              return <g key={mentor.id} className={`lm-mentor ${on ? 'on' : 'off'} ${matchedId === mentor.id ? 'is-matched' : ''}`} transform={`translate(${mentor.x} ${mentor.y})`}><circle r="14" className="lm-pulse" /><circle r="5" /></g>;
            })}
            {matched && phase === 'matched' && <path d={routePath(matched)} className="lm-route" pathLength={1} />}
            <g className={`lm-me ${phase === 'searching' ? 'is-searching' : ''}`} transform={`translate(${member.x} ${member.y})`}>
              <circle r="30" className="lm-ring r1" /><circle r="30" className="lm-ring r2" /><circle r="30" className="lm-ring r3" /><circle r="7" className="lm-dot" />
            </g>
          </svg>
          <p className="lm-online" data-anchor="lm-online"><span className="live-dot" aria-hidden="true" /> {online.length} mentors online · {clock(now)} in São Paulo</p>
        </section>

        <aside className="at-card lm-request" aria-labelledby="lm-title" data-anchor="lm-request">
          <span className="at-eyebrow">Live mock · like a ride, but for interviews</span>
          <h1 id="lm-title">Get a mock now</h1>
          <fieldset><legend>Topic</legend><div className="lm-seg">{topics.map((item) => <button key={item} type="button" aria-pressed={topic === item} onClick={() => setTopic(item)}>{item}</button>)}</div></fieldset>
          <fieldset><legend>Level</legend><div className="lm-seg">{levels.map((item) => <button key={item} type="button" aria-pressed={level === item} onClick={() => setLevel(item)}>{item}</button>)}</div></fieldset>
          <fieldset><legend>Length</legend><div className="lm-seg">{lengths.map((item) => <button key={item} type="button" aria-pressed={length === item} onClick={() => setLength(item)}>{item} min</button>)}</div></fieldset>
          <fieldset><legend>Language</legend><div className="lm-seg">{languages.map((item) => <button key={item} type="button" aria-pressed={language === item} onClick={() => setLanguage(item)}>{item}</button>)}</div></fieldset>
          <div className="lm-price" data-anchor="lm-surge">
            <span><b>{credits} credits</b> · you have 12</span>
            {surge > 1 && <span className="lm-surge" title="Demand is high while the US and Europe overlap">Demand is high · {surge.toFixed(1)}×</span>}
          </div>
          <button type="button" className="at-btn primary lm-go" onClick={request} disabled={phase === 'searching' || phase === 'matched'}>{phase === 'searching' ? 'Finding a mentor…' : 'Find a mentor'}</button>
          <p className="at-muted lm-note">{topic} · {level} · {length} min · {language}. The top-rated mentor who speaks your language is matched first; you only pay if the mock starts.</p>
        </aside>
      </main>

      {phase === 'canceled' && <p className="at-banner warn lm-toast" role="status">{canceledBy} had to cancel. Rematching you now, no credits used.</p>}

      {(phase === 'matched' && matched) && (
        <Layer kind="sheet" title={`Matched with ${matched.name}`} eyebrow={`${matched.role} · ${matched.city}`} onClose={cancel} width={620} anchor="lm-sheet"
          footer={<><ZLink className="at-btn primary" href="/atlas/arena/session/14">Join room</ZLink><button type="button" className="at-btn" onClick={() => setSent('')}>Message</button><button type="button" className="at-btn" onClick={cancel}>Cancel</button></>}>
          <div className="lm-sheet">
            <p className="lm-meta"><b>★ {matched.rating}</b> · {matched.mocks} mocks · {matched.languages.join(', ')}</p>
            <p className="lm-eta" aria-live="polite">{left > 0 ? <>Starts in <b>{duration(left)}</b> · {clock(startsAt)}</> : <b>Your mentor is in the room</b>}</p>
            <ol className="lm-steps" aria-label="Session progress">{steps.map((step, index) => <li key={step} className={index < stepIndex ? 'done' : index === stepIndex ? 'now' : ''} aria-current={index === stepIndex ? 'step' : undefined}><i /><span>{step}</span></li>)}</ol>
            {sent !== null && (
              <div className="lm-replies">
                {sent ? <p role="status">Sent: “{sent}”</p> : ['Running 2 min late', 'Can we focus on estimation?', 'Joining now'].map((text) => <button key={text} type="button" className="at-btn" onClick={() => setSent(text)}>{text}</button>)}
              </div>
            )}
          </div>
        </Layer>
      )}

      {phase === 'waitlist' && (
        <Layer kind="sheet" title="No mentor free right now" eyebrow="Waitlist · you're #3" onClose={cancel} width={560} anchor="lm-waitlist"
          footer={<><button type="button" className="at-btn primary" onClick={cancel}>Keep my place</button><ZLink className="at-btn" href="/atlas/arena/mix/today">Practice solo meanwhile</ZLink></>}>
          <p>Estimated wait <b>{duration(waitlistLeft)}</b>. Most {language}-speaking mentors come online after 18:00 in São Paulo. We&apos;ll notify you and hold the match for two minutes.</p>
        </Layer>
      )}
    </>
  );
}
