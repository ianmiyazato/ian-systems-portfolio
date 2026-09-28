import { brl } from '@portfolio/mocks';
import { Banner, Link, LiveControl, Tween, navigate, useDemoState, useScreenActions, useSimNow, useWorldEvents } from '@portfolio/remote-runtime';
import { DEFAULT_START, MINUTE } from '@portfolio/world';
import { useState } from 'preact/hooks';
import { facets, products, type Status } from './data';
import { Sparkline } from './charts';

const tone = (status: Status) => (status === 'Healthy' ? 'ok' : status === 'Low margin' || status === 'Rejected' ? 'bad' : 'warn');


type SavedView = { name: string; filter: string[] };
const SAVED_KEY = 'ph:saved-views';
const views: SavedView[] = [{ name: 'All products', filter: [] }, { name: 'Needs review', filter: ['Review price'] }, { name: 'Low stock', filter: ['Low stock'] }];
function readSaved(): SavedView[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as SavedView[]; } catch { return []; }
}

export function Catalog() {
  const state = useDemoState();
  const [selected, setSelected] = useState<string[]>(state === 'live' ? products.slice(0, 3).map((row) => row.id) : []);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [approved, setApproved] = useState<string[]>([]);
  const [undo, setUndo] = useState<{ ids: string[]; timer: number } | null>(null);
  const [saved, setSaved] = useState<SavedView[]>(readSaved);
  const now = useSimNow(2000);
  // Stock drains as the world reserves units; the 28-day sparkline shifts left with each sale.
  const [sold, setSold] = useState<Record<string, number>>({});
  const [fresh, setFresh] = useState<string | null>(null);
  useWorldEvents(['stock.reserved'], (event) => {
    if (!products.some((row) => row.sku === event.payload.sku)) return;
    setSold((current) => ({ ...current, [event.payload.sku]: (current[event.payload.sku] ?? 0) + event.payload.quantity }));
    setFresh(event.payload.sku);
  });
  // The agents keep working: a new proposal lands in the queue every ~6 minutes of sim time.
  const queued = 24 + Math.max(0, Math.floor((now - DEFAULT_START) / (6 * MINUTE)));
  const empty = state === 'empty';
  const rows = empty
    ? []
    : products
        .map((row, index) => (state === 'rejected' && index === 0 ? { ...row, status: 'Rejected' as Status } : row))
        .map((row) => (approved.includes(row.id) ? { ...row, status: 'Healthy' as Status } : row))
        .map((row) => (sold[row.sku] ? { ...row, stock: Math.max(0, row.stock - sold[row.sku]!), spark: [...row.spark.slice(sold[row.sku]! % row.spark.length), ...row.spark.slice(0, sold[row.sku]! % row.spark.length).map((value) => value + 1.5)] } : row))
        .filter((row) => !statusFilter.length || statusFilter.includes(row.status));
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  // Bulk approve is optimistic: rows flip at once, and a 10-second undo puts them back before anything is sent.
  const reviewable = rows.filter((row) => selected.includes(row.id) && row.status === 'Review price');
  const approveSelected = () => {
    const ids = reviewable.map((row) => row.id);
    if (!ids.length) return;
    setApproved((current) => [...current, ...ids]);
    if (undo) window.clearTimeout(undo.timer);
    setUndo({ ids, timer: window.setTimeout(() => setUndo(null), 10_000) });
  };
  const undoApprove = () => {
    if (!undo) return;
    window.clearTimeout(undo.timer);
    setApproved((current) => current.filter((id) => !undo.ids.includes(id)));
    setUndo(null);
  };
  useScreenActions(reviewable.length ? [{ id: 'ph:approve-selected', title: `Approve ${reviewable.length} selected ${reviewable.length === 1 ? 'price' : 'prices'}`, hint: 'optimistic · 10 s undo', keywords: 'approve bulk price', run: approveSelected }] : [], [reviewable.map((row) => row.id).join()]);
  const saveView = () => {
    const next = [...saved, { name: statusFilter.join(' + '), filter: statusFilter }];
    setSaved(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* per-viewer convenience */ }
  };
  const activeView = views.concat(saved).find((view) => view.filter.join() === statusFilter.join());
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));

  return (
    <div class={`ph-workspace ${state === 'locked' ? 'is-locked' : ''}`}>
      <aside class="ph-facets" aria-label="Filters" data-anchor="ph-facets" tabIndex={0}>
        <section>
          <h2>Saved views</h2>
          {views.concat(saved).map((view) => (
            <button type="button" key={view.name} class={`ph-view ${activeView === view ? 'active' : ''}`} aria-pressed={activeView === view} onClick={() => setStatusFilter(view.filter)}>{view.name}<span>{view.filter.length ? products.filter((row) => view.filter.includes(row.status)).length : products.length}</span></button>
          ))}
          {statusFilter.length > 0 && !activeView && <button type="button" class="ph-view save" onClick={saveView} data-anchor="ph-save-view">+ Save this view</button>}
        </section>
        <FacetGroup title="Channel" items={facets.channel} checked={empty ? ['Marketplace'] : []} />
        <FacetGroup title="Department" items={facets.department} checked={empty ? ['Shoes'] : ['Women']} />
        <section>
          <h2>Status</h2>
          {facets.status.map(([label, count]) => (
            <label key={label} class="ph-check">
              <input type="checkbox" checked={statusFilter.includes(label)} onChange={() => setStatusFilter(statusFilter.includes(label) ? statusFilter.filter((item) => item !== label) : [...statusFilter, label])} />
              <span>{label}</span>
              <em>{count.toLocaleString('en-US')}</em>
            </label>
          ))}
        </section>
      </aside>

      <main class="ph-main" id="catalog">
        <div class="ph-crumbs">Catalog / Saved views</div>
        <header class="ph-title-row">
          <h1 data-anchor="ph-title">Summer · needs action</h1>
          <div class="ph-title-actions">
            <LiveControl anchor="ph-catalog-live" />
            <button type="button" class="ph-btn">Export CSV</button>
            <button type="button" class="ph-btn primary">New product</button>
          </div>
        </header>
        {state === 'rejected' && (
          <Banner tone="risk" icon="!" title="Price change rejected · Natural linen shirt · R$199" anchor="ph-rejected">
            Lara rejected the proposal: margin would fall to 27.4%, below the 30% floor, and the marketplace offer would lose parity. The agent will not re-propose below R$207.
          </Banner>
        )}
        {state === 'error' && <Banner tone="risk" icon="!" title="Pricing service timed out · showing prices cached at 16:02" anchor="ph-error">Edits are disabled until prices refresh; nothing you see is stale by more than 16 minutes.</Banner>}
        {state === 'offline' && <Banner tone="warn" icon="↯" title="You're offline · changes are saved as drafts" anchor="ph-offline">Drafts sync with their version number, so nobody's newer edit is overwritten.</Banner>}
        {state === 'locked' && <Banner tone="info" icon="i" title="Summer 27 price freeze · 16:00–18:00 · read-only" anchor="ph-locked">Campaign prices are locked while the site caches warm up. Requests queue for 18:00.</Banner>}

        <div class="ph-kpis" data-anchor="ph-kpis">
          <div><span>Needs action</span><strong><Tween value={queued} /></strong><small>{queued > 24 ? `+${queued - 24} from the agents since 16:18` : '+6 since Monday'}</small></div>
          <div><span>Low margin</span><strong class="bad">8</strong><small>below 30% floor</small></div>
          <div><span>Missing offer</span><strong class="warn">5</strong><small>marketplace only</small></div>
          <div><span>Sell-through · 28d</span><strong>61%</strong><small>target 65%</small></div>
        </div>

        <div class="ph-table-wrap" data-anchor="ph-table" tabIndex={0} role="region" aria-label="Products">
          <table class="ph-table">
            <thead>
              <tr>
                <th class="check"><input type="checkbox" aria-label="Select all rows" checked={allSelected} onChange={() => setSelected(allSelected ? [] : rows.map((row) => row.id))} /></th>
                <th>Product</th><th>SKU</th><th>Owner</th><th class="num">Stock</th><th class="num">Price</th><th class="num">Margin</th><th>28 days</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state === 'loading' &&
                Array.from({ length: 9 }, (_, index) => (
                  <tr key={index} class="ph-skeleton-row" aria-hidden="true">
                    {Array.from({ length: 9 }, (__, cell) => <td key={cell}><i class="skeleton" /></td>)}
                  </tr>
                ))}
              {state !== 'loading' &&
                rows.map((row) => (
                  <tr key={row.id} data-nav-row class={`${selected.includes(row.id) ? 'selected' : ''} ${fresh === row.sku ? 'is-arriving' : ''}`}>
                    <td class="check"><input type="checkbox" aria-label={`Select ${row.name}`} checked={selected.includes(row.id)} onChange={() => toggle(row.id)} /></td>
                    <td><Link class="ph-product" data-nav-open href={`/mare/ops/product-hub/products/${row.id}?tab=pricing`}><span class="swatch" data-swatch={row.swatch} />{row.name}</Link></td>
                    <td class="mono">{row.sku}</td>
                    <td>{row.owner}</td>
                    <td class={`num ${row.stock < 20 ? 'warn' : ''}`}>{row.stock}</td>
                    <td class="num">{brl(row.price)}</td>
                    <td class={`num ${row.margin < 30 ? 'bad' : ''}`}>{row.margin}%</td>
                    <td><Sparkline values={row.spark} tone={row.status === 'Review price' ? 'risk' : 'accent'} /></td>
                    <td><span class={`ph-tag ${tone(row.status)}`}>{row.status}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
          {empty && (
            <div class="ph-zero" data-anchor="ph-zero">
              <strong>No products match Summer · Marketplace · Shoes</strong>
              <p>Summer shoes aren't listed on the marketplace yet. Clear a facet, or start a seller onboarding to bring them in.</p>
              <div><button type="button" class="ph-btn" onClick={() => navigate('/mare/ops/product-hub')}>Clear 2 filters</button><Link class="ph-btn primary" href="/mare/ops/product-hub/marketplace/onboarding/linho-co?step=mapping">Onboard a seller</Link></div>
            </div>
          )}
        </div>
        <p class="ph-foot">Showing {rows.length} of 24 · sorted by revenue at risk</p>
      </main>

      {undo && (
        <div class="ph-undo" role="status" data-anchor="ph-undo">
          Approved {undo.ids.length} {undo.ids.length === 1 ? 'price' : 'prices'} · sending in 10 s
          <button type="button" onClick={undoApprove}>Undo</button>
        </div>
      )}
      {selected.length > 0 && state !== 'locked' && (
        <div class="ph-bulk" role="region" aria-label="Bulk actions" data-anchor="ph-bulk">
          <b>{selected.length} selected</b>
          <button type="button" class="primary" onClick={approveSelected} disabled={!reviewable.length}>{reviewable.length ? `Approve ${reviewable.length} ${reviewable.length === 1 ? 'price' : 'prices'}` : 'No prices to approve'}</button>
          <button type="button">Change owner</button>
          <button type="button">Export</button>
          <button type="button" class="ai" onClick={() => navigate('/mare/ops/product-hub/products/510233?modal=agent-run')}><span class="ai-spark" aria-hidden="true" />Ask the pricing agent</button>
          <button type="button" class="clear" onClick={() => setSelected([])} aria-label="Clear selection">×</button>
        </div>
      )}
    </div>
  );
}

function FacetGroup({ title, items, checked }: { title: string; items: ReadonlyArray<readonly [string, number]>; checked: string[] }) {
  return (
    <section>
      <h2>{title}</h2>
      {items.map(([label, count]) => (
        <label key={label} class="ph-check">
          <input type="checkbox" defaultChecked={checked.includes(label)} />
          <span>{label}</span>
          <em>{count.toLocaleString('en-US')}</em>
        </label>
      ))}
    </section>
  );
}
