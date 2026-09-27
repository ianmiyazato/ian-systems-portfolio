import { AiSurface, Banner, openLayer, useDemoState, useLocation, useTween } from '@portfolio/remote-runtime';
import { creators, brlk, week } from './data';
import { Leak } from './Leak';

function Trend({ values, up }: { values: number[]; up: boolean }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${34 - ((value - min) / (max - min || 1)) * 30}`).join(' ');
  return <svg class={`cc-trend ${up ? 'up' : 'down'}`} viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} /></svg>;
}

export function Program() {
  const state = useDemoState();
  const { params } = useLocation();
  const total = useTween(2.1, 1200);
  const empty = state === 'empty';
  return (
    <main class="cc-main">
      <section class="cc-hero" data-anchor="cc-hero">
        <h1>318 creators sold <em>R${total.toFixed(1)}M</em> this month</h1>
        <span class="cc-sticker big" aria-hidden="true">summer drop ✺</span>
        <p>Attribution, returns and payouts in one place. Commissions confirm 30 days after delivery, so a return never becomes a clawback.</p>
      </section>

      {state === 'contract-pending' && <Banner tone="warn" icon="✎" title="4 creators have a contract pending" anchor="cc-contract" action={<button type="button" class="cc-btn">Resend contracts</button>}>Their sales are attributed and commissions accrue, but payouts wait for a signature.</Banner>}
      {state === 'payout-failed' && <Banner tone="risk" icon="!" title="Payout failed · Joao M. · R$6,700" anchor="cc-payout-failed" action={<button type="button" class="cc-btn primary">Retry payout</button>}>The bank rejected the Pix key. We asked Joao to confirm it in the app; retrying uses the same idempotency key, so he can't be paid twice.</Banner>}
      {state === 'error' && <Banner tone="risk" icon="!" title="Attribution service delayed · numbers as of 15:40" anchor="cc-error">Orders are still recorded; commission totals catch up when the stream recovers.</Banner>}
      {state === 'offline' && <Banner tone="warn" icon="↯" title="You're offline · rule edits are saved as drafts" anchor="cc-offline" />}
      {state === 'locked' && <Banner tone="info" icon="i" title="Payout week · rules are frozen until Friday 18:00" anchor="cc-locked">Changing rates while payouts calculate would make receipts disagree with payments.</Banner>}

      <div class="cc-grid">
        <section class="cc-creators" aria-labelledby="creators-title" data-anchor="cc-creators">
          <header><h2 id="creators-title">Top creators</h2><span>this month</span></header>
          {empty ? (
            <div class="cc-first" data-anchor="cc-first-steps">
              <span class="cc-avatar" style={{ '--hue': 4 }}>LP</span>
              <div>
                <strong>Lia Prado joined 2 days ago · no sales yet</strong>
                <p>Most creators make a first sale within a week once they do these three things:</p>
                <ol>
                  <li class="done">Sign the creator contract</li>
                  <li>Share code <code>LIA10</code> in a story or bio link</li>
                  <li>Join the Swim drop campaign</li>
                </ol>
                <button type="button" class="cc-btn primary">Send Lia a starter kit</button>
              </div>
            </div>
          ) : (
            <div class="cc-cards">
              {creators.map((creator, index) => (
                <article key={creator.code} class={`cc-card ${creator.leak ? 'leak' : ''}`} style={{ '--i': index }}>
                  <header><span class="cc-avatar" style={{ '--hue': creator.hue }}>{creator.initials}</span><div><strong>{creator.name}</strong><small>{creator.handle}</small></div></header>
                  <span class="cc-code">{creator.code}</span>
                  <dl><div><dt>Sales</dt><dd>{brlk(creator.sales)}</dd></div><div><dt>Commission</dt><dd>{brlk(creator.commission)}</dd></div></dl>
                  <Trend values={creator.spark} up={creator.trend >= 0} />
                  <b class={creator.trend >= 0 ? 'up' : 'down'}>{creator.trend >= 0 ? '+' : ''}{creator.trend}%</b>
                  {creator.leak && <button type="button" class="cc-leak-link" onClick={() => openLayer({ modal: 'leak', code: creator.code })}>Unusual use · investigate</button>}
                </article>
              ))}
            </div>
          )}
        </section>

        <AiSurface title="Coupon leak detected · MARI15" meta="3.8× baseline" anchor="cc-leak-card" className="cc-ai"
          sources={[{ label: 'coupon uses · 14d', score: 0.96 }, { label: 'referrer logs', score: 0.91 }, { label: 'creator sessions', score: 0.88 }]}
          actions={<><button type="button" class="ai-approve" onClick={() => openLayer({ modal: 'leak', code: 'MARI15' })}>Investigate</button><button type="button" class="ai-explain" onClick={() => openLayer({ modal: 'leak', code: 'MARI15' })}>Why flagged?</button></>}>
          71% of today's MARI15 uses came from a coupon aggregator with no creator-session evidence. Mariana didn't post today.
        </AiSurface>

        <section class="cc-calendar" aria-labelledby="cal-title" data-anchor="cc-calendar">
          <header><h2 id="cal-title">Campaign week · Sep 22–28</h2></header>
          <ol>
            {week.map((day) => (
              <li key={day.day} class={day.date === 26 ? 'today' : ''}>
                <span>{day.day}</span><b>{day.date}</b>
                {day.items.map((item) => <em key={item} class={item.startsWith('Swim') ? 'swim' : item.startsWith('Linen') ? 'linen' : item.startsWith('Brief') ? 'brief' : 'weekend'}>{item}</em>)}
              </li>
            ))}
          </ol>
        </section>

        <div class="cc-tiles" data-anchor="cc-summary">
          <div><span>Pending returns</span><strong>R$184k</strong><small>settle after 30 days</small></div>
          <div><span>Payout Friday</span><strong>R$211k</strong><small>{state === 'payout-failed' ? '1 failed · retrying' : '309 creators'}</small></div>
          <div><span>New creators</span><strong>12</strong><small>this week</small></div>
        </div>
      </div>
      {params.get('modal') === 'leak' && <Leak code={params.get('code') ?? 'MARI15'} />}
    </main>
  );
}
