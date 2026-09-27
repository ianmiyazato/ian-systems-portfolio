import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Action, Board } from './board';

export type FeedStatus = 'local' | 'connecting' | 'live' | 'error';
export type CounterContextValue = {
  board: Board;
  act: (action: Action) => void;
  feedStatus: FeedStatus;
  emit: () => void;
  basePath: string;
  /** "Live across tabs" uses Supabase Broadcast; off by default so the free tier stays idle. */
  acrossTabs: boolean;
  supabaseReady: boolean;
  toggleAcrossTabs: () => void;
};

/** One board for every Counter view (lanes, picking, returns, stock), owned by the page. */
export const CounterContext = createContext<CounterContextValue | null>(null);

export function useCounter() {
  const value = useContext(CounterContext);
  if (!value) throw new Error('Counter views render inside <CounterContext.Provider>');
  return value;
}
