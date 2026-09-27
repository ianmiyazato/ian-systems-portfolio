import { AiSurface, Banner, Layer, Link, LiveControl, Tween, closeLayers, getWorld, openLayer, setParams, useAnnouncer, useDemoState, useLiveEvents, useLocation, useSequence } from '@portfolio/remote-runtime';
import { clock } from '@portfolio/world';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { useCounter } from './context';
import { fromWorld, money, paymentLabel, reasonLabel, refundQuote, todaysReturns, type RefundMethod, type ReturnCase } from './returns';

const HOME = '#0412';
const checks = [
  ['tags', 'Tags attached'],
  ['damage', 'No damage beyond the reason given'],
  ['packaging', 'Original packaging or bag']
] as const;
type Check = (typeof checks)[number][0];

export function Returns() {
  const state = useDemoState();
  const { params } = useLocation();
  const { act } = useCounter();
  const { announce, region } = useAnnouncer();
  const live = useLiveEvents(['returns.created'], { limit: 6, filter: (event) => event.payload.store === HOME });
  const refunds = useLiveEvents(['returns.refunded'], { limit: 40, filter: (event) => event.payload.store === HOME });
  const refunded = useMemo(() => new Map(refunds.items.map((event) => [event.payload.returnId, event.payload])), [refunds.items]);

  // Live returns join the fixed morning queue; only ones from the last hour count as "just in".
  const queue = useMemo(() => {
    const incoming = live.items.map((event) => fromWorld(event, clock(Date.parse(event.at))));
    return state === 'empty' ? [] : [...incoming.filter((item) => !todaysReturns.some((fixed) => fixed.returnId === item.returnId)), ...todaysReturns];
  }, [live.items, state]);
  const arriving = useMemo(() => new Set(live.items.filter((event) => live.fresh.includes(event.id)).map((event) => event.payload.returnId)), [live.items, live.fresh]);
  const newest = live.items[0];
  useEffect(() => {
    if (newest && arriving.has(newest.payload.returnId)) announce(`New return ${newest.payload.returnId} from ${newest.payload.customer}`);
  }, [newest?.id]);

  const selectedId = params.get('return') ?? 'RT-12418';
  const selected = queue.find((item) => item.returnId === selectedId) ?? queue.find((item) => !refunded.has(item.returnId)) ?? queue[0];
  const totals = { count: queue.length + 9, refunded: refunds.items.reduce((sum, event) => sum + event.payload.amountCents, 231_840) };
  const creditShare = refunds.items.length ? Math.round((refunds.items.filter((event) => event.payload.method === 'store-credit').length / refunds.items.length) * 100) : 38;

  return (
    <main class="ct-main ct-returns-page" id="counter-returns">
      {region}
      {state === 'error' && <Banner tone="risk" icon="!" title="Receipt service unreachable · store credit only" anchor="ct-returns-error">Original-payment refunds need the receipt service. Store credit and exchanges keep working and sync later.</Banner>}
      {state === 'offline' && <div class="ct-offline" role="status"><b aria-hidden="true">↯</b> Offline · refunds queue with idempotency keys and sync when the store reconnects</div>}
      <section class="ct-head">
        <div>
          <h1 class="ct-title" data-anchor="ct-returns-title">Returns</h1>
          <p class="ct-sub">Today at Vila Nova Mall · in store and by courier</p>
        </div>
        <dl class="ct-kpis" data-anchor="ct-returns-kpis">
          <div><dt>Returns today</dt><dd><Tween value={state === 'empty' ? 0 : totals.count} /></dd></div>
          <div><dt>Refunded</dt><dd><Tween value={state === 'empty' ? 0 : totals.refunded / 100} format={(value) => `R$${Math.round(value).toLocaleString('en-US')}`} /></dd></div>
          <div><dt>Took store credit</dt><dd><Tween value={creditShare} format={(value) => `${Math.round(value)}%`} /></dd></div>
        </dl>
        <LiveControl anchor="ct-returns-live" />
      </section>

      <div class="ct-returns">
        <section class="ct-return-queue" aria-labelledby="queue-title" data-anchor="ct-return-queue">
          <header><h2 id="queue-title">Queue</h2><span class="ct-count">{queue.filter((item) => !refunded.has(item.returnId)).length}</span></header>
          {state === 'loading' && [0, 1, 2, 3].map((key) => <div class="ct-return-row skeleton" key={key} aria-hidden="true" />)}
          {state !== 'loading' && !queue.length && (
            <div class="ct-empty" data-anchor="ct-returns-empty">
              <span aria-hidden="true">✓</span>
              <strong>No returns yet today</strong>
              <p>Courier drop-offs usually arrive around 17:20. In-store returns appear the moment a customer is at the counter.</p>
            </div>
          )}
          {state !== 'loading' && (
            <ol>
              {queue.map((item) => {
                const done = refunded.get(item.returnId);
                return (
                  <li key={item.returnId}>
                    <button type="button" class={`ct-return-row ${item.returnId === selected?.returnId ? 'is-selected' : ''} ${arriving.has(item.returnId) ? 'is-arriving' : ''} ${done ? 'is-done' : ''}`} aria-pressed={item.returnId === selected?.returnId} onClick={() => setParams({ return: item.returnId })}>
                      <span class="swatch" data-swatch={item.item.swatch} />
                      <span class="ct-return-main">
                        <b>{item.customer} · {item.item.name}</b>
                        <small>{item.returnId} · size {item.size} · {item.channel === 'courier' ? (item.arriving ? `courier arriving ${item.time}` : `courier · ${item.time}`) : `in store · ${item.time}`}</small>
                      </span>
                      <span class={`ct-reason ${item.reason}`}>{done ? (done.method === 'store-credit' ? 'Store credit' : done.method === 'exchange' ? 'Exchanged' : 'Refunded') : reasonLabel[item.reason]}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {selected && state !== 'loading' && <ReturnDetail key={selected.returnId} item={selected} refunded={refunded.get(selected.returnId)?.method} receiptDown={state === 'error'} onRefund={(message) => act({ type: 'toast', message })} />}
      </div>

      {params.get('modal') === 'scan-receipt' && <ScanReceipt returnId={selected?.returnId ?? 'RT-12418'} />}
    </main>
  );
}

function ReturnDetail({ item, refunded, receiptDown, onRefund }: { item: ReturnCase; refunded?: RefundMethod; receiptDown: boolean; onRefund: (message: string) => void }) {
  const { params } = useLocation();
  const receipt = item.receipt || params.get('receipt') === item.returnId;
  const [checked, setChecked] = useState<Record<Check, boolean>>({ tags: false, damage: item.reason === 'damaged', packaging: false });
  const [method, setMethod] = useState<RefundMethod>('store-credit');
  const quote = refundQuote(item, method);
  const ready = receipt && checks.every(([key]) => checked[key]);
  const shown = useSequence(3, 120);

  const confirm = () => {
    const world = getWorld();
    world.record({ topic: 'returns.refunded', key: item.returnId, payload: { returnId: item.returnId, orderId: item.orderId, store: HOME, method, amountCents: quote.amountCents, bonusCents: quote.bonusCents, installmentsReversed: quote.installmentsReversed, staff: 'Ana' } });
    if (quote.commissionReversalCents && item.code) {
      world.record({ topic: 'commission.reversed', key: item.code, payload: { code: item.code, creator: item.code, orderId: item.orderId, amountCents: quote.commissionReversalCents, reason: 'return' } });
    }
    const verb = method === 'exchange' ? `Exchange started for ${item.customer}` : `${money(quote.amountCents)} ${method === 'store-credit' ? 'store credit issued' : 'refunded'} to ${item.customer}`;
    onRefund(`${verb}${quote.commissionReversalCents ? ` · ${item.code} commission reversed −${money(quote.commissionReversalCents)}` : ''} · event sent to Mesh`);
  };

  return (
    <section class="ct-return-detail" aria-labelledby="return-title" data-anchor="ct-return-detail">
      <header class="ct-return-head">
        <span class="swatch big" data-swatch={item.item.swatch} />
        <div>
          <h2 id="return-title">{item.item.name} · size {item.size}</h2>
          <p>{item.returnId} · {item.customer} · {reasonLabel[item.reason]} · {item.channel === 'courier' ? 'Courier return' : 'At the counter'}</p>
        </div>
        <strong class="ct-return-price">{money(item.item.price * 100)}</strong>
      </header>

      {refunded ? (
        <Banner tone="success" icon="✓" title={refunded === 'store-credit' ? 'Store credit issued' : refunded === 'exchange' ? 'Exchange started' : 'Refund issued'} anchor="ct-refund-done" action={<Link class="ct-secondary" href={`/mare/ops/mesh/events?key=${item.returnId}`}>View event in Mesh</Link>}>
          <code>returns.refunded</code> went out through the outbox; Circle reversed the creator commission and Mesh shows the event with its idempotency key.
        </Banner>
      ) : null}

      <div class="ct-return-grid">
        <section class={`ct-step ${receipt ? 'done' : ''}`} data-anchor="ct-receipt" style={{ '--i': 0 }}>
          <h3><b>1</b>Receipt</h3>
          {receipt ? (
            <dl class="ct-receipt">
              <div><dt>Order</dt><dd>{item.orderId}</dd></div>
              <div><dt>Bought</dt><dd>{item.purchased} · Vila Nova Mall</dd></div>
              <div><dt>Paid with</dt><dd>{paymentLabel(item.payment)}</dd></div>
              {item.code && <div><dt>Creator code</dt><dd>{item.code}</dd></div>}
            </dl>
          ) : (
            <div class="ct-receipt-missing">
              <p>No receipt linked yet. Scan the paper receipt or the QR code in the customer's app.</p>
              <button type="button" class="ct-primary" onClick={() => openLayer({ modal: 'scan-receipt', return: item.returnId })}>Scan receipt</button>
            </div>
          )}
        </section>

        <section class="ct-step" data-anchor="ct-condition" style={{ '--i': 1 }}>
          <h3><b>2</b>Condition</h3>
          <div class="ct-checks" role="group" aria-label="Condition checklist">
            {checks.slice(0, shown).map(([key, label]) => (
              <button type="button" key={key} class="ct-check-toggle" aria-pressed={checked[key]} disabled={Boolean(refunded)} onClick={() => setChecked({ ...checked, [key]: !checked[key] })}>
                <span aria-hidden="true">{checked[key] ? '✓' : ''}</span>{label}
              </button>
            ))}
          </div>
        </section>

        <section class="ct-step ct-refund" data-anchor="ct-refund-options" style={{ '--i': 2 }}>
          <h3><b>3</b>Refund</h3>
          <div class="ct-options" role="radiogroup" aria-label="Refund method">
            {(['original-payment', 'store-credit', 'exchange'] as RefundMethod[]).map((option) => {
              const q = refundQuote(item, option);
              const disabled = option === 'original-payment' && receiptDown;
              return (
                <button type="button" role="radio" key={option} aria-checked={method === option} disabled={disabled || Boolean(refunded)} class={`ct-option ${option}`} onClick={() => setMethod(option)}>
                  <strong>{option === 'original-payment' ? 'Original payment' : option === 'store-credit' ? 'Store credit +10%' : 'Exchange'}</strong>
                  <em>{option === 'exchange' ? 'Same value' : money(q.amountCents)}</em>
                  {q.lines.map((line) => <small key={line}>{line}</small>)}
                </button>
              );
            })}
          </div>
          {method === 'exchange' && <Link class="ct-link" href={`/mare/ops/counter/stock?sku=${item.item.sku}&size=${item.size}`}>Check another size in stock lookup →</Link>}
          {quote.commissionReversalCents > 0 && <p class="ct-note" data-anchor="ct-commission-note">Circle reverses {item.code}'s {money(quote.commissionReversalCents)} commission: it is still inside the 30-day window, so nothing was paid out.</p>}
        </section>
      </div>

      <AiSurface inline title={item.reason === 'size' ? `${item.item.name} runs small · offer ${item.size === 'S' ? 'M' : 'a size up'} before refunding` : 'Store credit keeps 64% of these customers'} meta="3 sources · confidence 0.84" sources={[{ label: 'returns · 90 days', score: 0.91 }, { label: 'fit notes · this style', score: 0.86 }, { label: 'store credit redemption', score: 0.8 }]} anchor="ct-return-ai">
        {item.reason === 'size' ? '71% of size-related returns on this style kept the next size up when offered at the counter.' : 'Offer the +10% credit first; the customer can still choose the original payment.'}
      </AiSurface>

      <footer class="ct-return-foot">
        <button type="button" class="ct-primary" disabled={!ready || Boolean(refunded)} onClick={confirm} data-anchor="ct-refund-confirm">
          {refunded ? 'Done' : method === 'exchange' ? 'Start exchange' : `Refund ${money(quote.amountCents)}`}
        </button>
        {!ready && !refunded && <span class="ct-hint">{receipt ? 'Check all three conditions to continue' : 'Scan the receipt to continue'}</span>}
      </footer>
    </section>
  );
}

function ScanReceipt({ returnId }: { returnId: string }) {
  const [found, setFound] = useState(false);
  const close = () => closeLayers(['modal']);
  const scan = () => {
    setFound(true);
    setTimeout(() => setParams({ modal: null, receipt: returnId }), 650);
  };
  return (
    <Layer kind="modal" title="Scan receipt" eyebrow={`${returnId} · camera`} onClose={close} width={560} anchor="ct-scan-receipt"
      footer={<><button type="button" class="ct-ghost" onClick={close}>Type order number</button><button type="button" class="ct-primary" onClick={scan} data-autofocus>Simulate scan</button></>}>
      <button type="button" class={`ct-viewfinder receipt ${found ? 'is-found' : ''}`} onClick={scan} aria-label="Simulate scanning the receipt">
        <i class="corner tl" /><i class="corner tr" /><i class="corner bl" /><i class="corner br" />
        <span class="ct-receipt-paper" aria-hidden="true"><i /><i /><i /><i class="qr" /></span>
        {!found && <span class="ct-scanline" aria-hidden="true" />}
        {found && <span class="ct-found" aria-hidden="true">✓</span>}
      </button>
      <p class="ct-note" role="status">{found ? 'Receipt matched · order and payment loaded' : 'Point the camera at the barcode or the QR code in the Maré app. The image never leaves the tablet.'}</p>
    </Layer>
  );
}
