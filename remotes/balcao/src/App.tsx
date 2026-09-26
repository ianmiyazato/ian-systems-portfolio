import type { RemoteContext } from '@portfolio/remote-runtime';
import { useSegments } from '@portfolio/remote-runtime';
import { TopBar } from './TopBar';
import { Tile } from './Tile';
import { Lanes } from './Lanes';

export function App({ ctx }: { ctx: RemoteContext }) {
  const segments = useSegments(ctx.basePath);
  if (ctx.mode === 'tile') return <Tile />;
  return (
    <div class="bc-app">
      <TopBar active={segments[0] === 'pick' ? 'Picking' : 'Orders'} />
      <Lanes ctx={ctx} />
    </div>
  );
}
