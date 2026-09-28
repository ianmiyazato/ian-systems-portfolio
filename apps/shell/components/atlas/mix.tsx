'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { nowPlaying, onNowPlaying, playQueue, togglePlay, type NowPlaying, type Track } from '@portfolio/chrome/now-playing';
import { DEFAULT_START, MINUTE, clock, duration, parseLocalTime } from '@portfolio/world';
import { ZLink } from '@/components/zone-link';
import { AiSurface, Layer, closeLayers, openLayer, useDemoState, useParams } from '@/components/overlay';
import { useSimNow } from '@/lib/world';
import { pipelineTimeline } from '@/lib/atlas';
import { mixTracks, mixes, orbitalTrack, type MixTrack } from '@/lib/atlas-mix';
import { AtlasHeader } from './header';

const MIX = mixes[0]!;
const HREF = '/atlas/arena/mix/today';
const orbitalAt = DEFAULT_START + (pipelineTimeline.find((item) => item.id === 'orbital')?.afterMinutes ?? 11) * MINUTE;
const coverFor = (kind: MixTrack['kind']) => ({ Drill: 'DR', Lesson: 'LE', Mock: 'MK' })[kind];
const toQueue = (tracks: MixTrack[]): Track[] => tracks.map((track) => ({ id: track.id, title: track.title, subtitle: `${track.kind} · ${track.minutes} min`, seconds: track.minutes * 60, cover: coverFor(track.kind) }));

function useNowPlaying() {
  const [state, setState] = useState<NowPlaying | null>(null);
  useEffect(() => {
    const sync = () => setState(nowPlaying());
    sync();
    const stop = onNowPlaying(sync);
    const tick = window.setInterval(sync, 1000);
    return () => { stop(); window.clearInterval(tick); };
  }, []);
  return state;
}

/** FLIP: rows glide to their new place when the order changes (transform only, off under reduced motion). */
function useFlip(keys: string) {
  const list = useRef<HTMLOListElement>(null);
  const before = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const rows = [...(list.current?.querySelectorAll<HTMLElement>('[data-row]') ?? [])];
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      rows.forEach((row) => {
        const previous = before.current.get(row.dataset.row!);
        const delta = previous === undefined ? 0 : previous - row.offsetTop;
        if (!delta) return;
        row.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.3,1.3,.5,1)' });
      });
    }
    before.current = new Map(rows.map((row) => [row.dataset.row!, row.offsetTop]));
  }, [keys]);
  return list;
}

export function PracticeMix() {
  const state = useDemoState();
  const params = useParams();
  const now = useSimNow(1000) ?? DEFAULT_START;
  const player = useNowPlaying();
  const [shuffled, setShuffled] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [kept, setKept] = useState(false);

  const booked = now >= orbitalAt;
  const base = booked ? [mixTracks[0]!, orbitalTrack, ...mixTracks.slice(1)] : mixTracks;
  const tracks = (shuffled ? [...base].sort((a, b) => b.weakness - a.weakness) : base).filter((track) => !removed.includes(track.id));
  const list = useFlip(tracks.map((track) => track.id).join());
  const empty = state === 'empty';

  const ours = player?.source === 'atlas' && player.href === HREF ? player : null;
  const currentId = ours ? ours.queue[ours.index]?.id : null;
  const upNext = ours ? ours.queue.slice(ours.index + 1, ours.index + 4) : toQueue(tracks.slice(1, 4));
  const refresh = parseLocalTime('06:00', now)! + 86_400_000;
  const total = tracks.reduce((sum, track) => sum + track.minutes, 0);

  const play = (index = 0) => {
    const track = tracks[index]!;
    if (currentId === track.id) return togglePlay();
    playQueue('atlas', MIX.title, HREF, toQueue(tracks), index);
  };
  const drawerTrack = params.get('drawer') === 'why' ? base.find((track) => track.id === params.get('track')) : undefined;

  return (
    <>
      <AtlasHeader active="Arena" />
      <main className="mx" data-anchor="mx-main">
        <nav className="mx-library" aria-label="Your mixes" data-anchor="mx-library">
          <h2>Your library</h2>
          <ul>
            {mixes.map((mix) => (
              <li key={mix.id}>
                <a href={mix.id === 'today' ? HREF : '#'} aria-current={mix.id === 'today' ? 'page' : undefined} onClick={(event) => mix.id !== 'today' && event.preventDefault()} aria-disabled={mix.id !== 'today' || undefined}>
                  <span className="mx-cover small" style={{ '--c1': `var(--${mix.cover[0]})`, '--c2': `var(--${mix.cover[1]})` } as React.CSSProperties} aria-hidden="true" />
                  <span><b>{mix.title}</b><small>{mix.id === 'today' ? 'Made for you' : `${mix.count} tracks`}</small></span>
                </a>
              </li>
            ))}
          </ul>
          <ZLink className="mx-wrapped" href="/atlas/wrapped" data-anchor="mx-wrapped-link"><span aria-hidden="true">✦</span> Your 2026 Wrapped</ZLink>
        </nav>

        <section className="mx-page" aria-labelledby="mx-title">
          <header className="mx-hero" data-anchor="mx-hero">
            <span className="mx-cover big" style={{ '--c1': 'var(--accent)', '--c2': 'var(--accent-2)' } as React.CSSProperties} aria-hidden="true"><b>Tue</b><i>interview mix</i></span>
            <div>
              <span className="at-eyebrow">Made for you · refreshes daily</span>
              <h1 id="mx-title">{MIX.title}</h1>
              <p className="at-muted">{empty ? 'Your first mix builds itself after a 10-minute baseline.' : `Built from your rubric scores and the Parallax Pay onsite on Thursday, Oct 1 · ${tracks.length} tracks · ${Math.floor(total / 60)} h ${total % 60} min`}</p>
              <p className="mx-refresh" data-anchor="mx-refresh">Next refresh {clock(refresh)} tomorrow · in {duration(refresh - now)}</p>
              {!empty && (
                <div className="mx-actions">
                  <button type="button" className={`mx-play ${ours?.playing ? 'is-playing' : ''}`} onClick={() => (ours ? togglePlay() : play(0))} aria-label={ours?.playing ? 'Pause mix' : 'Play mix'} data-anchor="mx-play">{ours?.playing ? '❚❚' : '▶'}</button>
                  <button type="button" className="mx-chip" aria-pressed={shuffled} onClick={() => setShuffled(!shuffled)} data-anchor="mx-shuffle">Shuffle by weakness</button>
                </div>
              )}
            </div>
          </header>

          {empty ? (
            <div className="mx-empty" data-anchor="mx-empty">
              <h2>No mix yet</h2>
              <p className="at-muted">Take one 10-minute baseline drill. Atlas scores it against the rubric and builds tomorrow&apos;s mix around your weakest line.</p>
              <ZLink className="at-btn primary" href="/atlas/arena?modal=setup&prompt=estimate-storage">Start the baseline</ZLink>
            </div>
          ) : (
            <div className="mx-table" role="table" aria-label={`${MIX.title} tracks`}>
              <div className="mx-row mx-head" role="row"><span role="columnheader">#</span><span role="columnheader">Title</span><span role="columnheader">Type</span><span role="columnheader">Why it&apos;s here</span><span role="columnheader">Time</span></div>
              <ol ref={list} role="rowgroup">
                {tracks.map((track, index) => {
                  const current = currentId === track.id;
                  return (
                    <li key={track.id} data-row={track.id} data-nav-row role="row" className={`mx-row ${current ? 'is-current' : ''} ${track.fresh ? 'is-fresh' : ''}`}>
                      <span role="cell" className="mx-num">
                        {current && ours?.playing ? <span className="mx-eq" role="img" aria-label="Playing"><i /><i /><i /></span> : <span className="mx-index">{index + 1}</span>}
                        <button type="button" className="mx-row-play" onClick={() => play(index)} aria-label={current && ours?.playing ? `Pause ${track.title}` : `Play ${track.title}`}>{current && ours?.playing ? '❚❚' : '▶'}</button>
                      </span>
                      <span role="cell" className="mx-title"><span className={`mx-cover tiny k-${track.kind.toLowerCase()}`} aria-hidden="true">{coverFor(track.kind)}</span><span><b>{track.title}</b>{track.fresh && <em>New</em>}</span></span>
                      <span role="cell"><span className={`mx-kind k-${track.kind.toLowerCase()}`}>{track.kind}</span></span>
                      <span role="cell" className="mx-why"><button type="button" className="mx-why-btn" onClick={() => openLayer({ drawer: 'why', track: track.id })}>{track.why}</button></span>
                      <span role="cell" className="mx-time">{track.minutes}:00</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>

        <aside className="mx-rail">
          <AiSurface title="Why this mix" meta="rubric + calendar" anchor="mx-why-mix"
            sources={[{ label: 'rubric · session 14', score: 0.62 }, { label: 'Parallax Pay onsite · Thu Oct 1' }, { label: 'member reports · 14' }]}
            actions={<><button type="button" className="ai-approve" aria-pressed={kept} onClick={() => setKept(!kept)}>{kept ? 'Kept in your library' : 'Keep this mix'}</button><button type="button" className="ai-explain" onClick={() => setShuffled(!shuffled)}>{shuffled ? 'Back to recommended order' : 'Weakest first'}</button></>}>
            Estimation is your lowest rubric line, so three of seven tracks drill it. The bar raiser mock sits mid-mix because your Parallax Pay onsite is Thursday, and it ends on a lesson you liked to keep the streak kind.
          </AiSurface>
          <section className="at-card mx-next" aria-labelledby="mx-next-title" data-anchor="mx-up-next">
            <h2 id="mx-next-title">Up next</h2>
            {empty ? <p className="at-muted">Nothing queued yet.</p> : (
              <ol>{upNext.map((track) => <li key={track.id}><span className="mx-cover tiny" aria-hidden="true">{track.cover}</span><span><b>{track.title}</b><small>{track.subtitle}</small></span></li>)}</ol>
            )}
          </section>
        </aside>
      </main>

      {drawerTrack && (
        <Layer kind="drawer" title={drawerTrack.title} eyebrow={`${drawerTrack.kind} · ${drawerTrack.minutes} min · ${drawerTrack.area}`} onClose={() => closeLayers(['drawer', 'track'])} anchor="mx-why-drawer"
          footer={<><ZLink className="at-btn primary" href={drawerTrack.href}>{drawerTrack.kind === 'Lesson' ? 'Open the lesson' : 'Start in Arena'}</ZLink><button type="button" className="at-btn" onClick={() => { setRemoved([...removed, drawerTrack.id]); closeLayers(['drawer', 'track']); }}>Remove from this mix</button></>}>
          <AiSurface inline title="Why it's here" meta={`weakness ${drawerTrack.weakness.toFixed(2)}`} sources={[{ label: `rubric · ${drawerTrack.area}`, score: 1 - drawerTrack.weakness }, { label: 'calendar · next interview' }]}>
            {drawerTrack.why}. Tracks that drill your weakest rubric lines rise when you shuffle by weakness; practicing it moves the next mix on.
          </AiSurface>
        </Layer>
      )}
    </>
  );
}
