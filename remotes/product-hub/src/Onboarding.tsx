import { AiSurface, Link, setParams, useLocation, useSequence } from '@portfolio/remote-runtime';
import { useState } from 'preact/hooks';

const steps = [['company', 'Company'], ['mapping', 'Catalog mapping'], ['logistics', 'Logistics'], ['payouts', 'Payouts'], ['review', 'Review']] as const;

type Mapping = { field: string; sample: string; target: string; confidence: number };

const mappings: Mapping[] = [
  { field: 'cor', sample: 'Areia', target: 'Color → Sand', confidence: 0.97 },
  { field: 'tam', sample: 'M', target: 'Size (BR letter)', confidence: 0.95 },
  { field: 'ncm', sample: '6205.90.00', target: 'Tax code (NCM)', confidence: 0.99 },
  { field: 'tecido', sample: '100% linho', target: 'Material composition', confidence: 0.91 },
  { field: 'cuidado', sample: 'Lavar à mão', target: 'Care instructions', confidence: 0.88 },
  { field: 'categoria', sample: 'Camisas > Manga longa', target: 'Category → Tops › Shirts', confidence: 0.78 },
  { field: 'modelagem', sample: 'Reta', target: 'Fit → Regular', confidence: 0.64 }
];

const AUTO = 0.85;

export function Onboarding({ seller }: { seller: string }) {
  const { params } = useLocation();
  const step = params.get('step') ?? 'mapping';
  const index = steps.findIndex(([key]) => key === step);
  const shown = useSequence(mappings.length, 120);
  const [accepted, setAccepted] = useState<string[]>([]);
  const review = mappings.filter((row) => row.confidence < AUTO);
  const name = seller === 'linho-co' ? 'Linho & Co' : seller;

  return (
    <main class="ph-onboarding">
      <nav class="ph-crumbs" aria-label="Breadcrumb"><Link href="/mare/ops/product-hub">Catalog</Link> / <span>Marketplace</span> / <span>Onboarding</span> / <span aria-current="page">{name}</span></nav>
      <header class="ph-title-row"><h1>Onboard {name}</h1><span class="mono">seller 4127 · 142 SKUs uploaded 15:40</span></header>
      <ol class="ph-stepper" data-anchor="ph-stepper">
        {steps.map(([key, label], position) => (
          <li key={key} class={position < index ? 'done' : position === index ? 'active' : ''}>
            <button type="button" onClick={() => setParams({ step: key })} aria-current={position === index ? 'step' : undefined}>
              <b>{position < index ? '✓' : position + 1}</b>{label}
            </button>
          </li>
        ))}
      </ol>
      <div class="ph-onboard-grid">
        <section class="ph-card" aria-labelledby="map-title">
          {step === 'mapping' ? (
            <>
              <header><h2 id="map-title">Map seller fields to Maré attributes</h2><span class="ai-badge">Simulated AI</span></header>
              <table class="ph-table ph-mapping" data-anchor="ph-mapping">
                <thead><tr><th>Seller field</th><th>Sample</th><th>Maré attribute</th><th>Confidence</th><th>Mode</th></tr></thead>
                <tbody>
                  {mappings.slice(0, shown).map((row) => {
                    const auto = row.confidence >= AUTO || accepted.includes(row.field);
                    return (
                      <tr key={row.field} class={auto ? '' : 'needs-review'}>
                        <td class="mono">{row.field}</td>
                        <td>{row.sample}</td>
                        <td>{row.target}</td>
                        <td><span class="ph-confidence" style={{ '--c': row.confidence }}><i /></span><span class="mono">{row.confidence.toFixed(2)}</span></td>
                        <td>{auto ? <span class="ph-tag ok">{accepted.includes(row.field) ? 'Accepted' : 'Auto'}</span> : <button type="button" class="ph-tag warn as-button" onClick={() => setAccepted([...accepted, row.field])}>Review</button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <footer class="ph-card-foot">
                <span>{review.length - accepted.filter((field) => review.some((row) => row.field === field)).length} mappings need a person · {mappings.length - review.length} applied automatically above {AUTO}</span>
                <button type="button" class="ph-btn primary" onClick={() => setParams({ step: 'logistics' })}>Continue to logistics</button>
              </footer>
            </>
          ) : (
            <div class="ph-step-placeholder">
              <h2 id="map-title">{steps[index]?.[1]}</h2>
              <p>{step === 'company' ? 'CNPJ, legal name and bank details verified on 24 Sep.' : step === 'logistics' ? 'Choose pickup windows and the carriers Linho & Co can hand over to.' : step === 'payouts' ? 'Payout schedule and commission tier for new marketplace sellers.' : 'Everything above, one last time, before the offers go live.'}</p>
              <button type="button" class="ph-btn" onClick={() => setParams({ step: 'mapping' })}>Back to catalog mapping</button>
            </div>
          )}
        </section>
        <aside class="ph-side">
          <section class="ph-card" data-anchor="ph-upload-health">
            <header><h2>Upload health</h2></header>
            <div class="ph-health"><strong>138</strong><span>of 142 SKUs valid</span></div>
            <div class="ph-bar"><i style={{ width: '97%' }} /></div>
            <ul class="ph-issues"><li>4 missing images</li><li>2 sizes outside the BR grid</li></ul>
          </section>
          <AiSurface title="Why a person reviews" meta="threshold 0.85" anchor="ph-why-review" sources={[{ label: 'search facets', score: 0.9 }, { label: 'tax rules · NCM', score: 0.96 }]}>
            Category and fit drive search facets and returns; a wrong guess hides products or misleads customers. Anything under 0.85 waits for you.
          </AiSurface>
          <section class="ph-card" data-anchor="ph-site-preview">
            <header><h2>Site preview</h2></header>
            <div class="ph-preview">
              <span class="swatch" data-swatch="sand" />
              <div><strong>Camisa linho reta</strong><small>Linho & Co · Tops › Shirts</small><b>R$ 239 · 3× sem juros</b></div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
