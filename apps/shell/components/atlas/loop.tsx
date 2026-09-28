'use client';

import { useEffect, useState } from 'react';
import { playQueue } from '@portfolio/chrome/now-playing';
import { DEFAULT_START, MINUTE, clock } from '@portfolio/world';
import { ZLink } from '@/components/zone-link';
import { Layer, closeLayers, openLayer, useDemoState, useParams } from '@/components/overlay';
import { useSimNow } from '@/lib/world';
import { weakestArea } from '@/lib/atlas';
import { loopSeason, type Episode } from '@/lib/atlas-loop';
import { AtlasHeader } from './header';
import { TitleArt } from './title-art';

const HREF = `/atlas/academy/loops/${loopSeason.slug}`;
const LABEL = `${loopSeason.company}: The Loop`;
const NEW_REPORT_AT = DEFAULT_START + 6 * MINUTE;
const runtime = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}` : `${minutes} min`);

function play(episodes: Episode[], index: number) {
  playQueue('atlas', LABEL, HREF, episodes.map((episode) => ({ id: `ep-${episode.n}`, title: `Ep ${episode.n} · ${episode.title}`, subtitle: `${loopSeason.company} · Season ${loopSeason.season}`, seconds: Math.min(episode.minutes, 60) * 60, cover: `E${episode.n}` })), index);
}

/** "Next episode in 8": counts down, then starts episode 3 on the shared player, unless the member picks practice or stays. */
function Autoplay({ next, onPlay }: { next: Episode; onPlay: () => void }) {
  const [left, setLeft] = useState(8);
  const [stopped, setStopped] = useState(false);
  useEffect(() => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) setStopped(true); }, []);
  useEffect(() => {
    if (stopped) return;
    if (left <= 0) { onPlay(); setStopped(true); return; }
    const timer = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left, stopped]);
  return (
    <aside className="lp-autoplay" aria-labelledby="lp-next-title" data-anchor="lp-autoplay">
      <span className="lp-ring" aria-hidden="true" style={{ '--p': stopped ? 1 : (8 - left) / 8 } as React.CSSProperties}><b>{stopped ? '▶' : left}</b></span>
      <div>
        <span className="at-eyebrow">You finished episode 2</span>
        <h2 id="lp-next-title">{stopped ? `Up next: episode ${next.n}` : `Next episode in ${left}`}</h2>
        <p className="at-muted">Ep {next.n} · {next.title} · {runtime(next.minutes)}</p>
      </div>
      <div className="lp-autoplay-actions">
        <button type="button" className="at-btn primary" onClick={() => { setStopped(true); onPlay(); }}>Play now</button>
        <ZLink className="at-btn" href={`/atlas/arena?modal=setup&prompt=${next.drill}`}>Practice episode {next.n} first</ZLink>
        {!stopped && <button type="button" className="at-btn" onClick={() => setStopped(true)}>Stay here</button>}
      </div>
    </aside>
  );
}

export function LoopSeason() {
  const state = useDemoState();
  const params = useParams();
  const now = useSimNow(5000) ?? DEFAULT_START;
  const assembling = state === 'generating';
  const [notify, setNotify] = useState(false);
  const episodes = loopSeason.episodes.map((episode) => ({ ...episode, assembling: assembling && episode.n > 3 }));
  const ready = episodes.filter((episode) => !episode.assembling);
  const reports = loopSeason.reports + (now >= NEW_REPORT_AT ? 1 : 0);
  const open = episodes.find((episode) => String(episode.n) === params.get('episode'));
  const next = episodes[2]!;

  return (
    <>
      <AtlasHeader active="Academy" />
      <main className="lp" data-anchor="lp-main">
        <section className="ab-billboard lp-billboard" aria-labelledby="lp-title" data-anchor="lp-billboard">
          <div className="ab-bb-art" aria-hidden="true"><TitleArt motif="ledger" focus={weakestArea} label={LABEL} shape="cover" /></div>
          <div className="ab-bb-copy">
            <span className="ab-new">{assembling ? 'Assembling' : 'New season'} · {ready.length} of 5 episodes</span>
            <h1 id="lp-title">{loopSeason.company}: The Loop</h1>
            <p className="ab-facts"><b className="ab-match">{loopSeason.match}% match</b><span>Season {loopSeason.season}</span><span data-anchor="lp-reports">built from {reports} member reports{now >= NEW_REPORT_AT ? ` · new ${clock(NEW_REPORT_AT)}` : ''}</span></p>
            <p className="ab-blurb">Every round of the Parallax Pay loop as an episode: what they ask, how it&apos;s graded and where people fail, straight from members who sat it this year.</p>
            <div className="ab-actions">
              <button type="button" className="at-btn primary ab-play" onClick={() => play(ready, 2)}><span aria-hidden="true">▶</span> Play episode 3</button>
              {assembling && <button type="button" className="at-btn" aria-pressed={notify} onClick={() => setNotify(!notify)} data-anchor="lp-notify">{notify ? '✓ We’ll notify you' : 'Notify me when complete'}</button>}
            </div>
          </div>
        </section>

        <div className="lp-body">
          <section className="lp-episodes" aria-labelledby="lp-ep-title" data-anchor="lp-episodes">
            <h2 id="lp-ep-title">Episodes</h2>
            <ol>
              {episodes.map((episode) => (
                <li key={episode.n} className={`lp-ep ${episode.assembling ? 'is-assembling' : ''}`}>
                  <button type="button" className="lp-ep-main" onClick={() => openLayer({ episode: String(episode.n) })} disabled={episode.assembling} aria-label={`Episode ${episode.n}: ${episode.title}${episode.assembling ? ', still assembling' : ''}`}>
                    <span className="lp-num">{episode.n}</span>
                    <span className="lp-thumb">
                      {episode.assembling ? <span className="lp-assembling">Needs 2 more reports</span> : <TitleArt motif={episode.motif} focus={weakestArea} label={episode.title} />}
                      {episode.progress > 0 && <span className="ab-card-progress" role="progressbar" aria-label="Watched" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(episode.progress * 100)}><i style={{ width: `${episode.progress * 100}%` }} /></span>}
                    </span>
                    <span className="lp-copy"><b>{episode.title}</b><small>{runtime(episode.minutes)} · {episode.pass}</small><span>{episode.assembling ? 'Two more member reports and this episode goes live.' : episode.synopsis}</span></span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <div className="lp-side">
            {!assembling && <Autoplay next={next} onPlay={() => play(ready, 2)} />}
            <section className="at-card lp-passed" aria-labelledby="lp-passed-title" data-anchor="lp-passed">
              <h2 id="lp-passed-title">Members who passed</h2>
              <p className="lp-stat"><b>{loopSeason.passed}</b> members this year · median offer <b>{loopSeason.medianOffer}</b></p>
              <ul className="at-members">{[['RM', 'Rafaela M.', 'Senior engineer · Jun'], ['TK', 'Tiago K.', 'Staff engineer · Apr'], ['LS', 'Luana S.', 'Senior engineer · Aug']].map(([initials, name, role]) => <li key={name}><span className="at-av">{initials}</span><div><strong>{name}</strong><small>{role}</small></div></li>)}</ul>
            </section>
          </div>
        </div>
      </main>

      {open && !open.assembling && (
        <Layer kind="modal" title={`Episode ${open.n} · ${open.title}`} eyebrow={`${loopSeason.company} · ${runtime(open.minutes)} · ${open.pass}`} onClose={() => closeLayers(['episode'])} width={620} anchor="lp-episode"
          footer={<><button type="button" className="at-btn primary" onClick={() => { play(ready, open.n - 1); closeLayers(['episode']); }}>Play episode</button><ZLink className="at-btn" href={`/atlas/arena?modal=setup&prompt=${open.drill}`}>Practice this in Arena</ZLink></>}>
          <div className="lp-ep-art"><TitleArt motif={open.motif} focus={weakestArea} label={open.title} /></div>
          <p>{open.synopsis}</p>
          <h3 className="lp-asked">What members were asked</h3>
          <ul className="lp-quotes">{open.asked.map((quote) => <li key={quote}><q>{quote}</q></li>)}</ul>
        </Layer>
      )}
    </>
  );
}
