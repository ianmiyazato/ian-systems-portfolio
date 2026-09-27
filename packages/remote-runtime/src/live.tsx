import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ago, clock, getWorld, type Topic, type World, type WorldEvent, type WorldState } from '@portfolio/world';
import { prefersReducedMotion, useTween } from './hooks';

export { getWorld };
export type { WorldEvent };
type Of<T extends Topic> = Extract<WorldEvent, { topic: T }>;

/** The shared world and its synced state (speed, pause, faults). */
export function useWorld(): { world: World; state: WorldState } {
  const world = getWorld();
  const [state, setState] = useState(world.state);
  useEffect(() => world.onState(setState), [world]);
  return { world, state };
}

/** Sim time, refreshed every `every` ms of real time (clocks, countdowns, freshness). */
export function useSimNow(every = 1000) {
  const { world, state } = useWorld();
  const [now, setNow] = useState(() => world.now());
  useEffect(() => {
    setNow(world.now());
    if (state.paused) return;
    const id = setInterval(() => setNow(world.now()), every);
    return () => clearInterval(id);
  }, [world, state, every]);
  return now;
}

type LiveOptions<T extends Topic> = { limit?: number; filter?: (event: Of<T>) => boolean; seed?: number };

/**
 * A live list: the latest `limit` events of these topics (newest first), then every new one as
 * the world produces it. `fresh` marks rows that just arrived so they can slide in and flash.
 */
export function useLiveEvents<T extends Topic>(topics: T[], options: LiveOptions<T> = {}) {
  const { limit = 12, filter } = options;
  const world = getWorld();
  const key = topics.join(',');
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const [items, setItems] = useState<Array<Of<T>>>(() => world.recent(topics, limit, filter).reverse());
  const [fresh, setFresh] = useState<string[]>([]);
  const [lastAt, setLastAt] = useState<number>(() => Date.now());

  useEffect(() => {
    setItems(world.recent(topics, limit, filterRef.current).reverse());
    return world.subscribe(({ events }) => {
      const incoming = events.filter((event) => (topics as string[]).includes(event.topic) && (!filterRef.current || filterRef.current(event as Of<T>))) as Array<Of<T>>;
      if (!incoming.length) return;
      setItems((current) => [...incoming.reverse(), ...current.filter((item) => !incoming.some((next) => next.id === item.id))].slice(0, limit));
      setFresh(incoming.slice(0, 4).map((event) => event.id));
      setLastAt(Date.now());
    });
    // topics are compared by key; filter is read through a ref.
  }, [world, key, limit]);

  return { items, fresh, lastAt };
}

/** Run a callback for each new event of these topics (counters, reducers, toasts). */
export function useWorldEvents<T extends Topic>(topics: T[], onEvent: (event: Of<T>) => void) {
  const world = getWorld();
  const callback = useRef(onEvent);
  callback.current = onEvent;
  const key = topics.join(',');
  useEffect(
    () =>
      world.subscribe(({ events }) => {
        for (const event of events) if ((topics as string[]).includes(event.topic)) callback.current(event as Of<T>);
      }),
    [world, key]
  );
}

/** Count of events since `since` (sim ms) that keeps rising as the world runs. */
export function useLiveCount(topic: Topic, since: number, filter?: (event: WorldEvent) => boolean) {
  const world = getWorld();
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const [value, setValue] = useState(() => world.count(topic, since, world.now(), filter));
  useEffect(() => {
    setValue(world.count(topic, since, world.now(), filterRef.current));
    return world.subscribe(({ events }) => {
      const added = events.filter((event) => event.topic === topic && (!filterRef.current || filterRef.current(event))).length;
      if (added) setValue((current) => current + added);
    });
  }, [world, topic, since]);
  return value;
}

/* Components ------------------------------------------------------------------------------ */

/** Tweened number (KPIs). Formats on every frame; instant under reduced motion. */
export function Tween({ value, format = (next) => Math.round(next).toLocaleString('en-US') }: { value: number; format?: (value: number) => string }) {
  const shown = useTween(value, 700);
  return <>{format(shown)}</>;
}

/** "updated 3 s ago", re-rendered every second. */
export function Freshness({ at, prefix = 'updated' }: { at: number; prefix?: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span class="live-fresh">{prefix} {ago(Date.now() - at)}</span>;
}

/** Polite, throttled announcements for screen readers (at most one every `gap` ms). */
export function useAnnouncer(gap = 10_000) {
  const [message, setMessage] = useState('');
  const last = useRef(0);
  const announce = (text: string) => {
    const now = Date.now();
    if (now - last.current < gap) return;
    last.current = now;
    setMessage(text);
  };
  const region = (
    <div class="visually-hidden" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
  return { announce, region };
}

/**
 * The live control every live screen shows: world clock, speed and "Pause live updates"
 * (WCAG 2.2.2). Pausing freezes the shared world in every open tab and zone.
 */
export function LiveControl({ label = 'Live', anchor, children }: { label?: string; anchor?: string; children?: ComponentChildren }) {
  const { world, state } = useWorld();
  const now = useSimNow();
  return (
    <div class={`live-control ${state.paused ? 'is-paused' : ''}`} data-anchor={anchor} data-live={state.paused ? 'paused' : 'running'}>
      <i class="live-dot" aria-hidden="true" />
      <span class="live-label">{state.paused ? 'Paused' : label}</span>
      <time class="live-clock">{clock(now, true)}</time>
      {state.speed !== 1 && !state.paused && <span class="live-speed">{state.speed}×</span>}
      {children}
      <button type="button" class="live-pause" aria-pressed={state.paused} onClick={() => world.setPaused(!state.paused)}>
        {state.paused ? 'Resume live updates' : 'Pause live updates'}
      </button>
    </div>
  );
}

/** A tiny sparkline from a rolling series; the path shifts left as values arrive. */
export function Sparkline({ values, width = 96, height = 28, label }: { values: number[]; width?: number; height?: number; label?: string }) {
  const path = useMemo(() => {
    if (values.length < 2) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    return values.map((value, index) => `${index ? 'L' : 'M'}${((index / (values.length - 1)) * width).toFixed(1)},${(height - 2 - ((value - min) / span) * (height - 4)).toFixed(1)}`).join(' ');
  }, [values, width, height]);
  return (
    <svg class="live-spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={path} />
    </svg>
  );
}

/** Rolling per-interval counts of a topic (e.g. auths per 10 s), for sparklines. */
export function useRollingSeries(topic: Topic, bucketMs = 60_000, length = 24, filter?: (event: WorldEvent) => boolean) {
  const world = getWorld();
  const now = useSimNow(2000);
  return useMemo(() => {
    const end = Math.floor(now / bucketMs) * bucketMs;
    return Array.from({ length }, (_, index) => {
      const from = end - (length - index) * bucketMs;
      return world.count(topic, from, from + bucketMs, filter);
    });
    // Recomputes as the sim clock moves; minute generation is cached by the world.
  }, [world, topic, Math.floor(now / bucketMs), bucketMs, length]);
}

/** A countdown to a sim-time deadline: "14 min", turning urgent under `warnMs`. */
export function useCountdown(deadline: number) {
  const now = useSimNow();
  return deadline - now;
}

export const reducedMotion = prefersReducedMotion;
