'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZLink } from '@/components/zone-link';
import { AiSurface, Layer, closeLayers, openLayer, useDemoState, useParams } from '@/components/overlay';
import { prompts, rubric, transcript } from '@/lib/atlas';
import { AtlasHeader } from './header';
import { usePlan } from './plan';

const kinds = ['All', 'System design', 'Coding', 'Behavioral', 'Estimation'] as const;

export function ArenaLibrary() {
  const params = useParams();
  const state = useDemoState();
  const [plan] = usePlan();
  const [kind, setKind] = useState<(typeof kinds)[number]>('All');
  const promptId = params.get('prompt');
  const selected = prompts.find((prompt) => prompt.id === promptId) ?? prompts[0]!;
  const list = prompts.filter((prompt) => kind === 'All' || prompt.kind === kind);
  return (
    <>
      <AtlasHeader active="Arena" />
      <main className="at-main">
        <header className="at-head" data-anchor="at-arena-head">
          <div><span className="at-eyebrow">Arena · prompt library</span><h1>Practice the interview you&apos;re about to have</h1></div>
          <ZLink className="at-btn mx-entry" href="/atlas/arena/mix/today" data-anchor="at-mix-entry"><span aria-hidden="true">▶</span> Your mix today</ZLink>
          <span className="at-quota" data-anchor="at-quota">{plan === 'Pro' ? 'Unlimited sessions' : state === 'limit' ? '0 of 3 free sessions left' : '2 of 3 free sessions left'}</span>
        </header>
        {state === 'limit' && <p className="at-banner warn" data-anchor="at-limit">Session limit reached for September · resets Oct 1. <ZLink href="/atlas/academy/designing-for-10x?modal=paywall">Go Pro for unlimited practice</ZLink></p>}
        <div className="at-filters" role="group" aria-label="Filter prompts" data-anchor="at-filters">
          {kinds.map((item) => <button key={item} type="button" aria-pressed={kind === item} onClick={() => setKind(item)}>{item}</button>)}
        </div>
        <div className="at-prompts" data-anchor="at-prompts">
          {list.map((prompt, index) => {
            const locked = prompt.locked && plan !== 'Pro';
            return (
              <button key={prompt.id} type="button" className={`at-prompt ${locked ? 'locked' : ''}`} style={{ '--i': index } as React.CSSProperties}
                onClick={() => (locked ? openLayer({ modal: 'locked' }) : openLayer({ modal: 'setup', prompt: prompt.id }))} data-anchor={prompt.id === 'payments-ledger' ? 'at-prompt-ledger' : undefined}>
                <span className="at-kind">{prompt.kind} · {prompt.level}</span>
                <strong>{prompt.title}</strong>
                {prompt.company && <small className="at-asked">{prompt.company}</small>}
                <footer><span>{prompt.minutes} min</span>{locked ? <span className="at-lock-pill">Pro</span> : prompt.last ? <b className={prompt.last < 65 ? 'low' : ''}>last {prompt.last}</b> : <span>new</span>}</footer>
              </button>
            );
          })}
        </div>
      </main>
      {params.get('modal') === 'setup' && <Setup title={selected.title} limit={state === 'limit' && plan !== 'Pro'} />}
      {params.get('modal') === 'locked' && (
        <Layer kind="modal" title="Multi-region failover is a Pro prompt" onClose={() => closeLayers(['modal'])} width={460}
          footer={<ZLink className="at-btn primary" href="/atlas/academy/designing-for-10x?modal=paywall">See plans</ZLink>}>
          <p className="at-muted">Staff-level prompts come with a grounding lesson and a bar-raiser interviewer.</p>
        </Layer>
      )}
    </>
  );
}

function Setup({ title, limit }: { title: string; limit: boolean }) {
  const router = useRouter();
  const [style, setStyle] = useState('Friendly');
  const [mode, setMode] = useState('Voice');
  const [minutes, setMinutes] = useState('45');
  return (
    <Layer kind="modal" title="Session setup" eyebrow={title} onClose={() => closeLayers(['modal', 'prompt'])} width={560} anchor="at-setup"
      footer={<><span className="at-muted at-remaining">{limit ? 'No free sessions left this month' : '2 of 3 free sessions left'}</span><button type="button" className="at-btn primary" disabled={limit} onClick={() => router.push('/atlas/arena/session/14')}>Start session</button></>}>
      <fieldset className="at-seg" data-anchor="at-setup-style"><legend>Interviewer style</legend>{['Friendly', 'Neutral', 'Bar-raiser'].map((value) => <button key={value} type="button" aria-pressed={style === value} onClick={() => setStyle(value)}>{value}</button>)}</fieldset>
      <fieldset className="at-seg"><legend>Mode</legend>{['Voice', 'Text'].map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{value}</button>)}</fieldset>
      <fieldset className="at-seg"><legend>Duration</legend>{['30', '45', '60'].map((value) => <button key={value} type="button" aria-pressed={minutes === value} onClick={() => setMinutes(value)}>{value} min</button>)}</fieldset>
      <label className="at-input" data-anchor="at-setup-grounding">Grounding lesson<select defaultValue="10x"><option value="10x">Designing for 10× · Academy</option><option value="ledgers">Ledgers and double entry · Members</option><option value="none">None</option></select></label>
    </Layer>
  );
}

const baseNodes = [{ id: 'api', label: 'Payments API', x: 8, y: 40 }, { id: 'ledger', label: 'Ledger service', x: 38, y: 40 }, { id: 'db', label: 'Postgres · entries', x: 70, y: 18 }, { id: 'outbox', label: 'Outbox → events', x: 70, y: 66 }];

export function ArenaSession() {
  const [nodes, setNodes] = useState(baseNodes);
  const [lines, setLines] = useState(transcript.slice(0, 3).map((line) => ({ ...line })));
  const [streaming, setStreaming] = useState('');
  const [elapsed, setElapsed] = useState(31 * 60 + 42);
  const logRef = useRef<HTMLOListElement>(null);
  useEffect(() => { const id = setInterval(() => setElapsed((value) => value + 1), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [lines, streaming]);

  const addCache = () => {
    if (nodes.some((node) => node.id === 'cache')) return;
    setNodes([...nodes, { id: 'cache', label: 'Redis · balance cache', x: 38, y: 80 }]);
    setLines((list) => [...list, { t: clock(elapsed), who: 'You', text: 'I’ll put a read-through cache in front of balances.' }]);
    const reply = 'Good. How will you keep the cached balance consistent when a payment is reversed?';
    const words = reply.split(' ');
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      setStreaming(words.slice(0, count).join(' '));
      if (count >= words.length) { clearInterval(id); setStreaming(''); setLines((list) => [...list, { t: clock(elapsed + 4), who: 'Interviewer', text: reply }]); }
    }, 70);
  };

  return (
    <>
      <AtlasHeader active="Arena" />
      <main className="at-main at-session">
        <header className="at-head" data-anchor="at-session-head">
          <div><span className="at-eyebrow">Arena · session 14 · friendly interviewer · voice</span><h1>Design a payments ledger</h1></div>
          <div className="at-timer" aria-label="Elapsed time"><b>{clock(elapsed)}</b><span>/ 45:00</span></div>
        </header>
        <div className="at-session-grid">
          <section className="at-card at-interviewer" data-anchor="at-interviewer" aria-labelledby="int-title">
            <div className="at-voice" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} />)}</div>
            <h2 id="int-title">Interviewer <span className="ai-badge">Simulated AI</span></h2>
            <ol className="at-transcript" ref={logRef} aria-live="polite" tabIndex={0} aria-label="Session transcript">
              {lines.map((line, index) => <li key={index} className={line.who === 'You' ? 'you' : ''}><time>{line.t}</time><p>{line.text}</p></li>)}
              {streaming && <li><time>{clock(elapsed)}</time><p className="caret">{streaming}</p></li>}
            </ol>
          </section>
          <section className="at-card at-canvas" data-anchor="at-whiteboard" aria-labelledby="board-title">
            <header><h2 id="board-title">Whiteboard</h2><button type="button" className="at-btn primary" onClick={addCache} disabled={nodes.some((node) => node.id === 'cache')} data-anchor="at-add-cache">Add cache node</button></header>
            <div className="at-wb">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M22,46 H38" /><path d="M58,46 C64,46 64,26 70,24" /><path d="M58,46 C64,46 64,68 70,70" />
                {nodes.some((node) => node.id === 'cache') && <path className="new" d="M48,54 V80" />}
              </svg>
              {nodes.map((node) => <div key={node.id} className={`at-wb-node ${node.id === 'cache' ? 'new' : ''}`} style={{ left: `${node.x}%`, top: `${node.y}%` }}>{node.label}</div>)}
            </div>
          </section>
          <aside className="at-card at-live-rubric" data-anchor="at-live-rubric">
            <h2>Live rubric</h2>
            <ul>{rubric.map((row) => <li key={row.id} className={row.id === 'estimation' ? 'partial' : row.score >= 3 ? 'ok' : ''}><span>{row.label}</span><b>{row.id === 'estimation' ? '…' : row.score >= 3 ? '✓' : '·'}</b></li>)}</ul>
            <ZLink className="at-btn wide" href="/atlas/arena/sessions/14">End session</ZLink>
          </aside>
        </div>
      </main>
    </>
  );
}

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => { const progress = Math.min(1, Math.max(0, (now - start) / duration)); setShown(Math.round(value * (1 - (1 - progress) ** 3))); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{shown}</>;
}

export function Feedback() {
  const params = useParams();
  const state = useDemoState();
  const generating = state === 'generating';
  const drawer = params.get('drawer') === 'transcript';
  const t = params.get('t') ?? '31:30';
  return (
    <>
      <AtlasHeader active="Arena" />
      <main className="at-main">
        <header className="at-head" data-anchor="at-feedback-head">
          <div><span className="at-eyebrow">Arena · session 14 · Design a payments ledger</span><h1>System design feedback</h1></div>
          <div className="at-score" data-anchor="at-score" aria-label="Overall score 78 out of 100">{generating ? <span className="skeleton at-score-sk" /> : <><b><CountUp value={78} /></b><span>/100</span></>}</div>
        </header>
        {generating && <p className="at-banner info" data-anchor="at-generating"><span className="caret">Grading your transcript · 4 of 6 rubric lines scored</span></p>}
        <div className="at-grid">
          <section className="at-card span-2" aria-labelledby="rubric-title" data-anchor="at-rubric">
            <h2 id="rubric-title">Rubric · click a line to see the evidence</h2>
            <ol className="at-rubric">
              {rubric.map((row, index) => (
                <li key={row.id} className={row.weak ? 'weak' : ''}>
                  {generating && index > 3 ? <div className="skeleton at-row-sk" aria-hidden="true" /> : (
                    <button type="button" onClick={() => openLayer({ drawer: 'transcript', t: row.t })}>
                      <span className="at-rubric-label">{row.label}</span>
                      <span className="at-dots" aria-label={`${row.score} of 4`}>{[1, 2, 3, 4].map((dot) => <i key={dot} className={dot <= row.score ? 'on' : ''} />)}</span>
                      <small>{row.note}</small>
                      <time>{row.t}</time>
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </section>
          <AiSurface title="Grader summary" meta="rubric v3 · cites timestamps" anchor="at-grader" sources={[{ label: 'transcript · 42 turns', score: 0.94 }, { label: 'rubric · senior', score: 0.9 }]}
            actions={<ZLink className="ai-approve" href="/atlas/arena?modal=setup&prompt=estimate-storage">Practice estimation drill</ZLink>}>
            Strong framing and data model. Estimation is the gap: at 31:30 you sized storage without a write rate or retention. That&apos;s the most likely follow-up at Parallax Pay.
          </AiSurface>
        </div>
      </main>
      {drawer && (
        <Layer kind="drawer" title="Transcript" eyebrow={`Estimation · cited at ${t}`} onClose={() => closeLayers(['drawer', 't'])} width={520} anchor="at-transcript"
          footer={<><button type="button" className="at-btn">Replay audio</button><ZLink className="at-btn primary" href="/atlas/arena?modal=setup&prompt=estimate-storage">Practice estimation drill</ZLink></>}>
          <TranscriptLines t={t} />
          <section className="at-card at-model-answer" data-anchor="at-model-answer">
            <h3>What a 4/4 answer does</h3>
            <p>States the write rate (e.g. 2k entries/s at peak), multiplies by entry size and retention (7 years for audit), adds replication and index overhead, then checks the 10× case before choosing a partitioning scheme.</p>
          </section>
        </Layer>
      )}
    </>
  );
}

function TranscriptLines({ t }: { t: string }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => { ref.current?.querySelector('.cited')?.scrollIntoView({ block: 'center' }); }, [t]);
  return (
    <ol className="at-transcript full" ref={ref}>
      {transcript.map((line) => <li key={line.t} className={`${line.who === 'You' ? 'you' : ''} ${line.t === t ? 'cited' : ''} ${line.weak ? 'weak' : ''}`}><time>{line.t}</time><strong>{line.who}</strong><p>{line.text}</p></li>)}
    </ol>
  );
}
