import type { Topic } from '@portfolio/events/domain';
import { eventsForMinute, type Conditions, type FaultId, type Scenario, type WorldEvent } from './generate';
import { DEFAULT_START, MINUTE, parseLocalTime } from './time';

export type Speed = 0 | 1 | 10 | 60;
export const speeds: Speed[] = [1, 10, 60];

/**
 * Everything needed to reproduce the world in any tab: same seed + same anchor = same events.
 * simAt(real) = anchorSim + (real − anchorReal) × speed, unless paused.
 */
export type WorldState = Conditions & {
  speed: Exclude<Speed, 0>;
  paused: boolean;
  anchorReal: number;
  anchorSim: number;
  /** Last-writer-wins version for cross-tab sync. */
  rev: number;
  origin: string;
};

export type Batch = { events: WorldEvent[]; now: number; from: number };
type Listener = (batch: Batch) => void;
type StateListener = (state: WorldState) => void;

const STORAGE_KEY = 'portfolio:world:v1';
const ACTIONS_KEY = 'portfolio:world:actions:v1';
const MAX_ACTIONS = 120;
const CHANNEL = 'portfolio:world';
/** A stored world older than this (real time) restarts at 16:18 instead of jumping hours ahead. */
const STALE_MS = 30 * MINUTE;
const TICK_MS = 250;
const MAX_BATCH = 240;

const tabId = () => Math.random().toString(36).slice(2, 10);

export function initialState(search = '', now = Date.now()): WorldState {
  const params = new URLSearchParams(search);
  const seed = Number(params.get('seed') ?? 42) || 42;
  const start = parseLocalTime(params.get('t')) ?? DEFAULT_START;
  const speed = Number(params.get('speed'));
  return {
    seed,
    scenario: params.get('scenario') === 'black-friday' ? 'black-friday' : 'normal',
    faults: {},
    speed: speed === 10 || speed === 60 ? speed : 1,
    paused: params.get('live') === 'paused',
    anchorReal: now,
    anchorSim: start,
    rev: 0,
    origin: 'url'
  };
}

export class World {
  state: WorldState;
  private listeners = new Set<Listener>();
  private stateListeners = new Set<StateListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private cursor: number;
  private cache = new Map<number, WorldEvent[]>();
  private channel: BroadcastChannel | null = null;
  private readonly id = tabId();
  /** Events people caused (a refund, an approval). Kept per browser, shared with other tabs. */
  private actions: WorldEvent[] = [];

  constructor(state: WorldState, options: { sync?: boolean } = {}) {
    this.state = state;
    this.cursor = this.now();
    if (options.sync && typeof window !== 'undefined') {
      this.actions = loadActions(state.seed);
      this.connect();
    }
  }

  /** Current sim time (ms). */
  now(real = Date.now()) {
    const { paused, anchorSim, anchorReal, speed } = this.state;
    return paused ? anchorSim : anchorSim + (real - anchorReal) * speed;
  }

  private conditions(): Conditions {
    return { seed: this.state.seed, scenario: this.state.scenario, faults: this.state.faults };
  }

  minute(minute: number): WorldEvent[] {
    let events = this.cache.get(minute);
    if (!events) {
      events = eventsForMinute(minute, this.conditions());
      this.cache.set(minute, events);
      if (this.cache.size > 400) this.cache.delete(this.cache.keys().next().value!);
    }
    return events;
  }

  /** Events with from ≤ at < to. Derived events trail their order by up to 3 minutes. */
  between(from: number, to: number, topics?: Topic[]): WorldEvent[] {
    const out: WorldEvent[] = [];
    const first = Math.floor(from / MINUTE) - 3;
    const last = Math.floor(to / MINUTE);
    for (let minute = first; minute <= last; minute += 1) {
      for (const item of this.minute(minute)) {
        const at = Date.parse(item.at);
        if (at >= from && at < to && (!topics || topics.includes(item.topic))) out.push(item);
      }
    }
    for (const item of this.actions) {
      const at = Date.parse(item.at);
      if (at >= from && at < to && (!topics || topics.includes(item.topic))) out.push(item);
    }
    return out.sort((a, b) => a.at.localeCompare(b.at));
  }

  /**
   * Record an event a person caused, at the current sim time. It reaches every subscriber
   * immediately, every other open tab and zone over BroadcastChannel, and later queries.
   */
  record<T extends WorldEvent>(event: Omit<T, 'at' | 'id'> & { id?: string }): T {
    const full = { ...event, id: event.id ?? `act_${this.id}_${Date.now().toString(36)}`, at: new Date(this.now()).toISOString() } as T;
    this.remember(full);
    this.channel?.postMessage({ type: 'action', event: full });
    return full;
  }

  /** Actions only (newest last), e.g. for an audit log. */
  recorded(topics?: Topic[]): WorldEvent[] {
    return this.actions.filter((item) => !topics || topics.includes(item.topic));
  }

  private remember(event: WorldEvent) {
    if (this.actions.some((item) => item.id === event.id)) return;
    this.actions = [...this.actions, event].slice(-MAX_ACTIONS);
    try {
      localStorage.setItem(ACTIONS_KEY, JSON.stringify({ seed: this.state.seed, events: this.actions }));
    } catch {
      // Storage unavailable: the action still reaches this tab and the channel.
    }
    const batch = { events: [event], now: this.now(), from: this.cursor };
    for (const listener of this.listeners) listener(batch);
  }

  /** The latest `limit` events of the given topics before `before` (searches back up to 6 h). */
  recent<T extends Topic>(topics: T[], limit: number, filter?: (event: Extract<WorldEvent, { topic: T }>) => boolean, before = this.now()): Array<Extract<WorldEvent, { topic: T }>> {
    const out: Array<Extract<WorldEvent, { topic: T }>> = [];
    let to = before;
    for (let step = 0; step < 36 && out.length < limit; step += 1) {
      const from = to - 10 * MINUTE;
      const chunk = this.between(from, to, topics).filter((item) => !filter || filter(item as Extract<WorldEvent, { topic: T }>)) as Array<Extract<WorldEvent, { topic: T }>>;
      out.unshift(...chunk);
      to = from;
    }
    return out.slice(-limit);
  }

  count(topic: Topic, from: number, to: number, filter?: (event: WorldEvent) => boolean) {
    return this.between(from, to, [topic]).filter((item) => !filter || filter(item)).length;
  }

  /* Live delivery ------------------------------------------------------------------------ */

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.start();
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) this.stop();
    };
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private start() {
    if (this.timer || typeof window === 'undefined') return;
    this.cursor = this.now();
    this.timer = setInterval(() => this.tick(), TICK_MS);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /** Hidden tabs do no work; on return the world skips ahead instead of replaying a flood. */
  private onVisibility = () => {
    if (document.visibilityState === 'visible') this.cursor = Math.max(this.cursor, this.now() - MINUTE);
  };

  private tick() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const now = this.now();
    if (now <= this.cursor) return;
    const events = this.between(this.cursor, now);
    const batch = { events: events.slice(-MAX_BATCH), now, from: this.cursor };
    this.cursor = now;
    for (const listener of this.listeners) listener(batch);
  }

  /* Controls (synced across tabs and zones) ---------------------------------------------- */

  private update(patch: Partial<WorldState>) {
    const now = Date.now();
    const sim = this.now(now);
    this.state = { ...this.state, ...patch, anchorReal: now, anchorSim: patch.anchorSim ?? sim, rev: this.state.rev + 1, origin: this.id };
    if ('faults' in patch || 'scenario' in patch || 'seed' in patch) this.cache.clear();
    if (patch.anchorSim !== undefined) this.cursor = patch.anchorSim;
    this.publish();
  }

  setSpeed(speed: Exclude<Speed, 0>) { this.update({ speed, paused: false }); }
  setPaused(paused: boolean) { this.update({ paused }); }
  setScenario(scenario: Scenario) { this.update({ scenario }); }
  /** Jump the clock (scrubber / ?t=). */
  seek(sim: number) { this.update({ anchorSim: sim }); }

  /** Start or recover a fault at the current sim time (chaos panel). */
  setFault(fault: FaultId, on: boolean) {
    const now = this.now();
    const windows = [...(this.state.faults[fault] ?? [])];
    const open = windows.findIndex((window) => window.until === undefined);
    if (on && open < 0) windows.push({ since: now });
    if (!on && open >= 0) windows[open] = { ...windows[open]!, until: now };
    this.update({ faults: { ...this.state.faults, [fault]: windows } });
  }

  isFaulted(fault: FaultId, at = this.now()) {
    return (this.state.faults[fault] ?? []).some((window) => at >= window.since && (window.until === undefined || at < window.until));
  }

  reset(state: WorldState) {
    this.cache.clear();
    this.update({ ...state, anchorSim: state.anchorSim });
  }

  private publish() {
    for (const listener of this.stateListeners) listener(this.state);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage may be unavailable (private mode); tabs then keep their own world.
    }
    this.channel?.postMessage({ type: 'state', state: this.state });
  }

  private adopt(next: WorldState) {
    const newer = next.rev > this.state.rev || (next.rev === this.state.rev && next.origin > this.state.origin);
    if (!newer) return;
    const changedConditions = next.seed !== this.state.seed || next.scenario !== this.state.scenario || JSON.stringify(next.faults) !== JSON.stringify(this.state.faults);
    this.state = next;
    if (changedConditions) this.cache.clear();
    this.cursor = Math.min(this.cursor, this.now());
    for (const listener of this.stateListeners) listener(this.state);
  }

  /** BroadcastChannel keeps every open tab and zone on the same world. */
  private connect() {
    if (typeof BroadcastChannel === 'undefined') return;
    this.channel = new BroadcastChannel(CHANNEL);
    this.channel.onmessage = (message: MessageEvent<{ type: string; state?: WorldState; event?: WorldEvent }>) => {
      if (message.data.type === 'state' && message.data.state) this.adopt(message.data.state);
      if (message.data.type === 'action' && message.data.event) this.remember(message.data.event);
      if (message.data.type === 'hello' && this.state.rev > 0) this.channel?.postMessage({ type: 'state', state: this.state });
    };
    this.channel.postMessage({ type: 'hello' });
  }
}

function loadActions(seed: number): WorldEvent[] {
  try {
    const stored = JSON.parse(localStorage.getItem(ACTIONS_KEY) ?? 'null') as { seed: number; events: WorldEvent[] } | null;
    return stored && stored.seed === seed && Array.isArray(stored.events) ? stored.events : [];
  } catch {
    return [];
  }
}

/** Reuse the world stored by another zone (full page loads between zones) unless the URL pins one. */
export function restoreState(search: string, now = Date.now()): WorldState {
  const params = new URLSearchParams(search);
  const pinned = ['seed', 't', 'speed', 'scenario', 'live'].some((key) => params.has(key));
  const fresh = initialState(search, now);
  if (pinned) return fresh;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as WorldState | null;
    if (stored && typeof stored.anchorSim === 'number' && now - stored.anchorReal < STALE_MS) return stored;
  } catch {
    // Corrupt or unavailable storage: start fresh.
  }
  return fresh;
}

const globalKey = '__imWorld';

/** One world per page, shared by every remote, island and component on it. */
export function getWorld(): World {
  const host = globalThis as unknown as Record<string, World | undefined>;
  if (!host[globalKey]) {
    const search = typeof location === 'undefined' ? '' : location.search;
    host[globalKey] = new World(typeof window === 'undefined' ? initialState(search) : restoreState(search), { sync: true });
  }
  return host[globalKey]!;
}
