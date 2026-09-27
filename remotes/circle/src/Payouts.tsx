import { AiSurface, Banner, Layer, LiveControl, Tween, closeLayers, openLayer, useDemoState, useLiveEvents, useLocation, useSimNow } from '@portfolio/remote-runtime';
import { brl, brlCents, brlCompact } from '@portfolio/mocks';
import { DEFAULT_START, clock, duration } from '@portfolio/world';
import { useMemo, useState } from 'preact/hooks';
import { COMMISSION_RATE, roster } from './roster';

const DAY = 86_400_000;
/** Payout goes out Friday Oct 2 at 09:00; the batch locks Thursday Oct 1 at 18:00 (Maré time). */
const lockAt = DEFAULT_START + 5 * DAY + (18 * 60 - (16 * 60 + 18)) * 60_000;

type Row = { code: string; name: string; initials: string; hue: number; earned: number; reversed: number; status: 'Ready' | 'Held · Pix key changed' | 'Held · contract pending'; note?: string };

const baseRows: Row[] = roster.slice(0, 8).map((creator, index) => ({
  code: creator.code,
  name: creator.name,
  initials: creator.initials,
  hue: creator.hue,
  earned: Math.round(creator.revenue * COMMISSION_RATE * 0.38),
  reversed: [38, 0, 134, 21, 0, 58, 0, 44][index]!,
  status: creator.code === 'TOMAS8' ? 'Held · Pix key changed' : creator.contract === 'Pending' ? 'Held · contract pending' : 'Ready'
}));

/** Net commission for the 301 creators outside the top-8 table. */
const OTHERS = 176_000;
const CONFIRMED = 205_100;

const flowFor = (payout: number, creators: number) => [
  { label: 'Coded sales', value: 3_124_000, note: 'orders with a creator code · Sep' },
  { label: 'In the 30-day window', value: 1_842_000, note: 'not confirmed yet · returns still possible' },
  { label: 'Confirmed commission', value: CONFIRMED, note: 'window closed, not returned' },
  { label: 'Tax, fees and holds', value: payout - CONFIRMED, note: 'withholding, Pix fees, held creators' },
  { label: 'This payout', value: payout, note: `${creators} creators` }
];

export function Payouts() {
  const state = useDemoState();
  const { params } = useLocation();
  const now = useSimNow(1000);
  const reversals = useLiveEvents(['commission.reversed'], { limit: 20 });
  const [approved, setApproved] = useState(false);
  const [held, setHeld] = useState<string[]>([]);

  // Reversals recorded anywhere (a Counter refund, a leak) reduce this payout before it locks.
  const rows = useMemo(() => baseRows.map((row) => {
    const live = reversals.items.filter((event) => event.payload.code === row.code);
    return { ...row, reversed: row.reversed + live.reduce((sum, event) => sum + event.payload.amountCents / 100, 0), note: live[0] ? `${brlCents(live[0].payload.amountCents)} · order ${live[0].payload.orderId} returned ${clock(Date.parse(live[0].at))}` : undefined, fresh: live.some((event) => reversals.fresh.includes(event.id)) };
  }), [reversals.items, reversals.fresh]);
  const payable = rows.filter((row) => row.status === 'Ready' && !held.includes(row.code));
  const total = payable.reduce((sum, row) => sum + row.earned - row.reversed, 0);
  const reversedTotal = rows.reduce((sum, row) => sum + row.reversed, 0);
  const payout = Math.round(OTHERS + total);
  const creators = payable.length + 301;
  const flow = flowFor(payout, creators);
  const lockIn = lockAt - now;
  const failed = state === 'payout-failed';

  const checks = [
    { label: 'Contracts signed', detail: `${roster.filter((creator) => creator.contract === 'Signed').length + 297} of 310 · unsigned are held`, ok: true },
    { label: 'Pix keys verified', detail: '1 key changed in the last 48 h · held for review', ok: held.includes('TOMAS8') || !rows.some((row) => row.status.startsWith('Held · Pix')) },
    { label: 'Reversals applied', detail: `${brl(Math.round(reversedTotal))} from returns inside the window`, ok: true },
    { label: 'Tax withheld', detail: 'withholding calculated per creator', ok: true }
  ];

  return (
    <main class="cc-main" id="circle-payouts">
      <header class="cc-page-head" data-anchor="cc-payouts-head">
        <div>
          <h1>Payouts</h1>
          <p>Friday, Oct 2 · 09:00 by Pix · the batch locks Thursday 18:00 {lockIn > 0 ? <b class="cc-lock">in {duration(lockIn)}</b> : <b class="cc-lock locked">locked</b>}</p>
        </div>
        <LiveControl anchor="cc-payouts-live" />
      </header>
      {failed && <Banner tone="risk" icon="!" title="Payout failed · Joao Martins · R$6,700" anchor="cc-payouts-failed" action={<button type="button" class="cc-btn primary">Retry payout</button>}>The bank rejected the Pix key. Retrying uses the same idempotency key, so he can't be paid twice.</Banner>}
      {approved && <Banner tone="success" icon="✓" title={`Payout approved · ${creators} creators · ${brlCompact(payout)}`} anchor="cc-payout-approved">Sends Friday 09:00. Held creators are paid in the next batch once cleared.</Banner>}

      <ol class="cc-flow" data-anchor="cc-money-flow" aria-label="Money flow">
        {flow.map((step, index) => (
          <li key={step.label} style={{ '--i': index }} class={index === flow.length - 1 ? 'final' : step.value < 0 ? 'minus' : ''}>
            <span>{step.label}</span>
            <strong><Tween value={step.value} format={(value) => (value < 0 ? `−${brlCompact(-value)}` : brlCompact(value))} /></strong>
            <small>{step.note}</small>
          </li>
        ))}
      </ol>

      <div class="cc-payout-grid">
        <section class="cc-payout-table" aria-labelledby="payout-title" data-anchor="cc-payout-table">
          <header><h2 id="payout-title">Creators in this payout</h2><span>top 8 of 309 · reversals update live</span></header>
          <table>
            <thead><tr><th>Creator</th><th>Earned</th><th>Reversed</th><th>To pay</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const isHeld = held.includes(row.code) || row.status !== 'Ready';
                return (
                  <tr key={row.code} class={`${row.fresh ? 'is-arriving' : ''} ${isHeld ? 'held' : ''}`}>
                    <td><span class="cc-avatar small" style={{ '--hue': row.hue }}>{row.initials}</span><b>{row.name}</b><small>{row.code}{row.note ? ` · ${row.note}` : ''}</small></td>
                    <td>{brl(row.earned)}</td>
                    <td class={row.reversed ? 'minus' : ''}>{row.reversed ? `−${brl(row.reversed, { cents: !Number.isInteger(row.reversed) })}` : '—'}</td>
                    <td><b>{brl(Math.max(0, row.earned - row.reversed), { cents: !Number.isInteger(row.reversed) })}</b></td>
                    <td><span class={`cc-status ${isHeld ? 'held' : 'ready'}`}>{held.includes(row.code) && row.status === 'Ready' ? 'Held by you' : row.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <div class="cc-payout-side">
          <section class="cc-checklist" aria-labelledby="checks-title" data-anchor="cc-preapproval">
            <h2 id="checks-title">Before approving</h2>
            <ul>{checks.map((check) => <li key={check.label} class={check.ok ? 'ok' : 'warn'}><span aria-hidden="true">{check.ok ? '✓' : '!'}</span><div><b>{check.label}</b><small>{check.detail}</small></div></li>)}</ul>
          </section>
          <AiSurface title="Payout review · 2 things to check" meta="payout model · 0.9" anchor="cc-payout-ai" className="cc-ai"
            sources={[{ label: 'Pix key changes · 48 h', score: 0.97 }, { label: 'reversal rate by creator', score: 0.88 }]}
            actions={<button type="button" class="ai-approve" disabled={held.includes('TOMAS8')} onClick={() => setHeld([...held, 'TOMAS8'])}>{held.includes('TOMAS8') ? 'Tomas held' : 'Hold Tomas until he confirms'}</button>}>
            <ul class="cc-anomalies">
              <li><b>Tomas Reis</b> changed his Pix key 2 days ago from a new device. Hold until he confirms in the app.</li>
              <li><b>Mariana Luz</b> has R$134 in reversals (18% of earnings), mostly MARI15 leak orders already reversed. No action needed.</li>
            </ul>
          </AiSurface>
          <button type="button" class="cc-btn primary wide cc-approve" disabled={approved || !checks.every((check) => check.ok)} onClick={() => openLayer({ modal: 'approve-payout' })} data-anchor="cc-approve-payout">
            {approved ? 'Approved' : `Approve payout · ${brlCompact(payout)}`}
          </button>
          {!checks.every((check) => check.ok) && <p class="cc-note">Resolve the held Pix key first: hold Tomas or confirm the new key.</p>}
        </div>
      </div>

      {params.get('modal') === 'approve-payout' && <ApprovePayout total={payout} creators={creators} onApprove={() => { setApproved(true); closeLayers(['modal']); }} />}
    </main>
  );
}

function ApprovePayout({ total, creators, onApprove }: { total: number; creators: number; onApprove: () => void }) {
  const [code, setCode] = useState('');
  return (
    <Layer kind="modal" title="Approve this payout?" eyebrow="Friday Oct 2 · 09:00 · Pix" onClose={() => closeLayers(['modal'])} width={480} anchor="cc-approve-modal"
      footer={<button type="button" class="cc-btn primary wide" disabled={code.length < 6} onClick={onApprove}>Approve {brlCompact(total)}</button>}>
      <div class="cc-swap"><span>{creators} creators</span><b>{brlCompact(total)}</b></div>
      <label class="cc-field">6-digit code from your authenticator<input inputMode="numeric" maxLength={6} value={code} data-autofocus onInput={(event) => setCode(event.currentTarget.value.replace(/\D/g, '').slice(0, 6))} /></label>
      <p class="cc-note">Payouts are idempotent per creator and week: approving twice, or a retry after a timeout, can never pay anyone twice.</p>
    </Layer>
  );
}
