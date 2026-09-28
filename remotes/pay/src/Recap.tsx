import { Layer, Link, closeLayers, getWorld, openLayer, useParam } from '@portfolio/remote-runtime';
import { MINUTE, clock } from '@portfolio/world';
import { useEffect, useMemo, useState } from 'preact/hooks';

const KEY = 'pay:last-visit';
const FRAME_MS = 5000;
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type Frame = { id: string; kicker: string; big: string; text: string; href: string; cta: string; tone: 'info' | 'warn' | 'risk' | 'ok' };

/** When the reviewer last opened Pay (sim time), or two hours ago on a first visit. */
function readSince(now: number) {
  try {
    const stored = Number(localStorage.getItem(KEY));
    if (stored && stored < now) return { since: stored, returning: now - stored > 20 * MINUTE };
  } catch { /* storage unavailable: treat as a first visit */ }
  return { since: now - 120 * MINUTE, returning: false };
}

function framesSince(since: number, now: number): Frame[] {
  const world = getWorld();
  const orders = world.between(since, now, ['orders.placed']).filter((event) => event.topic === 'orders.placed' && (event.payload.payment === 'pay-credit' || event.payload.payment === 'pay-store'));
  const arrived = Math.max(3, Math.round(orders.length / 5));
  const saturated = world.isFaulted('db-pool', now);
  return [
    { id: 'queue', kicker: 'Applications', big: `${arrived} new`, text: `${arrived} credit applications arrived since ${clock(since)}. Most were decided automatically; the review band holds the rest, oldest waiting 41 min.`, href: '/mare/ops/pay', cta: 'Review the queue', tone: 'info' },
    saturated
      ? { id: 'latency', kicker: 'Scoring', big: '214 ms', text: 'Scoring p95 is up from 84 ms: credit shares the Orders DB, and its pool has been saturated since 16:02 (deploy #812). Decisions still land inside the 400 ms budget.', href: '/observability', cta: 'Open P-812 in Tidewatch', tone: 'risk' }
      : { id: 'latency', kicker: 'Scoring', big: '84 ms', text: 'Scoring p95 is back to normal after the Orders DB pool recovered.', href: '/observability', cta: 'See the recovery', tone: 'ok' },
    { id: 'disputes', kicker: 'Disputes', big: '2 due', text: 'Two chargebacks are due to the card network within 24 hours. One has an evidence pack ready for your approval.', href: '/mare/ops/pay/disputes', cta: 'Open disputes', tone: 'warn' },
    { id: 'drift', kicker: 'Models', big: 'PSI 0.18', text: 'Drift on the 18–24 cohort rose from 0.11. It warns at 0.20; the challenger is still routing 10%.', href: '/mare/ops/pay/models', cta: 'Open the drift report', tone: 'warn' },
    { id: 'policy', kicker: 'Policies', big: 'v8', text: 'Policy v8 has one approval and needs a second approver before it goes live.', href: '/mare/ops/pay/policies', cta: 'Review v8', tone: 'info' }
  ];
}

/** The ring chip in the header: always there, and it opens the recap. */
export function RecapChip({ count, since }: { count: number; since: number }) {
  return (
    <button type="button" class="py-recap-chip" onClick={() => openLayer({ recap: '1' })} data-anchor="py-recap-chip">
      <span class="py-recap-ring" aria-hidden="true">{count}</span>
      What changed since {clock(since)}
    </button>
  );
}

/** Story-style "what changed since you left": one card per change, progress bars, tap or arrow keys. */
export function useRecap() {
  const open = useParam('recap') === '1';
  const [{ since, returning }] = useState(() => readSince(getWorld().now()));
  const frames = useMemo(() => framesSince(since, getWorld().now()), [since]);

  useEffect(() => {
    // Opening Pay after a while away plays the recap once per session; the chip replays it any time.
    let shown = false;
    try { shown = sessionStorage.getItem('pay:recap-shown') === '1'; } catch { /* ignore */ }
    if (returning && !shown && !new URLSearchParams(location.search).has('state')) {
      try { sessionStorage.setItem('pay:recap-shown', '1'); } catch { /* ignore */ }
      openLayer({ recap: '1' });
    }
    const save = () => { try { localStorage.setItem(KEY, String(getWorld().now())); } catch { /* per-viewer convenience only */ } };
    save();
    window.addEventListener('pagehide', save);
    return () => { save(); window.removeEventListener('pagehide', save); };
  }, []);

  return { open, since, frames };
}

export function Recap({ frames, since }: { frames: Frame[]; since: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const close = () => closeLayers(['recap']);
  const go = (next: number) => (next >= frames.length ? close() : setIndex(Math.max(0, next)));

  useEffect(() => {
    if (paused || reduce) return;
    const timer = window.setTimeout(() => go(index + 1), FRAME_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(index + 1);
      if (event.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  const frame = frames[index]!;
  return (
    <Layer kind="modal" title="What changed since you left" eyebrow={`Since ${clock(since)} · ${index + 1} of ${frames.length}`} onClose={close} width={420} anchor="py-recap" className="py-recap">
      <div class="py-recap-bars" aria-hidden="true">
        {frames.map((item, position) => <span key={item.id}><i class={position < index ? 'done' : position === index && !paused && !reduce ? 'now' : position === index ? 'done' : ''} style={{ animationDuration: `${FRAME_MS}ms` }} /></span>)}
      </div>
      <article class={`py-recap-card ${frame.tone}`} key={frame.id} aria-live="polite">
        <span class="py-eyebrow">{frame.kicker}</span>
        <strong>{frame.big}</strong>
        <p>{frame.text}</p>
        {frame.href.startsWith('/observability') ? <a class="py-btn primary" href={frame.href}>{frame.cta}</a> : <Link class="py-btn primary" href={frame.href}>{frame.cta}</Link>}
      </article>
      <div class="py-recap-nav">
        <button type="button" class="py-btn" onClick={() => go(index - 1)} disabled={index === 0}>Previous</button>
        <button type="button" class="py-btn" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Play' : 'Pause'}</button>
        <button type="button" class="py-btn" onClick={() => go(index + 1)}>{index === frames.length - 1 ? 'Done' : 'Next'}</button>
      </div>
    </Layer>
  );
}
