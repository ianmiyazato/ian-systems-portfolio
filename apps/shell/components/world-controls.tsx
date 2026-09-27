'use client';

import { DEFAULT_START, clock, getWorld, localHour, parseLocalTime, speeds } from '@portfolio/world';
import { useSimNow, useWorldState } from '@/lib/world';

const pad = (value: number) => String(value).padStart(2, '0');

/** World clock controls for the system-design pages: pause, 1×/10×/60×, scrub the day, Black Friday. */
export function WorldControls({ anchor }: { anchor?: string }) {
  const state = useWorldState();
  const now = useSimNow(1000) ?? DEFAULT_START;
  const minutes = Math.round(localHour(now) * 60);
  const world = () => getWorld();
  return (
    <div className="world-controls" role="group" aria-label="World clock" data-anchor={anchor}>
      <time aria-live="off">{clock(now, true)}</time>
      <button type="button" aria-pressed={Boolean(state?.paused)} onClick={() => world().setPaused(!state?.paused)}>{state?.paused ? 'Resume' : 'Pause'}</button>
      {speeds.map((value) => <button key={value} type="button" aria-pressed={!state?.paused && state?.speed === value} onClick={() => world().setSpeed(value)}>{value}×</button>)}
      <label>
        <span className="visually-hidden">Time of day</span>
        <input type="range" min={360} max={1439} value={Math.max(360, minutes)} aria-valuetext={clock(now)}
          onChange={(event) => {
            const value = Number(event.currentTarget.value);
            const target = parseLocalTime(`${pad(Math.floor(value / 60))}:${pad(value % 60)}`, now);
            if (target) world().seek(target);
          }} />
      </label>
      <button type="button" aria-pressed={state?.scenario === 'black-friday'} onClick={() => world().setScenario(state?.scenario === 'black-friday' ? 'normal' : 'black-friday')}>Black Friday 3.4×</button>
    </div>
  );
}
