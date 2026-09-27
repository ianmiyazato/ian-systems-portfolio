'use client';

import { useMemo } from 'react';
import { DEFAULT_START, getWorld, problems, type World } from '@portfolio/world';
import { useSimNow, useWorldState } from './world';

/** Tidewatch reads the shared world: same faults, same clock, same recoveries as every zone. */
export function useTelemetry(every = 2000): { world: World | null; now: number } {
  const state = useWorldState();
  const now = useSimNow(every) ?? DEFAULT_START;
  const world = state ? getWorld() : null;
  return { world, now };
}

export function useProblems() {
  const { world, now } = useTelemetry();
  return useMemo(() => (world ? problems(world, now) : []), [world, now, world?.state]);
}
