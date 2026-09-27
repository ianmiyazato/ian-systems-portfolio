import type { RemoteContext, ViewTable } from '@portfolio/remote-runtime';
import { ViewRouter, openFeed, startDemoDriver } from '@portfolio/remote-runtime';
import type { CounterOrder } from '@portfolio/mocks';
import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { initialBoard, nextLiveOrder, reduce, type Action } from './board';
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

function Page({ ctx }: { ctx: RemoteContext }) {
  const [board, dispatch] = useReducer(reduce, undefined, initialBoard);
  const [status, setStatus] = useState<FeedStatus>('local');
  const feed = useRef<ReturnType<typeof openFeed<CounterOrder>> | null>(null);

  useEffect(() => {
    const channel = openFeed<CounterOrder>('counter-order-lanes', ctx.data, (message) => {
      if (message.event === 'order.created') dispatch({ type: 'created', order: message.payload });
    }, (next) => setStatus(next as FeedStatus));
    feed.current = channel;
    // Demo driver: while a reviewer watches, one leader tab announces a new order every 25 s.
    const stop = startDemoDriver('counter-order-lanes', 25_000, () => channel.send('order.created', nextLiveOrder()));
    return () => {
      stop();
      channel.close();
    };
  }, [ctx.data]);

  useEffect(() => {
    if (!board.toast) return;
    const id = setTimeout(() => dispatch({ type: 'toast', message: null }), 4200);
    return () => clearTimeout(id);
  }, [board.toast]);

  const act = (action: Action) => dispatch(action);
  const emit = () => feed.current?.send('order.created', nextLiveOrder());

  return (
    <CounterContext.Provider value={{ board, act, feedStatus: status, emit, basePath: ctx.basePath }}>
      <div class="ct-app">
        <TopBar basePath={ctx.basePath} />
        <ViewRouter remote="counter" basePath={ctx.basePath} views={views} label="Counter" />
        {board.toast && <div class="ct-toast" role="status">{board.toast}</div>}
      </div>
    </CounterContext.Provider>
  );
}
