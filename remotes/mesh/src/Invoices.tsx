import { AiSurface, Banner, Link } from '@portfolio/remote-runtime';
import { useState } from 'preact/hooks';

const chain = [
  { id: 'sale', label: 'sale invoice', doc: 'NF-e 38421', status: 'authorized', tone: 'ok' },
  { id: 'shipment', label: 'shipment invoice', doc: 'NF-e 38422', status: 'rejected · 778', tone: 'bad' },
  { id: 'transport', label: 'transport document', doc: 'CT-e pending', status: 'blocked', tone: 'muted' }
];

const fixes = [
  ['MR-18401', 'Natural linen shirt', '6205.30.00', '6205.90.00', 0.96],
  ['MR-18372', 'Stone wide-leg pants', '6204.69.00', '6204.62.00', 0.91],
  ['MR-18190', 'Sea-salt open knit', '6110.30.00', '6110.20.00', 0.88],
  ['MR-18511', 'Linen midi dress', '6204.49.00', '6204.44.00', 0.9],
  ['MR-18227', 'Linen shorts', '6203.49.00', '6203.43.00', 0.86],
  ['MR-18169', 'Pleated midi skirt', '6204.59.00', '6204.52.00', 0.84]
] as const;

export function Invoices({ order }: { order: string }) {
  const [checked, setChecked] = useState<string[]>(fixes.map(([sku]) => sku));
  const [sent, setSent] = useState(false);
  return (
    <main class="ms-main">
      <Link class="ms-back" href="/mare/ops/mesh">← topology</Link>
      <header class="ms-page-head"><h1>invoice chain · {order}</h1><span class="ms-muted">rota sul collection 17:00 · 42 min</span></header>
      {sent && <Banner tone="success" icon="✓" title="12 skus fixed · 38 invoices resent · 36 authorized so far" anchor="ms-resent">transport documents are being issued; the remaining 2 are in the authority's queue.</Banner>}
      <section class="ms-panel" aria-labelledby="chain-title" data-anchor="ms-chain">
        <header><h2 id="chain-title">document chain</h2></header>
        <div class="ms-chain">
          {chain.map((node, index) => (
            <div key={node.id} class="ms-chain-step">
              <div class={`ms-doc ${sent && node.tone !== 'ok' ? 'ok' : node.tone}`}>
                <span>{node.label}</span><strong>{node.doc}</strong><em>{sent && node.tone !== 'ok' ? 'authorized' : node.status}</em>
              </div>
              {index < chain.length - 1 && (
                <svg class={`ms-link ${!sent && index === 1 ? 'blocked' : ''}`} viewBox="0 0 120 20" aria-hidden="true">
                  <path d="M0,10 H120" />
                  {(sent || index === 0) && <circle r="4" style={{ offsetPath: "path('M0,10 H120')" }} />}
                </svg>
              )}
            </div>
          ))}
        </div>
      </section>
      <div class="ms-grid">
        <section class="ms-panel span-2" aria-labelledby="triage-title" data-anchor="ms-triage-table">
          <header><h2 id="triage-title">rejection triage</h2><span class="ms-muted">38 invoices · 12 skus</span></header>
          <p class="ms-root" data-anchor="ms-root-cause"><b>root cause:</b> since 14:10 the tax authority rejects code 778 (invalid NCM). twelve linen and knit skus still carry NCM codes retired on sep 1; every shipment invoice containing them fails, which blocks the transport document.</p>
          <table class="ms-table">
            <thead><tr><th><span class="visually-hidden">apply</span></th><th>sku</th><th>product</th><th>current ncm</th><th>proposed</th><th>confidence</th></tr></thead>
            <tbody>
              {fixes.map(([sku, name, from, to, confidence]) => (
                <tr key={sku}>
                  <td><input type="checkbox" aria-label={`Apply fix to ${sku}`} checked={checked.includes(sku)} onChange={() => setChecked(checked.includes(sku) ? checked.filter((item) => item !== sku) : [...checked, sku])} /></td>
                  <td>{sku}</td><td>{name}</td><td class="bad">{from}</td><td class="ok">{to}</td><td>{confidence.toFixed(2)}</td>
                </tr>
              ))}
              <tr class="ms-more"><td /><td colSpan={5}>+ 6 more skus with the same retired codes</td></tr>
            </tbody>
          </table>
          <div class="ms-triage-actions"><span class="ms-muted">{checked.length + 6} skus selected · catalog change goes through product hub audit</span><button type="button" class="ms-btn primary" disabled={sent || !checked.length} onClick={() => setSent(true)}>fix 12 skus and resend 38</button></div>
        </section>
        <div class="ms-side">
          <AiSurface title="retrieved context" meta="rag · top 3" anchor="ms-context"
            sources={[{ label: 'ncm table update · sep 1', score: 0.95 }, { label: 'rejection 778 guide', score: 0.92 }, { label: 'catalog: 100% linen', score: 0.88 }]}>
            the sep 1 table split woven linen shirts into their own subheading; material attributes in product hub confirm each proposed code.
          </AiSurface>
          <section class="ms-panel" data-anchor="ms-why-matters">
            <header><h2>why this matters</h2></header>
            <p class="ms-muted">38 orders can't ship until the transport document exists. after 17:00 they miss today's truck, and every hour adds customer contacts. fixing the source data, not each invoice, stops tomorrow's rejections too.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
