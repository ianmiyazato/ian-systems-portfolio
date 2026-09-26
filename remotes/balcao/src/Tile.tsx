import { balcaoOrders, store } from '@portfolio/mocks';

const lanes = [['to-pick', 'To pick'], ['picking', 'Picking'], ['ready', 'Ready'], ['handed-over', 'Done']] as const;

/** Compact preview for the Maré Ops index: same language, no interactive controls. */
export function Tile() {
  const orders = balcaoOrders();
  return (
    <div class="bc-tile">
      <div class="bc-tile-bar"><b>balcão</b><span><i />Carrier {store.cutoff} · {store.cutoffIn}</span></div>
      <div class="bc-tile-body">
        <small>Store counter · tablet-first</small>
        <strong>59 open orders</strong>
        <div class="bc-tile-lanes">
          {lanes.map(([id, label]) => (
            <div key={id}>
              <em>{label}</em>
              {orders.filter((order) => order.lane === id).slice(0, 2).map((order) => (
                <span key={order.id} class={order.type === 'pickup' ? 'pk' : 'dl'}>{order.id.slice(-3)}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
