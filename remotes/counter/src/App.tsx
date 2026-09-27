import type { RemoteContext, ViewTable } from '@portfolio/remote-runtime';
import { ViewRouter, openFeed, useWorldEvents } from '@portfolio/remote-runtime';
import type { CounterOrder } from '@portfolio/mocks';
import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { initialBoard, nextLiveOrder, reduce, type Action } from './board';
import { fromWorld, isCounterOrder } from './live';
import { CounterContext, type FeedStatus } from './context';
import { TopBar } from './TopBar';
import { Tile } from './Tile';
import { Lanes } from './Lanes';
import { Picking } from './Picking';
import { Returns } from './Returns';
import { Stock } from './Stock';

export type { FeedStatus };

/** Every Counter view in routes.manifest.ts, and nothing else (TypeScript checks both ways). */
const views: ViewTable<'counter'> = {
  orders: () => <Lanes />,
  picking: ({ rest }) => <Picking orderId={rest[0] ?? 'MR-904117'} />,
  returns: () => <Returns />,
  stock: () => <Stock />
};

export function App({ ctx }: { ctx: RemoteContext }) {
  if (ctx.mode === 'tile') return <Tile />;
  return <Page ctx={ctx} />;
}

const ACROSS_KEY = 'counter:live-across-tabs';

function Page({ ctx }: { ctx: RemoteContext }) {
  const [board, dispatch] = useReducer(reduce, undefined, initialBoard);
  const [status, setStatus] = useState<FeedStatus>('local');
  const supabaseReady = Boolean(ctx.data.supabaseUrl && ctx.data.supabaseKey);
  const [acrossTabs, setAcrossTabs] = useState(() => {
    try {
      return supabaseReady && localStorage.getItem(ACROSS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const feed = useRef<ReturnType<typeof openFeed<CounterOrder>> | null>(null);

  // Orders for this store arrive from the world simulation: every open tab computes the same ones.
  useWorldEvents(['orders.placed'], (event) => {
    if (isCounterOrder(event)) dispatch({ type: 'created', order: fromWorld(event) });
  });

  // Free tier: Supabase Broadcast opens only when someone asks for "Live across tabs", only
  // while the tab is visible, and closes the moment it is hidden. Otherwise BroadcastChannel.
  useEffect(() => {
    const data = acrossTabs && supabaseReady ? { ...ctx.data, mode: 'supabase' as const } : { ...ctx.data, mode: 'local' as const };
    const open = () => {
      feed.current?.close();
      feed.current = openFeed<CounterOrder>('counter-order-lanes', data, (message) => {
        if (message.event === 'order.created') dispatch({ type: 'created', order: message.payload });
      }, (next) => setStatus(next as FeedStatus));
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        feed.current?.close();
        feed.current = null;
        setStatus('local');
      } else open();
    };
    open();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      feed.current?.close();
      feed.current = null;
    };
  }, [ctx.data, acrossTabs, supabaseReady]);

  const toggleAcrossTabs = () => {
    const next = !acrossTabs;
    setAcrossTabs(next);
    try {
      localStorage.setItem(ACROSS_KEY, next ? '1' : '0');
    } catch {
      // Private mode: the toggle still works for this page.
    }
  };

  useEffect(() => {
    if (!board.toast) return;
    const id = setTimeout(() => dispatch({ type: 'toast', message: null }), 4200);
    return () => clearTimeout(id);
  }, [board.toast]);

  const act = (action: Action) => dispatch(action);
  const emit = () => feed.current?.send('order.created', nextLiveOrder());

  return (
    <CounterContext.Provider value={{ board, act, feedStatus: status, emit, basePath: ctx.basePath, acrossTabs, supabaseReady, toggleAcrossTabs }}>
      <div class="ct-app">
        <TopBar basePath={ctx.basePath} />
        <ViewRouter remote="counter" basePath={ctx.basePath} views={views} label="Counter" />
        {board.toast && <div class="ct-toast" role="status">{board.toast}</div>}
      </div>
    </CounterContext.Provider>
  );
}
