import type { RemoteContext } from '@portfolio/remote-runtime';
import { openFeed, startDemoDriver, useSegments } from '@portfolio/remote-runtime';
import type { BalcaoOrder } from '@portfolio/mocks';
import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { initialBoard, nextLiveOrder, reduce, type Action } from './board';
import { TopBar } from './TopBar';
import { Tile } from './Tile';
import { Lanes } from './Lanes';
import { Picking } from './Picking';

export type FeedStatus = 'local' | 'connecting' | 'live' | 'error';

export function App({ ctx }: { ctx: RemoteContext }) {
  if (ctx.mode === 'tile') return <Tile />;
  return <Page ctx={ctx} />;
}

function Page({ ctx }: { ctx: RemoteContext }) {
  const segments = useSegments(ctx.basePath);
  const [board, dispatch] = useReducer(reduce, undefined, initialBoard);
  const [status, setStatus] = useState<FeedStatus>('local');
  const feed = useRef<ReturnType<typeof openFeed<BalcaoOrder>> | null>(null);

  useEffect(() => {
    const channel = openFeed<BalcaoOrder>('balcao-order-lanes', ctx.data, (message) => {
      if (message.event === 'order.created') dispatch({ type: 'created', order: message.payload });
    }, (next) => setStatus(next as FeedStatus));
    feed.current = channel;
    // Demo driver: while a reviewer watches, one leader tab announces a new order every 25 s.
    const stop = startDemoDriver('balcao-order-lanes', 25_000, () => channel.send('order.created', nextLiveOrder()));
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
  const picking = segments[0] === 'pick';

  return (
    <div class="bc-app">
      <TopBar active={picking ? 'Picking' : 'Orders'} />
      {picking ? <Picking orderId={segments[1] ?? 'MR-904117'} board={board} act={act} /> : <Lanes board={board} act={act} feedStatus={status} emit={emit} />}
      {board.toast && <div class="bc-toast" role="status">{board.toast}</div>}
    </div>
  );
}
