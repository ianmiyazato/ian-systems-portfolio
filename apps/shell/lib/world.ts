'use client';

import { useEffect, useState } from 'react';
import { getWorld, type WorldState } from '@portfolio/world';

/** The shared world, as React state: same clock, pause and scenario as every other zone. */
export function useWorldState(): WorldState | null {
  const [state, setState] = useState<WorldState | null>(null);
  useEffect(() => {
    const world = getWorld();
    setState(world.state);
    return world.onState(setState);
  }, []);
  return state;
}

/** Sim time, refreshed every `every` ms (null until mounted, so static HTML stays deterministic). */
export function useSimNow(every = 1000): number | null {
  const state = useWorldState();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!state) return;
    const world = getWorld();
    setNow(world.now());
    if (state.paused) return;
    const id = setInterval(() => setNow(world.now()), every);
    return () => clearInterval(id);
  }, [state, every]);
  return now;
}
