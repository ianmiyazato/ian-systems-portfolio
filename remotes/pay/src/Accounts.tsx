import { AiSurface, Banner, Layer, LiveControl, closeLayers, getWorld, openLayer, useDemoState, useLocation, useWorldEvents } from '@portfolio/remote-runtime';
import { brlCompact } from '@portfolio/mocks';
import { clock } from '@portfolio/world';
import { useMemo, useState } from 'preact/hooks';
import { accountById, accountForAuth, accounts, brl, Kpis, maskName, type Account } from './ui';

type Filter = 'all' | 'high' | 'past-due' | 'frozen';
type Activity = { at: number; merchant: string; amount: number; action: string };

/** Policy v7 limit bands by score (the same table the Policies view renders). */
export const bandMax = (score: number) => (score >= 700 ? 12000 : score >= 620 ? 6000 : score >= 560 ? 4000 : 0);

export function Accounts() {
  const state = useDemoState();
  const { params } = useLocation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  // Seed last activity from the world's recent authorizations, then keep it live.
  const [activity, setActivity] = useState<Record<string, Activity>>(() => {
    const seeded: Record<string, Activity> = {};
    for (const event of getWorld().recent(['auth.scored'], 80)) seeded[accountForAuth(event.payload.authId).id] = { at: Date.parse(event.at), merchant: event.payload.merchant, amount: event.payload.amountCents / 100, action: event.payload.action };
    return seeded;
  });
  const [fresh, setFresh] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Partial<Account>>>({});

  // Every scored authorization lands on an account row: last activity updates and the row flashes.
  useWorldEvents(['auth.scored'], (event) => {
    const account = accountForAuth(event.payload.authId);
    setActivity((current) => ({ ...current, [account.id]: { at: Date.parse(event.at), merchant: event.payload.merchant, amount: event.payload.amountCents / 100, action: event.payload.action } }));
    setFresh(account.id);
  });

  const rows = useMemo(() => accounts.map((account) => ({ ...account, ...overrides[account.id] })), [overrides]);
  const visible = rows.filter((account) => {
    const text = `${account.name} ${account.id} ${account.last4}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (filter === 'high') return account.used / account.limit >= 0.8;
    if (filter === 'past-due') return account.status === '30+ past due';
    if (filter === 'frozen') return account.status === 'Frozen';
    return true;
  });
  // ?state=frozen is the designed variation: the frozen account's drawer, open.
  const drawerId = state === 'frozen' ? 'AC-50420' : params.get('drawer') === 'account' ? params.get('account') : null;
  const selected = drawerId ? rows.find((account) => account.id === drawerId) ?? accountById(drawerId) : undefined;
  const update = (id: string, patch: Partial<Account>) => setOverrides((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  const frozenCount = rows.filter((account) => account.status === 'Frozen').length;

  return (
    <main class="py-main" id="pay-accounts">
      <header class="py-page-head" data-anchor="py-accounts-head">
        <div>
          <span class="py-eyebrow">Maré Pay · Customer accounts</span>
          <h1>Accounts</h1>
          <p>Every Maré Pay Credit and Maré Pay Store account, with live card activity from the authorization stream.</p>
        </div>
        <LiveControl anchor="py-accounts-live" />
      </header>
      {state === 'error' && <Banner tone="risk" icon="!" title="Ledger read replica lagging · balances may be 2 min old" anchor="py-accounts-error">Freezes and limit changes go to the primary and apply immediately.</Banner>}

      <Kpis anchor="py-accounts-kpis" items={[
        { label: 'Active accounts', value: 184_210, note: '+312 this week' },
        { label: 'Credit in use', value: 62_400_000, format: (value) => brlCompact(value), note: 'of R$148.9M in limits' },
        { label: 'Average utilization', value: 41, format: (value) => `${Math.round(value)}%`, note: 'healthy below 60%' },
        { label: 'Frozen · 24 h', value: 16 + frozenCount, tone: 'warn', note: '11 by fraud rules, rest by staff' }
      ]} />

      <section class="py-panel" aria-labelledby="accounts-title" data-anchor="py-accounts-table">
        <header>
          <h2 id="accounts-title">Accounts</h2>
          <div class="py-toolbar">
            <label class="py-search"><span class="visually-hidden">Search accounts</span><input value={query} placeholder="Name, account or last 4…" onInput={(event) => setQuery(event.currentTarget.value)} /></label>
            <div class="py-chips" role="group" aria-label="Filter accounts">
              {([['all', 'All'], ['high', 'Utilization ≥ 80%'], ['past-due', 'Past due'], ['frozen', 'Frozen']] as Array<[Filter, string]>).map(([id, label]) => (
                <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
              ))}
            </div>
          </div>
        </header>
        <table class="py-table py-accounts">
          <thead><tr><th>Account</th><th>Cards</th><th>Limit</th><th>Utilization</th><th>Status</th><th>Last activity</th></tr></thead>
          <tbody>
            {state === 'loading' && [0, 1, 2, 3, 4, 5].map((key) => <tr key={key} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((cell) => <td key={cell}><i class="skeleton py-sk" /></td>)}</tr>)}
            {state !== 'loading' && visible.map((account) => {
              const ratio = account.used / account.limit;
              const last = activity[account.id];
              return (
                <tr key={account.id} class={`${fresh === account.id ? 'is-arriving' : ''} ${selected?.id === account.id ? 'selected' : ''}`}>
                  <td><button type="button" class="py-row-link" onClick={() => openLayer({ drawer: 'account', account: account.id })}><b>{maskName(account.name)}</b><small>{account.id} · •••• {account.last4}</small></button></td>
                  <td>{account.products.map((product) => <span key={product} class={`py-product ${product.toLowerCase()}`}>{product}</span>)}</td>
                  <td>{brl(account.limit)}</td>
                  <td><span class="py-util" style={{ '--u': Math.min(ratio, 1) }}><i /></span><small class={ratio >= 0.8 ? 'py-warn-text' : 'py-muted'}>{Math.round(ratio * 100)}%</small></td>
                  <td><span class={`py-status ${account.status === 'Frozen' ? 'frozen' : account.status === 'Current' ? 'ok' : 'late'}`}>{account.status}</span></td>
                  <td class="py-muted">{last ? `${clock(last.at, true)} · ${brl(last.amount, { cents: true })} · ${last.action}` : 'no card activity today'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {state === 'empty' || (state !== 'loading' && !visible.length) ? <div class="py-empty"><strong>No accounts match</strong><p>Try the last four digits on the card, or clear the filter.</p></div> : null}
      </section>

      {selected && <AccountDrawer account={selected} activity={activity[selected.id]} onChange={(patch) => update(selected.id, patch)} />}
    </main>
  );
}

function AccountDrawer({ account, activity, onChange }: { account: Account; activity?: Activity; onChange: (patch: Partial<Account>) => void }) {
  const { params } = useLocation();
  const [notice, setNotice] = useState<string | null>(null);
  const close = () => closeLayers(['drawer', 'account', 'sub']);
  const frozen = account.status === 'Frozen';
  const ratio = account.used / account.limit;
  const y = (value: number) => (80 - (value / account.limit) * 70).toFixed(1);
  const history = [account.limit * 0.4, account.limit * 0.4, account.limit * 0.6, account.limit * 0.6, account.limit * 0.8, account.limit].map(Math.round);
  const statement = [
    ...(activity ? [{ date: `Today ${clock(activity.at)}`, text: activity.merchant, amount: activity.amount, live: true }] : []),
    { date: 'Sep 25', text: 'Maré site · Linen midi dress', amount: 319, live: false },
    { date: 'Sep 22', text: 'Maré Vila Nova Mall', amount: 189.9, live: false },
    { date: 'Sep 18', text: 'Payment received · Pix', amount: -420, live: false },
    { date: 'Sep 12', text: 'Marketplace · Linho & Co', amount: 259, live: false }
  ];

  return (
    <>
      <Layer kind="drawer" title={maskName(account.name)} eyebrow={`${account.id} · ${account.products.join(' + ')} · customer since ${account.since}`} onClose={close} width={560} anchor="py-account-drawer"
        footer={
          <>
            {frozen
              ? <button type="button" class="py-btn" onClick={() => { onChange({ status: 'Current' }); setNotice('Unfrozen · reason recorded · customer notified in the app'); }}>Unfreeze</button>
              : <button type="button" class="py-btn" onClick={() => { onChange({ status: 'Frozen' }); setNotice('Frozen · new authorizations are declined; installments keep running'); }}>Freeze</button>}
            <button type="button" class="py-btn primary" disabled={frozen} onClick={() => openLayer({ sub: 'raise-limit' })}>Raise limit</button>
          </>
        }>
        {frozen && <Banner tone="warn" icon="❄" title="Frozen 16:02 · suspected account takeover" anchor="py-frozen">Three failed step-up challenges from a new device. The customer was notified; unfreezing needs a reason and is audited.</Banner>}
        {notice && <Banner tone="success" icon="✓" title={notice} />}
        <section class="py-limit-card" data-anchor="py-account-limit">
          <div><span>Available</span><strong>{brl(account.limit - account.used)}</strong><small>of {brl(account.limit)} · score {account.score}</small></div>
          <span class="py-util big" style={{ '--u': Math.min(ratio, 1) }}><i /></span>
        </section>
        <section class="py-drawer-section">
          <h3>Statement</h3>
          <ul class="py-statement">
            {statement.map((line) => (
              <li key={line.date + line.text} class={line.live ? 'is-arriving' : ''}><time>{line.date}</time><span>{line.text}</span><b class={line.amount < 0 ? 'credit' : ''}>{line.amount < 0 ? `−${brl(-line.amount, { cents: true })}` : brl(line.amount, { cents: true })}</b></li>
            ))}
          </ul>
        </section>
        <section class="py-drawer-section">
          <h3>Installments</h3>
          <ul class="py-installments">
            <li><span>Linen midi dress · 3× R$106.33</span><i style={{ '--p': 1 / 3 }} /><small>1 of 3 paid · next Oct 12</small></li>
            <li><span>Leather everyday sneakers · 6× R$59.83</span><i style={{ '--p': 4 / 6 }} /><small>4 of 6 paid · next Oct 5</small></li>
          </ul>
        </section>
        <section class="py-drawer-section">
          <h3>Limit history</h3>
          <svg class="py-steps" viewBox="0 0 300 80" role="img" aria-label={`Limit raised from ${brl(history[0]!)} to ${brl(account.limit)} over 18 months`}>
            <path d={`M0,${y(history[0]!)} ${history.slice(1).map((value, index) => `H${(index + 1) * 60} V${y(value)}`).join(' ')} H300`} />
          </svg>
          <p class="py-muted">Raised 3× in 18 months, each after 6 on-time statements.</p>
        </section>
      </Layer>
      {params.get('sub') === 'raise-limit' && <RaiseLimit account={account} onDone={(limit) => { onChange({ limit }); setNotice(`Limit raised to ${brl(limit)} · effective now · customer notified`); closeLayers(['sub']); }} />}
    </>
  );
}

function RaiseLimit({ account, onDone }: { account: Account; onDone: (limit: number) => void }) {
  const max = bandMax(account.score);
  const [limit, setLimit] = useState(Math.min(account.limit + 2000, 16000));
  const [reason, setReason] = useState('');
  const aboveBand = limit > max;
  const checks = [
    { label: 'No payment 30+ days late in 12 months', ok: account.status !== '30+ past due' },
    { label: 'Utilization below 90%', ok: account.used / account.limit < 0.9 },
    { label: `Within policy v7 band for score ${account.score} (max ${brl(max)})`, ok: !aboveBand },
    { label: 'Income verified in the last 6 months', ok: account.score >= 600 }
  ];
  const fill = ((limit - account.limit) / (16000 - account.limit)) * 100;
  return (
    <Layer kind="sub" level={2} title="Raise credit limit" eyebrow={`Policy v7 · score ${account.score}`} onClose={() => closeLayers(['sub'])} width={520} anchor="py-raise-limit"
      footer={<button type="button" class="py-btn primary wide" disabled={aboveBand && reason.trim().length < 12} onClick={() => onDone(limit)}>{aboveBand ? 'Send for second approval' : `Raise to ${brl(limit)}`}</button>}>
      <div class="py-limit">
        <label for="py-new-limit">New limit <output>{brl(limit)}</output></label>
        <div class="py-slider">
          <input id="py-new-limit" type="range" min={account.limit} max={16000} step={500} value={limit} style={{ '--fill': `${fill}%` }} onInput={(event) => setLimit(Number(event.currentTarget.value))} />
        </div>
      </div>
      <ul class="py-checks">
        {checks.map((check) => <li key={check.label} class={check.ok ? 'ok' : 'warn'}><span aria-hidden="true">{check.ok ? '✓' : '!'}</span>{check.label}</li>)}
      </ul>
      {aboveBand && (
        <label class="py-field">Why this exception? A second approver will see it
          <textarea rows={3} value={reason} placeholder="e.g. 18 months on time; income up 30% with new payslips." onInput={(event) => setReason(event.currentTarget.value)} />
        </label>
      )}
      <AiSurface inline title={aboveBand ? 'Above band: suggest the band maximum instead' : 'Within policy · low risk'} meta="limit model · 0.83" sources={[{ label: 'statements · 18 months', score: 0.9 }, { label: 'policy v7 · bands', score: 0.94 }]}>
        {aboveBand ? `${brl(max)} keeps expected loss under 1.2% for this score band.` : 'On-time history and falling utilization support the raise.'}
      </AiSurface>
    </Layer>
  );
}

