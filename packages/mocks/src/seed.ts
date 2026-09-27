import { counterBoard, liveOrder, type CounterOrder } from './mare';

const sql = (value: string) => `'${value.replace(/'/g, "''")}'`;
const laneColumn = (order: CounterOrder) => (order.lane === 'ready' || order.lane === 'handed-over' ? order.lane : order.type);

/** Deterministic seed for public.orders, generated from the same fixtures the UI renders. */
export function renderSeed(): string {
  const orders = [...counterBoard, ...Array.from({ length: 6 }, (_, index) => liveOrder(index + 1))];
  const rows = orders.map((order, index) => {
    const created = new Date(Date.UTC(2026, 8, 26, 18, 30 - index * 3)).toISOString();
    return `  (${sql(order.id)}, ${sql(laneColumn(order))}, ${sql(order.customer)}, ${order.items.length}, ${sql(order.lane)}, '2026-09-26T20:00:00Z', ${sql(created)})`;
  });
  return [
    '-- Generated from @portfolio/mocks (counterBoard + liveOrder 1-6). Regenerate: WRITE_SEED=1 pnpm --filter @portfolio/mocks test',
    'insert into public.orders (id, lane, customer_alias, item_count, status, cutoff_at, created_at) values',
    `${rows.join(',\n')}`,
    'on conflict (id) do update set lane = excluded.lane, customer_alias = excluded.customer_alias, item_count = excluded.item_count, status = excluded.status, cutoff_at = excluded.cutoff_at, created_at = excluded.created_at;',
    ''
  ].join('\n');
}
