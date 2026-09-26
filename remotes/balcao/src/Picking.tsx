import { Banner, Link, navigate, useDemoState, useTween } from '@portfolio/remote-runtime';
import { pickingOrder } from '@portfolio/mocks';
import { useState } from 'preact/hooks';
import type { Action, Board } from './board';

type Props = { orderId: string; board: Board; act: (action: Action) => void };

export function Picking({ orderId, board, act }: Props) {
  const state = useDemoState();
  const order = board.orders.find((item) => item.id === orderId) ?? pickingOrder;
  const initial = state === 'picked' ? order.items.length : order.items.filter((item) => item.scanned).length;
  const [scanned, setScanned] = useState(initial);
  const [manual, setManual] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  const total = order.items.length;
  const done = scanned >= total;
  const next = order.items[scanned];
  const progress = useTween(scanned / total, 700);
  const circumference = 2 * Math.PI * 52;

  const scan = () => {
    if (done) return;
    setScanned(scanned + 1);
    setManual(false);
  };

  return (
    <main class="bc-picking">
      <section class="bc-pick-list">
        <Link class="bc-back" href="/mare/ops/balcao">← Back to lanes</Link>
        {state === 'offline' && <div class="bc-offline" role="status"><b aria-hidden="true">↯</b> Offline · scans queue locally and sync with idempotency keys</div>}
        <header class="bc-pick-head">
          <h1 class="bc-title">{order.id} · {order.customer}</h1>
          <span class="bc-deadline" data-anchor="bc-deadline">◷ {order.sla}</span>
        </header>
        <p class="bc-sub">{order.type === 'pickup' ? 'Pickup' : 'Delivery from store'} · {total} items · {order.payment}</p>
        <ol class="bc-items" data-anchor="bc-items">
          {order.items.map((item, index) => {
            const isDone = index < scanned;
            const isNext = index === scanned;
            return (
              <li key={`${item.sku}-${index}`} class={`${isDone ? 'done' : ''} ${isNext ? 'next' : ''} ${missing === item.sku ? 'missing' : ''}`}>
                <span class="swatch" data-swatch={item.swatch} />
                <div>
                  <strong>{item.name}</strong>
                  <p>Size {item.size} · Aisle {item.aisle}</p>
                  <code>{item.sku}</code>
                </div>
                {isDone ? <span class="bc-check" role="img" aria-label="Scanned">✓</span> : <span class="bc-todo" role="img" aria-label={isNext ? 'Next to scan' : 'To scan'} />}
              </li>
            );
          })}
        </ol>
        {!done && (
          <section class="bc-cant" aria-labelledby="cant-title" data-anchor="bc-cant-find">
            <h2 id="cant-title">Can't find it?</h2>
            <div>
              <button type="button" class="bc-secondary" onClick={() => next && setMissing(next.sku)}>Mark missing</button>
              <button type="button" class="bc-secondary">Offer substitute</button>
              <button type="button" class="bc-secondary">Pull from another store</button>
            </div>
            {missing && <Banner tone="warn" icon="!" title="Marked missing · stock corrected for SKU MR-18455">Rafael gets a substitute offer in the app; the order stays in this lane until he answers.</Banner>}
          </section>
        )}
      </section>

      <section class={`bc-scanner ${done ? 'is-done' : ''}`} aria-label="Scanner" data-anchor="bc-scanner">
        {done ? (
          <div class="bc-success" data-anchor="bc-pick-success">
            <span class="bc-big-check" aria-hidden="true">✓</span>
            <h2>All {total} items picked</h2>
            <p>{order.id} is ready to pack. The label prints with the carrier and locker already assigned.</p>
            <button type="button" class="bc-primary" onClick={() => { act({ type: 'move', id: order.id, lane: 'ready', patch: { sla: 'Waiting · just now' } }); navigate('/mare/ops/balcao'); }}>Print label</button>
            <Link class="bc-link-light" href="/mare/ops/balcao">Back to lanes</Link>
          </div>
        ) : (
          <>
            <button type="button" class="bc-viewfinder" onClick={scan} aria-label={`Simulate scanning ${next?.name ?? 'item'}`}>
              <i class="corner tl" /><i class="corner tr" /><i class="corner bl" /><i class="corner br" />
              <span class="bc-barcode" aria-hidden="true" />
              <span class="bc-scanline" aria-hidden="true" />
            </button>
            <div class="bc-ring" data-anchor="bc-progress">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="52" class="track" />
                <circle cx="60" cy="60" r="52" class="fill" style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - progress) }} />
              </svg>
              <strong>{scanned}/{total}</strong>
            </div>
            <p class="bc-prompt">Scan <b>{next?.name}</b>, size {next?.size}</p>
            {manual ? (
              <form class="bc-manual" onSubmit={(event) => { event.preventDefault(); scan(); }}>
                <label for="bc-sku">SKU or barcode</label>
                <input id="bc-sku" defaultValue={next?.sku} inputMode="numeric" />
                <button type="submit" class="bc-primary">Confirm</button>
              </form>
            ) : (
              <div class="bc-scan-actions">
                <button type="button" class="bc-primary" onClick={scan}>Simulate scan</button>
                <button type="button" class="bc-link-light" onClick={() => setManual(true)}>Type code instead</button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
