import { AiSurface, Banner, Layer, LiveControl, TraceLink, closeLayers, openLayer, recordAction, setParams, useAnnouncer, useDemoState, useLiveEvents, useLocation, useSimNow } from '@portfolio/remote-runtime';
import { DEFAULT_START, clock, duration, type WorldEvent } from '@portfolio/world';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Kpis, Ring, brl } from './ui';

const DAY = 86_400_000;
type Reason = 'not-received' | 'fraud' | 'duplicate' | 'not-as-described';
type Status = 'evidence' | 'submitted' | 'accepted';
export type Dispute = { id: string; account: string; customer: string; amount: number; reason: Reason; network: string; opened: number; due: number; order: string; merchant: string; live?: boolean };

const reasonLabel: Record<Reason, string> = { 'not-received': 'Item not received', fraud: 'Fraud · card not present', duplicate: 'Duplicate charge', 'not-as-described': 'Not as described' };

/** The queue at 16:18; DP-40218 is the artboard's case (delivered order the customer says never arrived). */
export const disputes: Dispute[] = [
  { id: 'DP-40218', account: '•••• 4471', customer: 'B•••• S.', amount: 689.8, reason: 'not-received', network: 'Maré Pay Credit', opened: DEFAULT_START - 2 * DAY, due: DEFAULT_START + DAY + 4 * 3600_000, order: 'MR-903418', merchant: 'Maré site' },
  { id: 'DP-40211', account: '•••• 2290', customer: 'H•••• C.', amount: 1249.9, reason: 'fraud', network: 'Card network', opened: DEFAULT_START - 5 * DAY, due: DEFAULT_START + 2 * DAY, order: 'MR-902877', merchant: 'Maré app' },
  { id: 'DP-40207', account: '•••• 8813', customer: 'D•••• M.', amount: 359, reason: 'not-as-described', network: 'Maré Pay Store', opened: DEFAULT_START - 3 * DAY, due: DEFAULT_START + 6 * DAY, order: 'MR-903102', merchant: 'Maré Downtown' },
  { id: 'DP-40199', account: '•••• 0917', customer: 'C•••• F.', amount: 219, reason: 'duplicate', network: 'Card network', opened: DEFAULT_START - 6 * DAY, due: DEFAULT_START + 9 * DAY, order: 'MR-902640', merchant: 'Maré site' },
  { id: 'DP-40193', account: '•••• 5530', customer: 'P•••• A.', amount: 2140, reason: 'fraud', network: 'Maré Pay Credit', opened: DEFAULT_START - 8 * DAY, due: DEFAULT_START + 12 * 3600_000, order: 'MR-902311', merchant: 'Marketplace · Casa Ribeira' },
  { id: 'DP-40188', account: '•••• 7702', customer: 'L•••• P.', amount: 489.9, reason: 'not-received', network: 'Maré Pay Store', opened: DEFAULT_START - 9 * DAY, due: DEFAULT_START + 11 * DAY, order: 'MR-901998', merchant: 'Maré app' }
];

const fromWorld = (event: Extract<WorldEvent, { topic: 'dispute.opened' }>): Dispute => {
  const opened = Date.parse(event.at);
  return { id: event.payload.disputeId, account: event.payload.account, customer: 'New claim', amount: event.payload.amountCents / 100, reason: event.payload.reason, network: event.payload.network, opened, due: opened + event.payload.dueDays * DAY, order: '—', merchant: 'Maré site', live: true };
};

type Proof = { id: string; label: string; detail: string; weight: number; source: string };
const proofs: Proof[] = [
  { id: 'pod', label: 'Carrier proof of delivery', detail: 'Rota Sul Express · signed by "B. Silva" · photo at the door · Sep 23 14:12', weight: 0.26, source: 'carrier API · rota-sul' },
  { id: 'address', label: 'Address match', detail: 'Delivery address matches the billing address used for 14 months', weight: 0.14, source: 'order + account' },
  { id: 'device', label: 'Device history', detail: 'Order placed from the customer\'s usual phone, 212 sessions since 2025', weight: 0.12, source: 'device graph' },
  { id: 'chat', label: 'Chat transcript', detail: 'Customer confirmed receipt in support chat on Sep 24, then opened the claim', weight: 0.08, source: 'support · #58210' }
];
const BASE_LIKELIHOOD = 0.22;

export function Disputes() {
  const state = useDemoState();
  const { params } = useLocation();
  const now = useSimNow(1000);
  const { announce, region } = useAnnouncer();
  const live = useLiveEvents(['dispute.opened'], { limit: 4 });
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const queue = useMemo(() => (state === 'empty' ? [] : [...live.items.map(fromWorld), ...disputes]), [live.items, state]);
  const arriving = useMemo(() => new Set(live.items.filter((event) => live.fresh.includes(event.id)).map((event) => event.payload.disputeId)), [live.items, live.fresh]);
  const newest = live.items[0];
  useEffect(() => {
    if (newest && live.fresh.includes(newest.id)) announce(`New dispute ${newest.payload.disputeId}, ${reasonLabel[newest.payload.reason]}`);
  }, [newest?.id]);

  const selected = queue.find((item) => item.id === (params.get('dispute') ?? 'DP-40218')) ?? queue[0];
  const open = queue.filter((item) => (statuses[item.id] ?? 'evidence') === 'evidence');
  const atRisk = open.reduce((sum, item) => sum + item.amount, 34_120);

  return (
    <main class="py-main" id="pay-disputes">
      {region}
      <header class="py-page-head" data-anchor="py-disputes-head">
        <div>
          <span class="py-eyebrow">Maré Pay · Chargebacks and claims</span>
          <h1>Disputes</h1>
          <p>Every claim has a network deadline. The evidence pack is assembled from orders, carriers and devices; a person decides to fight or accept.</p>
        </div>
        <LiveControl anchor="py-disputes-live" />
      </header>
      {state === 'error' && <Banner tone="risk" icon="!" title="Card network portal unreachable · submissions queue" anchor="py-disputes-error">Evidence is saved and submitted automatically when the portal returns, well before any deadline in the next 12 h.</Banner>}

      <Kpis anchor="py-disputes-kpis" items={[
        { label: 'Open disputes', value: state === 'empty' ? 0 : 36 + open.length, note: `${open.filter((item) => item.due - now < 3 * DAY).length} due in 72 h` },
        { label: 'Win rate · 90 days', value: 64, format: (value) => `${Math.round(value)}%`, tone: 'ok', note: 'up from 51% before evidence packs' },
        { label: 'Auto-resolved', value: 31, format: (value) => `${Math.round(value)}%`, note: 'duplicates refunded without a person' },
        { label: 'Amount at risk', value: state === 'empty' ? 0 : atRisk, format: (value) => brl(Math.round(value)), tone: 'warn', note: 'open claims, before recoveries' }
      ]} />

      <div class="py-disputes">
        <section class="py-panel" aria-labelledby="dq-title" data-anchor="py-dispute-queue">
          <header><h2 id="dq-title">Queue</h2><span class="py-muted">amber = network deadline in under 72 h</span></header>
          {state === 'empty' ? (
            <div class="py-empty" data-anchor="py-disputes-empty"><strong>No open disputes</strong><p>New claims appear here the moment the network sends them, with the evidence pack already started.</p></div>
          ) : (
            <table class="py-table wrap py-dispute-table">
              <thead><tr><th>Dispute</th><th>Reason</th><th>Amount</th><th>Due</th></tr></thead>
              <tbody>
                {queue.map((item) => {
                  const left = item.due - now;
                  const status = statuses[item.id] ?? 'evidence';
                  return (
                    <tr key={item.id} class={`${left < 3 * DAY && status === 'evidence' ? 'due-soon' : ''} ${item.id === selected?.id ? 'selected' : ''} ${arriving.has(item.id) ? 'is-arriving' : ''}`}>
                      <td><button type="button" class="py-row-link" aria-pressed={item.id === selected?.id} onClick={() => setParams({ dispute: item.id })}><b>{item.id}{status !== 'evidence' && <span class={`py-status ${status === 'submitted' ? 'ok' : 'frozen'}`}>{status === 'submitted' ? 'Submitted' : 'Loss accepted'}</span>}</b><small>{item.customer} · {item.network}</small></button></td>
                      <td class="py-wrap">{reasonLabel[item.reason]}</td>
                      <td>{brl(item.amount, { cents: true })}</td>
                      <td class="py-due">{status !== 'evidence' ? '—' : left <= 0 ? 'overdue' : left < DAY ? duration(left) : `${Math.floor(left / DAY)} d ${Math.floor((left % DAY) / 3600_000)} h`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {selected && <DisputeCase key={selected.id} dispute={selected} now={now} status={statuses[selected.id] ?? 'evidence'} onStatus={(status) => setStatuses({ ...statuses, [selected.id]: status })} />}
      </div>
    </main>
  );
}

function DisputeCase({ dispute, now, status, onStatus }: { dispute: Dispute; now: number; status: Status; onStatus: (status: Status) => void }) {
  const { params } = useLocation();
  const [trace, setTrace] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>(dispute.reason === 'not-received' ? ['pod', 'address', 'device'] : ['device']);
  const likelihood = Math.min(0.95, BASE_LIKELIHOOD + proofs.filter((proof) => checked.includes(proof.id)).reduce((sum, proof) => sum + proof.weight, 0));
  const steps = [
    { label: 'Claim', when: now - dispute.opened < 3600_000 ? `today ${clock(dispute.opened)}` : new Date(dispute.opened).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Sao_Paulo' }), state: 'done' },
    { label: 'Evidence', when: status === 'evidence' ? `due in ${duration(dispute.due - now)}` : 'packed', state: status === 'evidence' ? 'now' : 'done' },
    { label: 'Submit', when: status === 'submitted' ? `today ${clock(now)}` : status === 'accepted' ? 'skipped' : '—', state: status === 'submitted' ? 'done' : 'todo' },
    { label: 'Decision', when: status === 'accepted' ? 'refunded' : '~30 days', state: status === 'accepted' ? 'done' : 'todo' }
  ];
  const toggle = (id: string) => setChecked(checked.includes(id) ? checked.filter((item) => item !== id) : [...checked, id]);
  const submit = () => {
    setTrace(recordAction('pay', 'submit dispute evidence', `${dispute.id} · ${checked.length} proofs`, 'Rui'));
    onStatus('submitted');
    closeLayers(['modal']);
  };

  return (
    <section class="py-panel py-case" aria-labelledby="case-title" data-anchor="py-dispute-case">
      <header class="py-case-head">
        <div>
          <span class="py-eyebrow">{dispute.network} · {dispute.account}</span>
          <h2 id="case-title">{dispute.id} · {reasonLabel[dispute.reason]}</h2>
          <p class="py-muted">{brl(dispute.amount, { cents: true })} · order {dispute.order} · {dispute.merchant}</p>
        </div>
        <Ring value={likelihood} label="Win likelihood" display={`${Math.round(likelihood * 100)}%`} tone={likelihood >= 0.6 ? 'ok' : likelihood >= 0.4 ? 'gold' : 'risk'} />
      </header>

      <ol class="py-network" data-anchor="py-dispute-timeline" aria-label="Network timeline">
        {steps.map((step) => <li key={step.label} class={step.state}><i aria-hidden="true" /><b>{step.label}</b><small>{step.when}</small></li>)}
      </ol>

      {status === 'submitted' && <Banner tone="success" icon="✓" title="Evidence submitted to the network" anchor="py-dispute-submitted" action={trace ? <TraceLink href={trace} /> : undefined}>4-page representment with {checked.length} proofs. The network decides in about 30 days; the customer keeps the provisional credit until then.</Banner>}
      {status === 'accepted' && <Banner tone="info" icon="i" title="Loss accepted · customer refunded" anchor="py-dispute-accepted">The claim is closed as a write-off and fed back to the fraud model as a label.</Banner>}

      <AiSurface title="Evidence pack" meta={`${checked.length} of ${proofs.length} proofs · assembled 16:02`} anchor="py-evidence-pack"
        sources={proofs.filter((proof) => checked.includes(proof.id)).map((proof) => ({ label: proof.source, score: 0.8 + proof.weight / 2 }))}
        actions={status === 'evidence' ? <><button type="button" class="ai-approve" disabled={!checked.length} onClick={() => openLayer({ modal: 'submit-evidence' })}>Submit evidence</button><button type="button" class="ai-explain" onClick={() => onStatus('accepted')}>Accept loss</button></> : undefined}>
        <ul class="py-proofs">
          {proofs.map((proof) => (
            <li key={proof.id}>
              <label>
                <input type="checkbox" checked={checked.includes(proof.id)} disabled={status !== 'evidence'} onChange={() => toggle(proof.id)} />
                <span><b>{proof.label}</b><small>{proof.detail}</small></span>
                <em>+{Math.round(proof.weight * 100)} pts</em>
              </label>
            </li>
          ))}
        </ul>
      </AiSurface>

      {params.get('modal') === 'submit-evidence' && (
        <Layer kind="modal" title="Submit evidence" eyebrow={`${dispute.id} · ${dispute.network}`} onClose={() => closeLayers(['modal'])} width={620} anchor="py-submit-evidence"
          footer={<><button type="button" class="py-btn" onClick={() => closeLayers(['modal'])}>Keep editing</button><button type="button" class="py-btn primary" onClick={submit}>Submit to the network</button></>}>
          <article class="py-letter">
            <header><b>Representment · {dispute.id}</b><span class="py-muted">{Math.round(likelihood * 100)}% estimated win likelihood</span></header>
            <p>We contest this claim ({reasonLabel[dispute.reason].toLowerCase()}) for {brl(dispute.amount, { cents: true })}. The attached evidence shows:</p>
            <ol>{proofs.filter((proof) => checked.includes(proof.id)).map((proof) => <li key={proof.id}><b>{proof.label}.</b> {proof.detail}.</li>)}</ol>
            <p class="py-muted">Drafted by Simulated AI from the sources above; reviewed and sent by you. The letter and your name go to the audit log.</p>
          </article>
        </Layer>
      )}
    </section>
  );
}
