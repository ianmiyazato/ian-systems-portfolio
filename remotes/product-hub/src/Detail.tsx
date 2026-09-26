import { AiSurface, Banner, Layer, Link, closeLayers, openLayer, setParams, useDemoState, useLocation, useSequence } from '@portfolio/remote-runtime';
import { useMemo, useState } from 'preact/hooks';
import { product, products } from './data';
import { PriceChart } from './charts';
import { allPass, forecastLift, guardrails, margin } from './pricing';

const tabs = [['overview', 'Overview'], ['stock', 'Stock by location'], ['pricing', 'Pricing'], ['offers', 'Marketplace offers'], ['content', 'Content'], ['audit', 'Audit log']] as const;
const brl = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export function Detail({ id }: { id: string }) {
  const { params } = useLocation();
  const state = useDemoState();
  const tab = params.get('tab') ?? 'pricing';
  const row = products.find((item) => item.id === id) ?? products[0]!;
  const modal = params.get('modal');
  const [approved, setApproved] = useState<number | null>(null);

  return (
    <main class="ph-detail">
      <nav class="ph-crumbs" aria-label="Breadcrumb">
        <Link href="/mare/ops/product-hub">Catalog</Link> / <span>Women</span> / <span>Tops</span> / <span aria-current="page">{row.name}</span>
      </nav>
      <header class="ph-detail-head" data-anchor="ph-detail-head">
        <span class="swatch big" data-swatch={row.swatch} />
        <div>
          <h1>{row.name}</h1>
          <p class="mono">{row.sku} · product {product.id} · owner {row.owner}</p>
        </div>
        <ul class="ph-tags">{product.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        <div class="ph-detail-actions">
          <button type="button" class="ph-btn">Duplicate</button>
          <button type="button" class="ph-btn primary" onClick={() => openLayer({ modal: 'agent-run' })}>Run pricing agent</button>
        </div>
      </header>
      <nav class="ph-subtabs" aria-label="Product sections">
        {tabs.map(([key, label]) => (
          <button type="button" key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => setParams({ tab: key })}>{label}</button>
        ))}
      </nav>
      {approved && <Banner tone="success" icon="✓" title={`Price change approved · ${brl(approved)} on site and app until 12 Oct`} anchor="ph-approved">Written to the audit log with your reason. The product page revalidates on the price event; marketplace keeps R$ 249.</Banner>}
      {state === 'rejected' && <Banner tone="risk" icon="!" title="Last proposal rejected · margin below the 30% floor">The agent's R$ 199 proposal was rejected by Lara; guardrails now block anything under R$ 207.</Banner>}

      <div class="ph-grid">
        <section class="ph-card span-2" aria-labelledby="chart-title" data-anchor="ph-chart">
          <header><h2 id="chart-title">Price vs sell-through · 12 weeks</h2><ul class="ph-legend"><li class="price">Price</li><li class="sell">Sell-through</li><li class="forecast">Agent forecast</li></ul></header>
          <PriceChart price={product.priceHistory} sell={product.sellThrough} forecast={product.forecast} proposed={approved ?? 219} />
        </section>
        <section class="ph-card" data-anchor="ph-agent-suggestion">
          <AiSurface title="Lower to R$ 219 until 12 Oct" meta="pricing agent · 0.86" sources={[{ label: 'sales · 28d', score: 0.93 }, { label: 'competitors · 6 offers', score: 0.88 }]}
            actions={<><button type="button" class="ai-approve" onClick={() => openLayer({ modal: 'agent-run' })}>Review agent run</button><button type="button" class="ai-explain" onClick={() => openLayer({ modal: 'agent-run' })}>Why?</button></>}>
            Sell-through fell from 52% to 44% while competitors sit at a R$ 231 median. Forecast: +18% units, margin 34.1%.
          </AiSurface>
        </section>
        <section class="ph-card" aria-labelledby="stock-title" data-anchor="ph-stock">
          <header><h2 id="stock-title">Stock by store</h2><span class="mono">184 units</span></header>
          <table class="ph-heat">
            <thead><tr><th /> {product.sizes.map((size) => <th key={size}>{size}</th>)}</tr></thead>
            <tbody>
              {product.stores.map((store, row) => (
                <tr key={store}>
                  <th>{store}</th>
                  {product.stock[row]!.map((value, col) => <td key={col} style={{ '--level': Math.min(value / 30, 1) }} class={value === 0 ? 'zero' : value / 30 > 0.55 ? 'hot' : ''}>{value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section class="ph-card" aria-labelledby="offers-title" data-anchor="ph-offers">
          <header><h2 id="offers-title">Marketplace offers</h2></header>
          <ul class="ph-offers">
            {product.offers.map((offer) => (
              <li key={offer.seller} class={offer.buyBox ? 'buybox' : ''}>
                <strong>{offer.seller}</strong><span>{brl(offer.price)}</span><small>★ {offer.rating} · {offer.ship}</small>{offer.buyBox && <em>Buy box</em>}
              </li>
            ))}
          </ul>
        </section>
        <section class="ph-card" aria-labelledby="rules-title" data-anchor="ph-rules">
          <header><h2 id="rules-title">Price rules</h2></header>
          <dl class="ph-rules">
            <div><dt>Margin floor</dt><dd>30%</dd></div>
            <div><dt>Max markdown</dt><dd>20% / 30 days</dd></div>
            <div><dt>Marketplace parity</dt><dd>±5% of median</dd></div>
            <div><dt>Approval</dt><dd>Owner, any change</dd></div>
          </dl>
        </section>
        <section class="ph-card span-2" aria-labelledby="changes-title" data-anchor="ph-changes">
          <header><h2 id="changes-title">Recent changes</h2></header>
          <table class="ph-table compact">
            <tbody>
              {product.changes.map(([date, who, what, result]) => (
                <tr key={date + what}><td class="mono">{date}</td><td>{who}</td><td>{what}</td><td><span class={`ph-tag ${result.startsWith('Approved') ? 'ok' : 'bad'}`}>{result}</span></td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      {modal === 'agent-run' && <AgentRun onApprove={(price) => { setApproved(price); closeLayers(['modal', 'sub']); }} />}
    </main>
  );
}

const steps = [
  { tool: 'fetch_sales_history', input: 'sku=MR-18401 · 28d', output: '412 units · sell-through 52% → 44%', ms: 84 },
  { tool: 'get_competitor_prices', input: 'linen shirts · 6 sellers', output: 'median R$ 231 · min R$ 219', ms: 212 },
  { tool: 'forecast_elasticity', input: 'price=219 · ε=-1.3', output: '+18% units · ±4%', ms: 356 },
  { tool: 'check_guardrails', input: 'margin, markdown, parity, window', output: 'pass 4/4', ms: 31 },
  { tool: 'draft_price_change', input: 'site + app · until 12 Oct', output: 'proposal ready for approval', ms: 42 }
];

function AgentRun({ onApprove }: { onApprove: (price: number) => void }) {
  const { params } = useLocation();
  const sub = params.get('sub');
  const shown = useSequence(steps.length, 420);
  const done = shown >= steps.length;
  return (
    <>
      <Layer
        kind="modal"
        title="Pricing agent run"
        eyebrow="Camisa linho natural · proposal"
        onClose={() => closeLayers(['modal', 'sub'])}
        width={640}
        anchor="ph-agent-run"
        footer={
          <>
            <button type="button" class="ph-btn" onClick={() => closeLayers(['modal', 'sub'])}>Reject</button>
            <button type="button" class="ph-btn" disabled={!done} onClick={() => openLayer({ sub: 'edit' })} data-anchor="ph-edit-button">Edit proposal</button>
            <button type="button" class="ph-btn primary" disabled={!done} onClick={() => onApprove(219)}>Approve R$ 219</button>
          </>
        }
      >
        <div class="ph-run-meta"><span class="ai-badge">Simulated AI</span><span class="mono">run 7f3a · ft-pricing-v2 · 725 ms</span></div>
        <ol class="ph-steps" data-anchor="ph-steps">
          {steps.map((step, index) => (
            <li key={step.tool} class={index < shown ? 'done' : index === shown ? 'running' : ''}>
              <span class="ph-step-dot" aria-hidden="true" />
              <div>
                <code>{step.tool}</code><small>{step.input}</small>
                {index < shown && <p>{step.output}</p>}
              </div>
              <span class="mono">{index < shown ? `${step.ms} ms` : index === shown ? 'running…' : ''}</span>
            </li>
          ))}
        </ol>
        <ul class="ph-guardrails" aria-label="Guardrails" data-anchor="ph-guardrails">
          {['Margin ≥ 30%', 'Markdown ≤ 20%', 'Parity ±5%', 'Window ≤ 30 days'].map((label) => <li key={label} class={done ? 'pass' : ''}>{done ? '✓' : '·'} {label}</li>)}
        </ul>
        <p class="ph-note">The agent can only propose. Approving writes a price event with your name and reason; the PDP revalidates on that event.</p>
      </Layer>
      {sub === 'edit' && <EditProposal onSave={onApprove} />}
    </>
  );
}

function EditProposal({ onSave }: { onSave: (price: number) => void }) {
  const [price, setPrice] = useState(219);
  const [days, setDays] = useState(16);
  const [channels, setChannels] = useState(['site', 'app']);
  const [reason, setReason] = useState('Sell-through down 8 pts; matching competitor median for the linen push.');
  const checks = useMemo(() => guardrails({ price, cost: product.cost, basePrice: product.price, days, channels, competitorMedian: product.competitorMedian }), [price, days, channels]);
  const ok = allPass(checks) && reason.trim().length > 10;
  const lift = forecastLift(price, product.price);
  const toggle = (channel: string) => setChannels(channels.includes(channel) ? channels.filter((item) => item !== channel) : [...channels, channel]);
  return (
    <Layer
      kind="sub"
      level={2}
      title="Edit proposal"
      eyebrow="Your change, same guardrails"
      onClose={() => closeLayers(['sub'])}
      width={460}
      anchor="ph-edit"
      footer={<button type="button" class="ph-btn primary wide" disabled={!ok} onClick={() => onSave(price)}>Save and approve</button>}
    >
      <div class="ph-form">
        <label>New price (R$)<input type="number" min={150} max={300} step={1} value={price} onInput={(event) => setPrice(Number(event.currentTarget.value) || 0)} /></label>
        <label>End date<select value={days} onChange={(event) => setDays(Number(event.currentTarget.value))}><option value={16}>12 Oct (16 days)</option><option value={30}>26 Oct (30 days)</option><option value={45}>10 Nov (45 days)</option></select></label>
        <fieldset>
          <legend>Channels</legend>
          {['site', 'app', 'marketplace'].map((channel) => (
            <label key={channel} class="ph-check inline"><input type="checkbox" checked={channels.includes(channel)} onChange={() => toggle(channel)} /><span>{channel[0]!.toUpperCase() + channel.slice(1)}</span></label>
          ))}
        </fieldset>
      </div>
      <dl class="ph-live" data-anchor="ph-live-metrics">
        <div><dt>Margin</dt><dd class={margin(price, product.cost) < 0.3 ? 'bad' : ''}>{(margin(price, product.cost) * 100).toFixed(1)}%</dd></div>
        <div><dt>Forecast</dt><dd>{lift >= 0 ? '+' : ''}{(lift * 100).toFixed(0)}% units</dd></div>
        <div><dt>Guardrails</dt><dd class={allPass(checks) ? 'ok' : 'bad'}>{checks.filter((item) => item.pass).length}/4</dd></div>
      </dl>
      <ul class="ph-guardrails small">{checks.map((item) => <li key={item.id} class={item.pass ? 'pass' : 'fail'}>{item.pass ? '✓' : '✕'} {item.label} · {item.detail}</li>)}</ul>
      <label class="ph-form-reason">Reason for the audit log<textarea rows={3} value={reason} onInput={(event) => setReason(event.currentTarget.value)} /></label>
    </Layer>
  );
}
