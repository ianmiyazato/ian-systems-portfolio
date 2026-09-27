import { AiSurface, Banner, Layer, LiveControl, closeLayers, openLayer, useDemoState, useLocation, useWorldEvents } from '@portfolio/remote-runtime';
import { brlCompact } from '@portfolio/mocks';
import { clock } from '@portfolio/world';
import { useState } from 'preact/hooks';
import { agreementQuote } from './agreement';
import { Kpis, brl } from './ui';

type Bucket = { id: string; label: string; accounts: number; amount: number };
const buckets: Bucket[] = [
  { id: 'b30', label: '1–30 days', accounts: 6210, amount: 4_120_000 },
  { id: 'b60', label: '31–60 days', accounts: 1840, amount: 1_930_000 },
  { id: 'b90', label: '61–90 days', accounts: 720, amount: 1_090_000 },
  { id: 'b90p', label: '90+ days', accounts: 1130, amount: 2_610_000 }
];

const strategies = [
  { segment: '1–30 · first miss, good history', channel: 'WhatsApp', next: 'Friendly reminder with a Pix link', promise: '62% kept', best: '12:00–13:00' },
  { segment: '1–30 · missed before', channel: 'SMS + WhatsApp', next: 'Reminder, then a call on day 5', promise: '48% kept', best: '19:00–20:00' },
  { segment: '31–60', channel: 'Call', next: 'Offer a 3–6× agreement', promise: '41% kept', best: '18:30–20:00' },
  { segment: '61–90', channel: 'Call + email', next: 'Agreement with up to 10% off', promise: '33% kept', best: '12:00–13:00' },
  { segment: '90+', channel: 'Collections partner', next: 'Settlement offer · credit bureau notice', promise: '19% kept', best: '—' }
];

type Customer = { id: string; name: string; bucket: string; debt: number; status: 'Promise to pay' | 'Broken promise' | 'No answer' | 'Agreement active'; note: string };
const customers: Customer[] = [
  { id: 'CL-8812', name: 'M•••• D.', bucket: '31–60', debt: 2340.8, status: 'Broken promise', note: 'Promised Sep 25 · nothing received' },
  { id: 'CL-8807', name: 'R•••• M.', bucket: '1–30', debt: 419.9, status: 'Promise to pay', note: 'Pix promised for Sep 30' },
  { id: 'CL-8799', name: 'T•••• R.', bucket: '61–90', debt: 3180, status: 'No answer', note: '3 calls · WhatsApp read, no reply' },
  { id: 'CL-8791', name: 'A•••• S.', bucket: '1–30', debt: 289, status: 'Promise to pay', note: 'Payday Oct 5' },
  { id: 'CL-8786', name: 'G•••• P.', bucket: '31–60', debt: 1210.5, status: 'Agreement active', note: '4× R$318.14 · 1 of 4 paid' },
  { id: 'CL-8779', name: 'B•••• R.', bucket: '1–30', debt: 649.9, status: 'No answer', note: 'Email bounced · update contact' }
];

export function Collections() {
  const state = useDemoState();
  const { params } = useLocation();
  const [recovered, setRecovered] = useState({ count: 184, amount: 96_340 });
  const [last, setLast] = useState<string | null>(null);
  const [agreed, setAgreed] = useState<Record<string, string>>({});

  // Installments paid on Maré Pay count as recoveries; the 1–30 bucket drains as they arrive.
  useWorldEvents(['payments.captured'], (event) => {
    if (event.payload.method !== 'pay-credit' && event.payload.method !== 'pay-store') return;
    setRecovered((current) => ({ count: current.count + 1, amount: current.amount + event.payload.amountCents / 100 / event.payload.installments }));
    setLast(`${clock(Date.parse(event.at), true)} · ${brl(event.payload.amountCents / 100 / event.payload.installments, { cents: true })} installment received`);
  });

  const drained = recovered.count - 184;
  const live = buckets.map((bucket, index) => (index === 0 ? { ...bucket, accounts: bucket.accounts - drained } : bucket));
  const total = live.reduce((sum, bucket) => sum + bucket.amount, 0);
  const selected = customers.find((customer) => customer.id === params.get('customer')) ?? customers[0]!;
  const broken = state === 'promise-broken';

  return (
    <main class="py-main" id="pay-collections">
      <header class="py-page-head" data-anchor="py-collections-head">
        <div>
          <span class="py-eyebrow">Maré Pay · Collections</span>
          <h1>Collections</h1>
          <p>Reach the right customer, on the right channel, with an agreement they can keep. Every contact respects the quiet hours and the consumer-protection rules.</p>
        </div>
        <LiveControl anchor="py-collections-live" />
      </header>
      {broken && (
        <Banner tone="risk" icon="!" title="Promise broken · M•••• D. · R$2,340.80 not received by Sep 25" anchor="py-promise-broken" action={<button type="button" class="py-btn" onClick={() => openLayer({ modal: 'agreement', customer: 'CL-8812' })}>Offer an agreement</button>}>
          Second broken promise in 60 days, so the strategy moves from reminders to a structured agreement. No late fees are added while an offer is open.
        </Banner>
      )}

      <Kpis anchor="py-collections-kpis" items={[
        { label: 'Past due · all buckets', value: total, format: (value) => brlCompact(value), note: `${live.reduce((sum, bucket) => sum + bucket.accounts, 0).toLocaleString('en-US')} accounts` },
        { label: 'Recovered today', value: recovered.amount, format: (value) => brl(Math.round(value)), tone: 'ok', note: last ?? `${recovered.count} payments` },
        { label: 'Promises kept · 30 days', value: 52, format: (value) => `${Math.round(value)}%` },
        { label: 'Roll rate 1–30 → 31–60', value: 18.4, format: (value) => `${value.toFixed(1)}%`, tone: 'warn', note: 'target under 20%' }
      ]} />

      <section class="py-panel" aria-labelledby="buckets-title" data-anchor="py-buckets">
        <header><h2 id="buckets-title">Delinquency buckets</h2><span class="py-muted">share of past-due balance</span></header>
        <div class="py-stack" role="img" aria-label={live.map((bucket) => `${bucket.label}: ${brlCompact(bucket.amount)}`).join(', ')}>
          {live.map((bucket, index) => <i key={bucket.id} class={`seg seg-${index}`} style={{ '--w': bucket.amount / total, '--i': index }} />)}
        </div>
        <dl class="py-stack-legend">
          {live.map((bucket, index) => (
            <div key={bucket.id}><dt><i class={`seg-${index}`} aria-hidden="true" />{bucket.label}</dt><dd>{brlCompact(bucket.amount)}<small>{bucket.accounts.toLocaleString('en-US')} accounts</small></dd></div>
          ))}
        </dl>
      </section>

      <div class="py-grid">
        <section class="py-panel span-2" aria-labelledby="strategy-title" data-anchor="py-strategy">
          <header><h2 id="strategy-title">Contact strategy</h2><span class="py-muted">quiet hours 21:00–08:00 · max 1 contact a day</span></header>
          <table class="py-table wrap">
            <thead><tr><th>Segment</th><th>Channel</th><th>Next action</th><th>Promise to pay</th></tr></thead>
            <tbody>{strategies.map((row) => <tr key={row.segment}><td><b>{row.segment}</b></td><td>{row.channel}</td><td>{row.next}</td><td>{row.promise}</td></tr>)}</tbody>
          </table>
        </section>
        <section class="py-panel" data-anchor="py-contact-ai">
          <AiSurface inline title="Best time and channel per segment" meta="contact model · 0.81" sources={[{ label: 'contact outcomes · 90 days', score: 0.9 }, { label: 'quiet-hours policy', score: 0.97 }]}>
            <ul class="py-best">
              {strategies.slice(0, 4).map((row) => <li key={row.segment}><span>{row.segment.split(' · ')[0]}</span><b>{row.best}</b><small>{row.channel}</small></li>)}
            </ul>
            WhatsApp at lunch doubles replies for first misses; calls work after 18:30 for older debt.
          </AiSurface>
        </section>
      </div>

      <section class="py-panel" aria-labelledby="today-title" data-anchor="py-contact-list">
        <header><h2 id="today-title">To contact today</h2><span class="py-muted">{customers.length} of 214 · ordered by recovery likelihood</span></header>
        <table class="py-table">
          <thead><tr><th>Customer</th><th>Bucket</th><th>Balance</th><th>Status</th><th /></tr></thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} class={customer.status === 'Broken promise' && broken ? 'broken' : ''}>
                <td><b>{customer.name}</b><small class="py-cell-note">{customer.id} · {agreed[customer.id] ?? customer.note}</small></td>
                <td>{customer.bucket}</td>
                <td>{brl(customer.debt, { cents: true })}</td>
                <td><span class={`py-status ${agreed[customer.id] ? 'ok' : customer.status === 'Broken promise' ? 'risk' : customer.status === 'Agreement active' ? 'ok' : 'late'}`}>{agreed[customer.id] ? 'Offer sent' : customer.status}</span></td>
                <td><button type="button" class="py-btn" onClick={() => openLayer({ modal: 'agreement', customer: customer.id })}>Build agreement</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {params.get('modal') === 'agreement' && <AgreementBuilder customer={selected} onSend={(summary) => { setAgreed({ ...agreed, [selected.id]: summary }); closeLayers(['modal', 'customer']); }} />}
    </main>
  );
}

function AgreementBuilder({ customer, onSend }: { customer: Customer; onSend: (summary: string) => void }) {
  const [discount, setDiscount] = useState(customer.bucket === '61–90' ? 10 : 5);
  const [installments, setInstallments] = useState(6);
  const quote = agreementQuote(customer.debt, discount, installments);
  const first = installments === 1 ? 'Oct 5' : 'Oct 5, then monthly';
  const maxDiscount = customer.bucket === '1–30' ? 5 : customer.bucket === '31–60' ? 10 : 20;
  return (
    <Layer kind="modal" title="Agreement builder" eyebrow={`${customer.name} · ${customer.bucket} days · ${brl(customer.debt, { cents: true })}`} onClose={() => closeLayers(['modal', 'customer'])} width={760} anchor="py-agreement"
      footer={<><button type="button" class="py-btn" onClick={() => closeLayers(['modal', 'customer'])}>Cancel</button><button type="button" class="py-btn primary" onClick={() => onSend(`${installments}× ${brl(quote.installment, { cents: true })} offered`)}>Send payment link</button></>}>
      <div class="py-agreement">
        <div class="py-agreement-form">
          <div class="py-limit">
            <label for="py-discount">Discount on the balance <output>{discount}%</output></label>
            <div class="py-slider"><input id="py-discount" type="range" min={0} max={maxDiscount} value={Math.min(discount, maxDiscount)} style={{ '--fill': `${(Math.min(discount, maxDiscount) / maxDiscount) * 100}%` }} onInput={(event) => setDiscount(Number(event.currentTarget.value))} /></div>
            <small class="py-muted">Policy allows up to {maxDiscount}% for {customer.bucket} days.</small>
          </div>
          <fieldset class="py-chips" aria-label="Installments">
            <legend class="py-field">Installments</legend>
            {[1, 3, 6, 10, 12].map((count) => <button type="button" key={count} aria-pressed={installments === count} onClick={() => setInstallments(count)}>{count === 1 ? 'Single' : `${count}×`}</button>)}
          </fieldset>
          <dl class="py-quote" data-anchor="py-agreement-quote">
            <div><dt>Balance after discount</dt><dd>{brl(quote.principal, { cents: true })}</dd></div>
            <div><dt>Each installment</dt><dd class="big">{installments}× {brl(quote.installment, { cents: true })}</dd></div>
            <div><dt>Total paid</dt><dd>{brl(quote.total, { cents: true })}{installments > 1 && <small> · 1.99% a month</small>}</dd></div>
            <div><dt>Customer saves</dt><dd class={quote.savings >= 0 ? 'good' : ''}>{quote.savings >= 0 ? brl(quote.savings, { cents: true }) : `pays ${brl(-quote.savings, { cents: true })} in interest`}</dd></div>
          </dl>
        </div>
        <figure class="py-link-preview" aria-label="Payment link preview" data-anchor="py-payment-link">
          <figcaption>WhatsApp preview</figcaption>
          <div class="py-bubble">
            <p>Hi {customer.name.split(' ')[0]!.replace(/•+/, '')}, this is Maré Pay. We can settle your balance as <b>{installments === 1 ? `one payment of ${brl(quote.installment, { cents: true })}` : `${installments}× ${brl(quote.installment, { cents: true })}`}</b>, first due {first}.</p>
            <span class="py-paylink">pay.mare.example/a/8XK2 · Pix or card</span>
            <small>No late fees while this offer is open · reply STOP to opt out</small>
          </div>
        </figure>
      </div>
    </Layer>
  );
}
