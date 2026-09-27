import { AiSurface, Banner, Link, useDemoState } from '@portfolio/remote-runtime';
import { useMemo, useState } from 'preact/hooks';
import { commissionFor, RETURN_WINDOW_DAYS, sampleOrder, summerSwim } from './commission';
import { brl } from './data';

export function RuleBuilder({ id }: { id: string }) {
  const state = useDemoState();
  const [rate, setRate] = useState(10);
  const [conditions, setConditions] = useState(summerSwim.conditions);
  const [saved, setSaved] = useState(false);
  const rule = { ...summerSwim, id, rate: rate / 100, conditions };
  const { lines, total } = useMemo(() => commissionFor(sampleOrder, [rule]), [rate, conditions]);
  const labels: Record<string, string> = { collection: 'Collection', channel: 'Channel', seller: 'Seller' };

  return (
    <main class="cc-main">
      <Link class="cc-back" href="/mare/ops/circle">← Program</Link>
      <header class="cc-rule-head">
        <h1>Rule builder · Swim</h1>
        <span class="cc-sticker" aria-hidden="true">priority 20</span>
      </header>
      {saved && <Banner tone="success" icon="✓" title="Rule published · applies to orders from Sep 23">Receipts already issued keep their original rates; the change is versioned in the rule history.</Banner>}
      {state === 'locked' && <Banner tone="info" icon="i" title="Payout week · rules are frozen until Friday 18:00" />}
      <div class="cc-rule-grid">
        <section class="cc-builder" aria-labelledby="rule-title">
          <h2 id="rule-title" class="visually-hidden">Rule</h2>
          <div class="cc-block" data-anchor="cc-when">
            <span class="cc-block-label">When</span>
            <div class="cc-chips">
              {conditions.map((condition, index) => (
                <span key={condition.field} class="cc-chip" style={{ '--i': index }}>
                  <b>{labels[condition.field]}</b> {condition.op} <em>{condition.values.join(' or ')}</em>
                  <button type="button" aria-label={`Remove ${labels[condition.field]} condition`} onClick={() => setConditions(conditions.filter((_, position) => position !== index))}>×</button>
                </span>
              ))}
              <button type="button" class="cc-add" onClick={() => setConditions(summerSwim.conditions)}>+ Add condition</button>
            </div>
          </div>
          <div class="cc-block then" data-anchor="cc-then">
            <span class="cc-block-label">Then pay</span>
            <label class="cc-rate"><span class="visually-hidden">Commission rate</span><input type="number" min={0} max={30} value={rate} onInput={(event) => setRate(Math.max(0, Math.min(30, Number(event.currentTarget.value) || 0)))} /><b>%</b></label>
            <span class="cc-dates">from <b>Sep 23</b> to <b>Dec 31</b></span>
          </div>
          <p class="cc-priority" data-anchor="cc-priority"><b>Why priority 20?</b> It beats the program default (6%) and the Linen rule (8%, priority 10), but a creator-specific deal (priority 30) still wins. Only one rule pays per item.</p>
          <AiSurface inline title="Impact estimate" meta="last 90 days · 0.84" anchor="cc-impact" sources={[{ label: 'attributed orders · 90d', score: 0.9 }, { label: 'swim sell-through', score: 0.82 }]}>
            41 creators are eligible. Expect about +R$38k attributed swim sales a month for R$3.8k extra commission.
          </AiSurface>
          <div class="cc-actions">
            <button type="button" class="cc-btn">Save draft</button>
            <button type="button" class="cc-btn primary" disabled={state === 'locked'} onClick={() => setSaved(true)}>Publish rule</button>
          </div>
        </section>

        <aside class="cc-receipt" aria-labelledby="receipt-title" data-anchor="cc-receipt">
          <header><span>Live preview</span><h2 id="receipt-title">Order MR-904088 · NINA10</h2></header>
          <ul>
            {lines.map((line) => (
              <li key={line.name} class={line.returned ? 'returned' : line.rule === 'marketplace' ? 'marketplace' : ''}>
                <div><strong>{line.name}</strong><small>{line.returned ? 'Returned · excluded' : line.rule === 'marketplace' ? 'Marketplace · Casa Ribeira · 0%' : `${line.collection} · ${(line.rate * 100).toFixed(0)}%`}</small></div>
                <span class="cc-price">{brl(line.price)}</span>
                <b>{brl(line.amount)}</b>
              </li>
            ))}
          </ul>
          <footer>
            <div><span>Commission</span><strong>{brl(total)}</strong></div>
            <small>Confirms Oct 26 · {RETURN_WINDOW_DAYS} days after delivery</small>
          </footer>
        </aside>
      </div>
    </main>
  );
}
