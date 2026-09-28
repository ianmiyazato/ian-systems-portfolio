import { Banner, Link, navigate, useDemoState, useSimNow, useTween } from '@portfolio/remote-runtime';
import { slaText } from './live';
import { pickingOrder } from '@portfolio/mocks';
import { useState } from 'preact/hooks';
import { useCounter } from './context';

export function Picking({ orderId }: { orderId: string }) {
  const { board, act } = useCounter();
  const now = useSimNow();
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
    <main class="ct-picking">
      <section class="ct-pick-list">
        <Link class="ct-back" href="/mare/ops/counter">← Back to lanes</Link>
        {state === 'offline' && <div class="ct-offline" role="status"><b aria-hidden="true">↯</b> Offline · scans queue locally and sync with idempotency keys</div>}
        <header class="ct-pick-head" style={{ viewTransitionName: `order-${order.id}` }}>
          <h1 class="ct-title">{order.id} · {order.customer}</h1>
          <span class="ct-deadline" data-anchor="ct-deadline">◷ {slaText(order, now).text}</span>
        </header>
        <p class="ct-sub">{order.type === 'pickup' ? 'Pickup' : 'Delivery from store'} · {total} items · {order.payment}</p>
        <ol class="ct-items" data-anchor="ct-items">
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
                {isDone ? <span class="ct-check" role="img" aria-label="Scanned">✓</span> : <span class="ct-todo" role="img" aria-label={isNext ? 'Next to scan' : 'To scan'} />}
              </li>
            );
          })}
        </ol>
        {!done && (
          <section class="ct-cant" aria-labelledby="cant-title" data-anchor="ct-cant-find">
            <h2 id="cant-title">Can't find it?</h2>
            <div>
              <button type="button" class="ct-secondary" onClick={() => next && setMissing(next.sku)}>Mark missing</button>
              <button type="button" class="ct-secondary">Offer substitute</button>
              <button type="button" class="ct-secondary">Pull from another store</button>
            </div>
            {missing && <Banner tone="warn" icon="!" title="Marked missing · stock corrected for SKU MR-18455">Rafael gets a substitute offer in the app; the order stays in this lane until he answers.</Banner>}
          </section>
        )}
      </section>

      <section class={`ct-scanner ${done ? 'is-done' : ''}`} aria-label="Scanner" data-anchor="ct-scanner">
        {done ? (
          <div class="ct-success" data-anchor="ct-pick-success">
            <span class="ct-big-check" aria-hidden="true">✓</span>
            <h2>All {total} items picked</h2>
            <p>{order.id} is ready to pack. The label prints with the carrier and locker already assigned.</p>
            <button type="button" class="ct-primary" onClick={() => { act({ type: 'move', id: order.id, lane: 'ready', patch: { sla: 'Waiting · just now' } }); navigate('/mare/ops/counter'); }}>Print label</button>
            <Link class="ct-link-light" href="/mare/ops/counter">Back to lanes</Link>
          </div>
        ) : (
          <>
            <button type="button" class="ct-viewfinder" onClick={scan} aria-label={`Simulate scanning ${next?.name ?? 'item'}`}>
              <i class="corner tl" /><i class="corner tr" /><i class="corner bl" /><i class="corner br" />
              <span class="ct-barcode" aria-hidden="true" />
              <span class="ct-scanline" aria-hidden="true" />
            </button>
            <div class="ct-ring" data-anchor="ct-progress">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="52" class="track" />
                <circle cx="60" cy="60" r="52" class="fill" style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - progress) }} />
              </svg>
              <strong>{scanned}/{total}</strong>
            </div>
            <p class="ct-prompt">Scan <b>{next?.name}</b>, size {next?.size}</p>
            {manual ? (
              <form class="ct-manual" onSubmit={(event) => { event.preventDefault(); scan(); }}>
                <label for="ct-sku">SKU or barcode</label>
                <input id="ct-sku" defaultValue={next?.sku} inputMode="numeric" />
                <button type="submit" class="ct-primary">Confirm</button>
              </form>
            ) : (
              <div class="ct-scan-actions">
                <button type="button" class="ct-primary" onClick={scan}>Simulate scan</button>
                <button type="button" class="ct-link-light" onClick={() => setManual(true)}>Type code instead</button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
