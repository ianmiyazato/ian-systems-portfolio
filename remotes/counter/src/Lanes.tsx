import { AiSurface, Banner, Link, closeLayers, navigate, openLayer, useDemoState, useLocation } from '@portfolio/remote-runtime';
import { laneTotals, lanes, type CounterOrder } from '@portfolio/mocks';
import { useState } from 'preact/hooks';
import type { Action } from './board';
import { useCounter, type FeedStatus } from './context';
import { Handover } from './Handover';
import { CutoffPlan } from './CutoffPlan';

type Filter = 'all' | 'pickup' | 'delivery' | 'late';

export function Lanes() {
  const { board, act, feedStatus, emit } = useCounter();
  const state = useDemoState();
  const { params } = useLocation();
  const [filter, setFilter] = useState<Filter>('all');
  const modal = params.get('modal');
  const open = laneTotals.open + board.live - (state === 'empty' ? 18 : 0);
  const queued = state === 'offline' ? ['MR-904117', 'MR-904115', 'MR-904112'] : [];
  const reminded = state === 'reminder-sent' ? [...board.reminded, 'MR-904103'] : board.reminded;

  const visible = (order: CounterOrder) =>
    filter === 'all' || (filter === 'late' ? order.urgent : order.type === filter);

  const filters: Array<[Filter, string, number]> = [
    ['all', 'All', open],
    ['pickup', 'Pickup', laneTotals.pickup],
    ['delivery', 'Delivery', laneTotals.delivery],
    ['late', 'Late', laneTotals.late]
  ];

  return (
    <main class={`ct-main ${state === 'locked' ? 'is-locked' : ''}`} id="counter-lanes">
      <StateBanners state={state} />
      <section class="ct-head">
        <div>
          <h1 class="ct-title" data-anchor="ct-title">{state === 'loading' ? 'Loading orders…' : `${open} open orders`}</h1>
          <p class="ct-sub">Sorted by the next carrier cutoff · updated 16:18</p>
        </div>
        <div class="ct-filters" role="group" aria-label="Filter orders" data-anchor="ct-filters">
          {filters.map(([id, label, count]) => (
            <button type="button" key={id} class={`ct-filter ${id === 'late' ? 'late' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label} <b>{count}</b>
            </button>
          ))}
        </div>
        <LiveFeed status={feedStatus} emit={emit} />
      </section>

      <div class="ct-lanes" data-anchor="ct-lanes" aria-hidden={state === 'locked' ? true : undefined} inert={state === 'locked'}>
        {lanes.map((lane) => {
          const cards = state === 'loading' ? [] : board.orders.filter((order) => order.lane === lane.id && visible(order));
          const empty = state === 'empty' && lane.id === 'to-pick';
          const shown = empty ? [] : cards;
          return (
            <section class="ct-lane" key={lane.id} aria-labelledby={`lane-${lane.id}`} data-lane={lane.id}>
              <header>
                <h2 id={`lane-${lane.id}`}>{lane.label}</h2>
                <span class="ct-count">{empty ? 0 : lane.total + (lane.id === 'to-pick' ? board.live : 0)}</span>
              </header>
              {state === 'loading' && [0, 1, 2].map((key) => <div class="ct-card skeleton" key={key} aria-hidden="true" />)}
              {empty && (
                <div class="ct-empty" data-anchor="ct-empty-lane">
                  <span aria-hidden="true">✓</span>
                  <strong>Nothing to pick</strong>
                  <p>New orders land here, usually one every 6 min at this hour. You'll hear a chime.</p>
                </div>
              )}
              {shown.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  fresh={board.fresh.includes(order.id)}
                  queued={queued.includes(order.id)}
                  reminded={reminded.includes(order.id)}
                  anchor={lane.id === 'to-pick' && index === 0 ? 'ct-card' : undefined}
                  act={act}
                />
              ))}
              {state !== 'loading' && !empty && lane.total > cards.length && (
                <button type="button" class="ct-more">+ {lane.total - Math.min(cards.length, lane.total)} more</button>
              )}
            </section>
          );
        })}
      </div>

      {state !== 'loading' && state !== 'locked' && (
        <div class="ct-ai-strip" data-anchor="ct-ai-strip">
          <AiSurface inline title="Cutoff plan ready · 3 deliveries would miss 17:00" meta="4 sources · confidence 0.92">
            Moving two orders to free pickers and one to Via Norte keeps every delivery on today's truck.
          </AiSurface>
          <button type="button" class="ct-primary" onClick={() => openLayer({ modal: 'cutoff-plan' })}>Review plan</button>
        </div>
      )}

      {state === 'locked' && (
        <div class="ct-lock" role="dialog" aria-modal="false" aria-labelledby="ct-lock-title" data-anchor="ct-locked">
          <svg class="ct-lock-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          <h2 id="ct-lock-title">Counter locked until your shift starts</h2>
          <p>Ana's shift starts at 08:00. A shift lead can unlock the counter with a badge scan; the unlock is written to the audit log.</p>
          <button type="button" class="ct-primary">Scan shift-lead badge</button>
        </div>
      )}

      {modal === 'handover' && <Handover orderId={params.get('order') ?? 'MR-904112'} board={board} act={act} />}
      {modal === 'cutoff-plan' && <CutoffPlan act={act} />}
    </main>
  );
}

function StateBanners({ state }: { state: string }) {
  if (state === 'offline')
    return (
      <div class="ct-offline" role="status" data-anchor="ct-offline">
        <b aria-hidden="true">↯</b> Offline · 3 actions queued, will sync
        <small>Scans and handovers keep working; each carries an idempotency key so replays can't double-count.</small>
      </div>
    );
  if (state === 'error')
    return (
      <Banner tone="risk" icon="!" title="Order service unreachable · showing lanes cached at 16:14" anchor="ct-error" action={<button type="button" class="ct-secondary" onClick={() => closeLayers(['state'])}>Retry now</button>}>
        New orders pause until it recovers. Picking and handovers still work offline.
      </Banner>
    );
  if (state === 'reminder-sent')
    return <Banner tone="success" icon="✓" title="No-show reminder sent to Caio · WhatsApp · 16:19" anchor="ct-reminder">If Caio doesn't reply by 18:00 the order returns to stock automatically.</Banner>;
  return null;
}

function LiveFeed({ status, emit }: { status: FeedStatus; emit: () => void }) {
  const label = status === 'live' ? 'Live · Supabase Broadcast' : status === 'connecting' ? 'Connecting…' : status === 'error' ? 'Realtime unavailable · local' : 'Live · local simulator';
  return (
    <div class="ct-live" data-realtime-status={status} data-anchor="ct-live">
      <i aria-hidden="true" />
      <span>{label}</span>
      <button type="button" onClick={emit}>Simulate order</button>
    </div>
  );
}

type CardProps = { order: CounterOrder; fresh: boolean; queued: boolean; reminded: boolean; anchor?: string; act: (action: Action) => void };

function OrderCard({ order, fresh, queued, reminded, anchor, act }: CardProps) {
  const scanned = order.items.filter((item) => item.scanned).length;
  const complete = scanned === order.items.length;
  const action = (() => {
    if (order.lane === 'to-pick') return { label: 'Start picking', run: () => navigate(`/mare/ops/counter/pick/${order.id}`) };
    if (order.lane === 'picking')
      return complete
        ? { label: 'Pack & label', run: () => act({ type: 'move', id: order.id, lane: 'ready', patch: { sla: 'Waiting · just now' } }) }
        : { label: `Resume picking · ${scanned}/${order.items.length}`, run: () => navigate(`/mare/ops/counter/pick/${order.id}`) };
    if (order.lane === 'ready')
      return order.note === 'no-show'
        ? { label: reminded ? 'Reminder sent' : 'Remind customer', run: () => act({ type: 'remind', id: order.id }), disabled: reminded }
        : { label: 'Hand over', run: () => openLayer({ modal: 'handover', order: order.id }) };
    return null;
  })();

  return (
    <article class={`ct-card ${fresh ? 'is-fresh' : ''} ${order.urgent ? 'is-urgent' : ''}`} style={{ viewTransitionName: `order-${order.id}` }} data-anchor={anchor} data-order={order.id}>
      <header>
        <Link href={`/mare/ops/counter/pick/${order.id}`} class="ct-id">{order.id}</Link>
        <span class={`ct-pill ${order.type}`}>{order.type === 'pickup' ? 'Pickup' : 'Delivery from store'}</span>
      </header>
      <p class="ct-customer">
        {order.customer} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
      </p>
      <div class="ct-stack" role="img" aria-label={order.items.map((item) => item.name).join(', ')}>
        {order.items.map((item, index) => (
          <span key={`${item.sku}-${index}`} class={`swatch ${item.scanned ? 'done' : ''}`} data-swatch={item.swatch} style={{ '--i': index }} />
        ))}
      </div>
      <p class={`ct-sla ${order.urgent ? 'urgent' : ''}`}>
        <span aria-hidden="true">{order.lane === 'handed-over' ? '✓' : '◷'}</span>
        {reminded && order.note === 'no-show' ? 'Reminder sent 16:19 · waiting' : order.sla}
      </p>
      {queued && <p class="ct-queued">Queued · will sync</p>}
      {action && (
        <button type="button" class={`ct-action ${order.lane} ${order.note === 'no-show' ? 'remind' : ''}`} onClick={action.run} disabled={action.disabled}>
          {action.label}
        </button>
      )}
    </article>
  );
}
