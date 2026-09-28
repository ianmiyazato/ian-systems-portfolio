'use client';

import { getWorld, clock } from '@portfolio/world';
import { useSimNow, useWorldState } from '@/lib/world';

/** The same live control the remotes show: world clock, speed and "Pause live updates" (WCAG 2.2.2). */
export function LiveControl({ label = 'Live', anchor }: { label?: string; anchor?: string }) {
  const state = useWorldState();
  const now = useSimNow();
  const paused = state?.paused ?? false;
  return (
    <div className={`live-control ${paused ? 'is-paused' : ''}`} data-anchor={anchor} data-live={paused ? 'paused' : 'running'}>
      <i className="live-dot" aria-hidden="true" />
      <span className="live-label">{paused ? 'Paused' : label}</span>
      <time className="live-clock">{now === null ? '16:18:00' : clock(now, true)}</time>
      {state && state.speed !== 1 && !paused && <span className="live-speed">{state.speed}×</span>}
      <button type="button" className="live-pause" aria-pressed={paused} onClick={() => getWorld().setPaused(!paused)}>
        {paused ? 'Resume live updates' : 'Pause live updates'}
      </button>
    </div>
  );
}
