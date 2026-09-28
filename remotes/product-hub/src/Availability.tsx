import { AiSurface, Banner, Freshness, Layer, LiveControl, Tween, closeLayers, openLayer, useDemoState, useLocation, useWorldEvents } from '@portfolio/remote-runtime';
import { catalog, int, rng, seedOf } from '@portfolio/mocks';
import { useEffect, useMemo, useState } from 'preact/hooks';

type Channel = 'site' | 'app' | 'marketplace' | 'stores';
const channels: Channel[] = ['site', 'app', 'marketplace', 'stores'];
const label: Record<Channel, string> = { site: 'Site', app: 'App', marketplace: 'Marketplace', stores: 'Stores' };

type Row = { sku: string; name: string; swatch: string; safety: number; atp: Record<Channel, number> };

/** Available-to-promise per channel for the busiest SKUs, from the allocation service. */
const baseRows: Row[] = catalog.slice(0, 10).map((item) => {
  const random = rng(seedOf(`atp:${item.sku}`));
  const atp = { site: int(random, 18, 60), app: int(random, 12, 44), marketplace: int(random, 10, 36), stores: int(random, 60, 180) };
  if (item.sku === 'MR-18511') atp.app = 5;
  return { sku: item.sku, name: item.name, swatch: item.swatch, safety: int(random, 6, 10), atp };
});

/** Which channel an order sold through, stable per order. */
const channelOf = (orderId: string): Channel => (['site', 'app', 'app', 'marketplace', 'stores'] as const)[seedOf(orderId) % 5]!;

type Move = { sku: string; from: Channel; to: Channel; units: number; at: number };
const UNDO_MS = 10_000;

export function Availability() {
  const state = useDemoState();
  const { params } = useLocation();
  const [sold, setSold] = useState<Record<string, number>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [lastAt, setLastAt] = useState(() => Date.now() - 2000);
  const [moves, setMoves] = useState<Move[]>([]);
  const [pending, setPending] = useState<Move | null>(null);

  // Every reservation drains the channel the order came from: allocation drifts in real time.
  useWorldEvents(['stock.reserved'], (event) => {
    if (!baseRows.some((row) => row.sku === event.payload.sku)) return;
    const key = `${event.payload.sku}:${channelOf(event.payload.orderId)}`;
    setSold((current) => ({ ...current, [key]: (current[key] ?? 0) + event.payload.quantity }));
    setFlash(key);
    setLastAt(Date.now());
  });

  // Optimistic moves commit after the undo window unless undone.
  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => setPending(null), UNDO_MS);
    return () => clearTimeout(id);
  }, [pending]);

  const rows = useMemo(() => baseRows.map((row) => {
    const atp = { ...row.atp };
    for (const channel of channels) atp[channel] = Math.max(0, atp[channel] - (sold[`${row.sku}:${channel}`] ?? 0));
    for (const move of moves.filter((item) => item.sku === row.sku)) {
      atp[move.from] -= move.units;
      atp[move.to] += move.units;
    }
    if (state === 'oversold' && row.sku === 'MR-18511') atp.app = 0;
    return { ...row, atp };
  }), [sold, moves, state]);

  const atRisk = rows.filter((row) => channels.some((channel) => row.atp[channel] < row.safety));
  const total = rows.reduce((sum, row) => sum + channels.reduce((inner, channel) => inner + row.atp[channel], 0), 0);
  const dress = rows.find((row) => row.sku === 'MR-18511')!;
  const target = rows.find((row) => row.sku === params.get('sku')) ?? dress;

  const apply = (move: Omit<Move, 'at'>) => {
    const next = { ...move, at: Date.now() };
    setMoves((current) => [...current, next]);
    setPending(next);
    closeLayers(['modal', 'sku']);
  };
  const undo = () => {
    if (!pending) return;
    setMoves((current) => current.filter((item) => item !== pending));
    setPending(null);
  };

  return (
    <main class="ph-main" id="product-hub-availability">
      <div class="ph-title-row" data-anchor="ph-availability-head">
        <div>
          <h1>Availability</h1>
          <p class="ph-muted">Available to promise per channel · <Freshness at={lastAt} prefix="updated from stock events" /></p>
        </div>
        <LiveControl anchor="ph-availability-live" />
      </div>
      {state === 'oversold' && <Banner tone="risk" icon="!" title="App oversold 3 units of Linen midi dress · M" anchor="ph-oversold" action={<button type="button" class="ph-btn" onClick={() => openLayer({ modal: 'rebalance', sku: 'MR-18511' })}>Rebalance</button>}>The evening peak drained app allocation faster than the safety stock assumed. Customers were offered backorder with a date; nothing was canceled.</Banner>}
      {state === 'error' && <Banner tone="risk" icon="!" title="Allocation service unreachable · showing the last snapshot (16:02)" anchor="ph-availability-error">Checkout keeps checking inventory directly, so no channel can oversell while this is stale.</Banner>}

      <div class="ph-kpis" data-anchor="ph-availability-kpis">
        <div><span>Available to promise</span><strong><Tween value={total} /></strong><small>10 busiest SKUs · all channels</small></div>
        <div><span>Below safety stock</span><strong class={atRisk.length ? 'warn' : ''}>{atRisk.length}</strong><small>SKU × channel pairs need a look</small></div>
        <div><span>Moves today</span><strong>{moves.length + 14}</strong><small>{moves.length ? 'including yours' : 'by planners and the agent'}</small></div>
        <div><span>Oversell events · 30 days</span><strong>{state === 'oversold' ? 4 : 3}</strong><small>all offered backorder</small></div>
      </div>

      <div class="ph-grid-2">
        <section class="ph-table-wrap" aria-labelledby="atp-title" data-anchor="ph-atp-matrix">
          <header class="ph-table-head"><h2 id="atp-title">Allocation by channel</h2><span class="ph-muted">cell = units you can still promise · shaded = below safety stock</span></header>
          <table class="ph-table ph-atp">
            <thead><tr><th>SKU</th>{channels.map((channel) => <th key={channel} class="num">{label[channel]}</th>)}<th class="num">Safety</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.sku}>
                  <td><span class="swatch" data-swatch={row.swatch} /> <b>{row.name}</b><small class="mono"> {row.sku}</small></td>
                  {channels.map((channel) => {
                    const value = row.atp[channel];
                    const key = `${row.sku}:${channel}`;
                    return <td key={channel} class={`num ${value < row.safety ? 'low' : ''} ${flash === key ? 'is-arriving' : ''} ${pending?.sku === row.sku && (pending.to === channel || pending.from === channel) ? 'moved' : ''}`}><span class="ph-atp-bar" style={{ '--v': Math.min(value / 60, 1) }} />{value}</td>;
                  })}
                  <td class="num mono">{row.safety}</td>
                  <td><button type="button" class="ph-btn" onClick={() => openLayer({ modal: 'rebalance', sku: row.sku })}>Rebalance</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <AiSurface title="App runs out of Linen midi dress before 20:00" meta="allocation agent · 0.86" anchor="ph-availability-ai"
          sources={[{ label: 'stock events · live', score: 0.95 }, { label: 'evening peak · last 4 Fridays', score: 0.87 }, { label: 'channel margin', score: 0.8 }]}
          actions={<button type="button" class="ai-approve" onClick={() => openLayer({ modal: 'rebalance', sku: 'MR-18511' })}>Review the move</button>}>
          App has {dress.atp.app} left against a safety stock of {dress.safety}; the evening peak sells ~9 an hour there. Moving 6 from Marketplace keeps both above safety, and Marketplace margin is 11 pts lower.
        </AiSurface>
      </div>

      {pending && (
        <div class="ph-undo" role="status" data-anchor="ph-undo-toast">
          <span>Moved {pending.units} units of {rows.find((row) => row.sku === pending.sku)?.name} · {label[pending.from]} → {label[pending.to]}</span>
          <button type="button" class="ph-btn" onClick={undo}>Undo</button>
          <i class="ph-undo-timer" aria-hidden="true" />
        </div>
      )}
      {params.get('modal') === 'rebalance' && <Rebalance row={target} onApply={apply} />}
    </main>
  );
}

function Rebalance({ row, onApply }: { row: Row; onApply: (move: Omit<Move, 'at'>) => void }) {
  const [from, setFrom] = useState<Channel>('marketplace');
  const [to, setTo] = useState<Channel>('app');
  const [units, setUnits] = useState(6);
  const max = Math.max(0, row.atp[from] - 1);
  const valid = from !== to && units > 0 && units <= max;
  return (
    <Layer kind="modal" title="Rebalance allocation" eyebrow={`${row.name} · ${row.sku}`} onClose={() => closeLayers(['modal', 'sku'])} width={520} anchor="ph-rebalance"
      footer={<><button type="button" class="ph-btn" onClick={() => closeLayers(['modal', 'sku'])}>Cancel</button><button type="button" class="ph-btn primary" disabled={!valid} onClick={() => onApply({ sku: row.sku, from, to, units })}>Move {units} units</button></>}>
      <div class="ph-form">
        <label>From<select value={from} onChange={(event) => setFrom(event.currentTarget.value as Channel)}>{channels.map((channel) => <option key={channel} value={channel}>{label[channel]} · {row.atp[channel]} left</option>)}</select></label>
        <label>To<select value={to} onChange={(event) => setTo(event.currentTarget.value as Channel)}>{channels.map((channel) => <option key={channel} value={channel}>{label[channel]} · {row.atp[channel]} left</option>)}</select></label>
        <label>Units<input type="number" min={1} max={max} value={units} onInput={(event) => setUnits(Number(event.currentTarget.value) || 0)} /></label>
      </div>
      <dl class="ph-live">
        <div><dt>{label[from]} after</dt><dd class={row.atp[from] - units < row.safety ? 'bad' : ''}>{row.atp[from] - units}</dd></div>
        <div><dt>{label[to]} after</dt><dd class="ok">{row.atp[to] + units}</dd></div>
        <div><dt>Safety stock</dt><dd>{row.safety}</dd></div>
      </dl>
      <p class="ph-note">Applies instantly and can be undone for 10 seconds; then the allocation service confirms it. Physical stock does not move, only what each channel may promise.</p>
    </Layer>
  );
}
