import { AiSurface, Banner, Freshness, Layer, LiveControl, closeLayers, openLayer, setParams, useDemoState, useLiveEvents, useLocation, useSimNow, useWorldEvents } from '@portfolio/remote-runtime';
import { brl, catalogBySku } from '@portfolio/mocks';
import { clock, duration } from '@portfolio/world';
import { useMemo, useState } from 'preact/hooks';
import { useCounter } from './context';
import { itemFor, nearby, search, sizeUp, unitsAt, variantsOf } from './stock';

const HOME = '#0412';
const HOLD_MS = 2 * 3600_000;

export function Stock() {
  const state = useDemoState();
  const { params } = useLocation();
  const { act } = useCounter();
  const now = useSimNow();
  const item = itemFor(params.get('sku'));
  const variants = useMemo(() => variantsOf(item), [item.sku]);
  const variant = variants.find((entry) => entry.sku === params.get('color')) ?? variants[0]!;
  const size = params.get('size') && item.sizes.includes(params.get('size')!) ? params.get('size')! : item.sizes[Math.min(2, item.sizes.length - 1)]!;
  const [query, setQuery] = useState(state === 'empty' ? 'linen jumpsuit' : '');
  const [focused, setFocused] = useState(false);
  const [sold, setSold] = useState<Record<string, number>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState(() => Date.now() - 3000);
  const [pulled, setPulled] = useState<Record<string, string>>({});
  const [reserved, setReserved] = useState<{ size: string; customer: string; until: number } | null>(null);
  const feed = useLiveEvents(['stock.reserved'], { limit: 5, filter: (event) => event.payload.store === HOME });

  // The per-size grid is a projection of stock events: every reservation at this store refreshes it.
  useWorldEvents(['stock.reserved'], (event) => {
    if (event.payload.store !== HOME) return;
    setLastEvent(Date.now());
    if (event.payload.sku !== variant.sku) return;
    const key = `${variant.sku}:${event.payload.size}`;
    setSold((current) => ({ ...current, [key]: (current[key] ?? 0) + event.payload.quantity }));
    setFlash(key);
  });

  const base = unitsAt(variant.sku, HOME, item.sizes);
  const units = item.sizes.map((entry, index) => Math.max(0, base[index]! - (sold[`${variant.sku}:${entry}`] ?? 0) - (reserved?.size === entry ? 1 : 0)));
  const selectedUnits = units[item.sizes.indexOf(size)] ?? 0;
  const up = sizeUp(item.sizes, size);
  const upUnits = units[item.sizes.indexOf(up)] ?? 0;
  const closest = nearby.map((store) => ({ store, units: unitsAt(variant.sku, store.code, item.sizes)[item.sizes.indexOf(size)] ?? 0 })).find((entry) => entry.units > 0);
  const results = search(query);
  const noResults = query.trim() !== '' && results.length === 0;
  const modal = params.get('modal');

  const choose = (sku: string) => {
    setQuery('');
    setFocused(false);
    setSold({});
    setParams({ sku, color: null, size: null });
  };

  return (
    <main class="ct-main ct-stock-page" id="counter-stock">
      {state === 'offline' && <div class="ct-offline" role="status" data-anchor="ct-stock-offline"><b aria-hidden="true">↯</b> Offline · showing stock cached at 16:02 · reservations queue and sync when the store reconnects</div>}
      {state === 'error' && <Banner tone="risk" icon="!" title="Stock projection lagging · counts may be 4 min old" anchor="ct-stock-error">Reservations still check the live inventory service before confirming, so nothing is double-sold.</Banner>}
      <section class="ct-head ct-stock-head">
        <form class="ct-search" role="search" data-anchor="ct-stock-search" onSubmit={(event) => { event.preventDefault(); if (results[0]) choose(results[0].sku); }}>
          <label class="visually-hidden" for="ct-stock-q">Search product or scan barcode</label>
          <input id="ct-stock-q" value={query} placeholder="Search product, SKU or color…" autoComplete="off" onInput={(event) => setQuery(event.currentTarget.value)} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} />
          <button type="button" class="ct-primary ct-scan-button" onClick={() => openLayer({ modal: 'scan-item' })}><span aria-hidden="true">▣</span> Scan</button>
          {(focused || noResults) && query && (
            <ul class="ct-results" aria-label="Matching products">
              {results.map((result) => (
                <li key={result.sku}><button type="button" onClick={() => choose(result.sku)}><span class="swatch" data-swatch={result.swatch} />{result.name}<small>{result.sku}</small></button></li>
              ))}
              {noResults && <li class="ct-no-results" data-anchor="ct-stock-empty"><strong>No product matches “{query}”</strong><span>Try the SKU on the tag, or scan the barcode.</span></li>}
            </ul>
          )}
        </form>
        <LiveControl anchor="ct-stock-live" />
      </section>

      <div class="ct-stock">
        <section class="ct-stock-product" data-anchor="ct-stock-product">
          <div class="ct-stock-hero">
            <span class="swatch hero" data-swatch={variant.swatch} aria-hidden="true" />
            <div>
              <p class="ct-sub">{item.sku} · {item.department} · {item.fabric}</p>
              <h1 class="ct-title ct-stock-title">{item.name}</h1>
              <p class="ct-stock-price">{brl(item.price)} <small>or 3× {brl(Math.round((item.price / 3) * 100) / 100, { cents: true })} with Maré Pay</small></p>
            </div>
          </div>
          <div class="ct-variants" role="radiogroup" aria-label="Color" data-anchor="ct-stock-colors">
            {variants.map((entry) => (
              <button type="button" role="radio" key={entry.sku} aria-checked={entry.sku === variant.sku} onClick={() => { setSold({}); setParams({ color: entry.sku }); }}>
                <span class="swatch" data-swatch={entry.swatch} />{entry.colorName}
              </button>
            ))}
          </div>

          <div class="ct-size-head">
            <h2>At Vila Nova Mall</h2>
            <span class="ct-fresh" data-anchor="ct-stock-freshness"><i aria-hidden="true" /><Freshness at={lastEvent} prefix="updated from stock events" /></span>
          </div>
          <div class="ct-sizes" role="radiogroup" aria-label="Size" data-anchor="ct-stock-sizes">
            {item.sizes.map((entry, index) => {
              const count = units[index]!;
              return (
                <button type="button" role="radio" key={entry} aria-checked={entry === size} class={`ct-size ${count === 0 ? 'out' : count <= 2 ? 'low' : ''} ${flash === `${variant.sku}:${entry}` ? 'is-arriving' : ''}`} onClick={() => setParams({ size: entry })}>
                  <b>{entry}</b>
                  <span>{count === 0 ? 'Out' : `${count} here`}</span>
                </button>
              );
            })}
          </div>

          {reserved && (
            <Banner tone="success" icon="✓" title={`Reserved ${reserved.size} for ${reserved.customer} until ${clock(reserved.until)}`} anchor="ct-reserved">
              Holding for {duration(reserved.until - now)} more. The customer got a text with the pickup code; it releases automatically if nobody comes.
            </Banner>
          )}

          <div class="ct-stock-actions" data-anchor="ct-stock-actions">
            <button type="button" class="ct-primary" disabled={selectedUnits === 0 || Boolean(reserved)} onClick={() => openLayer({ modal: 'reserve' })}>Reserve for customer · 2 h</button>
            <button type="button" class="ct-secondary" onClick={() => openLayer({ modal: 'ship' })}>Ship to customer's home</button>
          </div>

          <section class="ct-stock-feed" aria-labelledby="feed-title" data-anchor="ct-stock-feed">
            <h2 id="feed-title">Stock events · this store <small class="live-fresh">{feed.items.length} latest</small></h2>
            <ol>
              {feed.items.map((event) => (
                <li key={event.id} class={`${feed.fresh.includes(event.id) ? 'is-arriving' : ''} ${event.payload.sku === variant.sku ? 'mine' : ''}`}>
                  <time>{clock(Date.parse(event.at), true)}</time>
                  <b>{event.payload.size}</b>
                  <span>{catalogBySku(event.payload.sku)?.name ?? event.payload.sku}</span>
                  <em>reserved · {event.payload.orderId}</em>
                </li>
              ))}
            </ol>
          </section>
        </section>

        <aside class="ct-stock-side">
          {selectedUnits === 0 ? (
            <AiSurface title={`${size} is out here · offer ${up} or pull ${size}`} meta="3 sources · confidence 0.87" anchor="ct-stock-ai"
              sources={[{ label: 'returns · this style · 90 days', score: 0.91 }, { label: 'fit notes · runs small', score: 0.86 }, { label: 'stock projection · live', score: 0.95 }]}
              actions={<><button type="button" class="ai-approve" onClick={() => setParams({ size: up })}>Show {up} · {upUnits} here</button>{closest && <button type="button" class="ai-explain" onClick={() => setPulled({ ...pulled, [closest.store.code]: clock(now + closest.store.courierMinutes * 60_000) })}>Pull {size} from {closest.store.name}</button>}</>}>
              This style runs small: 71% of customers who tried {up} after {size} kept it. {closest ? `${closest.store.name} has ${closest.units} in ${size}, ${closest.store.courierMinutes} min away by courier.` : 'No nearby store has it; Online DC ships tomorrow.'}
            </AiSurface>
          ) : (
            <AiSurface title="Pairs well: Canvas tote bag · 6 here" meta="basket affinity · 0.78" anchor="ct-stock-ai" sources={[{ label: 'baskets · this store · 30 days', score: 0.82 }]}>
              Customers who bought this style at the counter added the tote 34% of the time.
            </AiSurface>
          )}

          <section class="ct-nearby" aria-labelledby="nearby-title" data-anchor="ct-nearby">
            <h2 id="nearby-title">Nearby · size {size}</h2>
            <ul>
              {nearby.map((store) => {
                const count = unitsAt(variant.sku, store.code, item.sizes)[item.sizes.indexOf(size)] ?? 0;
                return (
                  <li key={store.code}>
                    <div><b>{store.name}</b><small>{store.km.toFixed(1)} km · courier {store.courierMinutes < 60 ? `${store.courierMinutes} min` : duration(store.courierMinutes * 60_000)}</small></div>
                    <span class={`ct-units ${count === 0 ? 'out' : count <= 2 ? 'low' : ''}`}>{count === 0 ? 'Out' : `${count}`}</span>
                    {pulled[store.code] ? <span class="ct-pulled">Arrives {pulled[store.code]}</span> : <button type="button" class="ct-secondary ct-pull" disabled={count === 0} onClick={() => setPulled({ ...pulled, [store.code]: clock(now + store.courierMinutes * 60_000) })}>Pull</button>}
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      {modal === 'reserve' && <Reserve item={item.name} size={size} now={now} onDone={(customer) => { setReserved({ size, customer, until: now + HOLD_MS }); act({ type: 'toast', message: `Reserved ${item.name} ${size} for ${customer} until ${clock(now + HOLD_MS)} · text sent` }); }} />}
      {modal === 'ship' && <Ship item={item.name} size={size} price={item.price} onDone={() => act({ type: 'toast', message: `Home delivery booked · ${item.name} ${size} · arrives tomorrow by 18:00` })} />}
      {modal === 'scan-item' && <ScanItem onDone={() => choose('MR-18511')} />}
    </main>
  );
}

function Reserve({ item, size, now, onDone }: { item: string; size: string; now: number; onDone: (customer: string) => void }) {
  const [customer, setCustomer] = useState('Helena');
  const close = () => closeLayers(['modal']);
  return (
    <Layer kind="modal" title="Reserve for a customer" eyebrow={`${item} · size ${size}`} onClose={close} width={560} anchor="ct-reserve"
      footer={<><button type="button" class="ct-ghost" onClick={close}>Cancel</button><button type="button" class="ct-primary" disabled={!customer.trim()} onClick={() => { onDone(customer.trim()); close(); }}>Hold until {clock(now + HOLD_MS)}</button></>}>
      <label class="ct-field">Customer name<input value={customer} data-autofocus onInput={(event) => setCustomer(event.currentTarget.value)} /></label>
      <label class="ct-field">Mobile for the pickup code<input value="(11) 9••••-4471" readOnly /></label>
      <p class="ct-note">The unit leaves available stock for 2 hours (a reservation event, not a sale). Site and app see it within a second, so it cannot be sold twice.</p>
    </Layer>
  );
}

function Ship({ item, size, price, onDone }: { item: string; size: string; price: number; onDone: () => void }) {
  const close = () => closeLayers(['modal']);
  const free = price >= 299;
  return (
    <Layer kind="modal" title="Ship to the customer's home" eyebrow={`${item} · size ${size}`} onClose={close} width={560} anchor="ct-ship"
      footer={<><button type="button" class="ct-ghost" onClick={close}>Cancel</button><button type="button" class="ct-primary" onClick={() => { onDone(); close(); }}>Book delivery</button></>}>
      <dl class="ct-receipt">
        <div><dt>From</dt><dd>Online DC · picks tonight</dd></div>
        <div><dt>To</dt><dd>742 Ocean Avenue, apt 31 · Sao Paulo</dd></div>
        <div><dt>Promise</dt><dd>Tomorrow by 18:00 · Via Norte</dd></div>
        <div><dt>Delivery</dt><dd>{free ? 'Free (over R$299)' : 'R$14.90'}</dd></div>
      </dl>
      <p class="ct-note">The customer pays at the counter now; the order is an ordinary delivery order, so it shows in their app with live tracking.</p>
    </Layer>
  );
}

function ScanItem({ onDone }: { onDone: () => void }) {
  const close = () => closeLayers(['modal']);
  const scan = () => {
    onDone();
    close();
  };
  return (
    <Layer kind="modal" title="Scan a tag" eyebrow="Stock lookup · camera" onClose={close} width={520} anchor="ct-scan-item"
      footer={<><button type="button" class="ct-ghost" onClick={close}>Cancel</button><button type="button" class="ct-primary" onClick={scan} data-autofocus>Simulate scan</button></>}>
      <button type="button" class="ct-viewfinder" onClick={scan} aria-label="Simulate scanning a tag">
        <i class="corner tl" /><i class="corner tr" /><i class="corner bl" /><i class="corner br" />
        <span class="ct-barcode" aria-hidden="true" />
        <span class="ct-scanline" aria-hidden="true" />
      </button>
    </Layer>
  );
}

