/**
 * Now-playing store (no DOM classes, safe to import during server rendering). The shared now-playing bar: one custom element for every stack (Next in Atlas, SvelteKit in Pulse).
 * State lives in sessionStorage, so playback survives client navigation, full reloads and zone switches.
 * Nothing is streamed: "playing" advances a position on the clock and the UI shows it (no audio bytes).
 */
export type Track = { id: string; title: string; subtitle: string; seconds: number; cover: string; kind?: string };
export type NowPlaying = { source: string; label: string; href: string; queue: Track[]; index: number; playing: boolean; position: number; at: number };

const KEY = 'im:now-playing';
const EVENT = 'im:now-playing';

function read(): NowPlaying | null {
  try {
    const state = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as NowPlaying | null;
    return state && Array.isArray(state.queue) && state.queue.length ? state : null;
  } catch {
    return null;
  }
}

function write(state: NowPlaying | null) {
  try {
    if (state) sessionStorage.setItem(KEY, JSON.stringify(state));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: the bar still works for this page.
  }
  memory = state;
  window.dispatchEvent(new CustomEvent(EVENT));
}

let memory: NowPlaying | null = null;

/** Current state with the position advanced by the time spent playing. */
export function nowPlaying(): NowPlaying | null {
  const state = read() ?? memory;
  if (!state) return null;
  if (!state.playing) return state;
  let { index, position } = state;
  position += (Date.now() - state.at) / 1000;
  while (index < state.queue.length && position >= state.queue[index]!.seconds) {
    position -= state.queue[index]!.seconds;
    index += 1;
  }
  if (index >= state.queue.length) return { ...state, index: state.queue.length - 1, position: state.queue.at(-1)!.seconds, playing: false };
  return { ...state, index, position };
}

const settle = (patch: Partial<NowPlaying>) => {
  const state = nowPlaying();
  if (!state) return;
  write({ ...state, ...patch, at: Date.now() });
};

export function playQueue(source: string, label: string, href: string, queue: Track[], index = 0) {
  write({ source, label, href, queue, index, playing: true, position: 0, at: Date.now() });
}
export const togglePlay = () => settle({ playing: !nowPlaying()?.playing });
export function step(delta: number) {
  const state = nowPlaying();
  if (!state) return;
  // "Previous" restarts the track when you're more than 3 s in, like every player.
  if (delta < 0 && state.position > 3) return settle({ position: 0 });
  settle({ index: Math.min(state.queue.length - 1, Math.max(0, state.index + delta)), position: 0 });
}
export const seek = (position: number) => settle({ position });
export const stopPlaying = () => write(null);
export function onNowPlaying(listener: () => void) {
  window.addEventListener(EVENT, listener);
  const storage = (event: StorageEvent) => event.key === KEY && listener();
  window.addEventListener('storage', storage);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener('storage', storage); };
}

