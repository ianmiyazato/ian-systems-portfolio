'use client';

import { useState } from 'react';
import { ZLink } from '@/components/zone-link';
import { AiSurface, Layer, closeLayers, openLayer, useDemoState, useParams } from '@/components/overlay';
import { lessons } from '@/lib/atlas';
import { AtlasHeader } from './header';
import { usePlan, type Plan } from './plan';

const plans: Array<{ id: Plan; price: string; features: string[] }> = [
  { id: 'Free', price: '$0', features: ['3 Arena sessions / month', 'Public Academy lessons', 'Pipeline board'] },
  { id: 'Starter', price: '$12 / mo', features: ['10 sessions / month', 'Rubric history', 'Company pages'] },
  { id: 'Pro', price: '$29 / mo', features: ['Unlimited sessions', 'Members lessons', 'Interview loop intelligence', 'Bar-raiser interviewer'] }
];

export function Academy() {
  const params = useParams();
  const [plan] = usePlan();
  const modal = params.get('modal');
  return (
    <>
      <AtlasHeader active="Academy" />
      <main className="at-main at-academy">
        <aside className="at-card at-outline" aria-label="Course outline" data-anchor="at-outline">
          <span className="at-eyebrow">Course · Reliable systems</span>
          {lessons.map((group) => (
            <section key={group.module}>
              <h2>{group.module}</h2>
              <ol>{group.items.map(([title, status]) => {
                const locked = status === 'members' && plan !== 'Pro';
                return (
                  <li key={title} className={`${status} ${locked ? 'locked' : ''}`}>
                    <button type="button" onClick={() => (locked ? openLayer({ modal: 'paywall' }) : undefined)} aria-current={status === 'current' ? 'page' : undefined}>
                      <span className="at-dot" aria-hidden="true" />{title}{locked && <em>Members</em>}
                    </button>
                  </li>
                );
              })}</ol>
            </section>
          ))}
        </aside>
        <article className="at-lesson" data-anchor="at-lesson">
          <span className="at-eyebrow">Lesson 3 · 14 min</span>
          <h1>Designing for 10×</h1>
          <div className="at-video" data-anchor="at-video" role="img" aria-label="Lesson video, 6 of 14 minutes watched">
            <div className="at-video-art" aria-hidden="true"><i /><i /><i /></div>
            <div className="at-progress"><i style={{ width: '43%' }} /></div>
            <span>06:02 / 14:00</span>
          </div>
          <p>Most systems don’t fall over at 10× because of CPU. They fall over because one shared thing (a database row, a lock, a partner API) was sized for the old traffic and nobody noticed.</p>
          <h2>Find the shared thing first</h2>
          <p>List every resource that all requests touch. For a payments ledger that is usually the account balance row. At 10× writes it becomes a hotspot long before disks fill up.</p>
          <figure className="at-diagram" aria-label="Before: every write updates the balance row. After: writes append entries and a projector updates balances asynchronously.">
            <div><b>Before</b><span>write → balance row (lock)</span></div>
            <div><b>After</b><span>append entry → event → projector → balance</span></div>
          </figure>
          <h2>Then estimate, out loud</h2>
          <p>Write rate × entry size × retention, plus replication and indexes. Say the numbers; interviewers grade the reasoning, not the exact answer.</p>
        </article>
        <aside className="at-side">
          <AiSurface title="Practice this" meta="grounded in this lesson" anchor="at-practice-this" actions={<ZLink className="ai-approve" href="/atlas/arena?modal=setup&prompt=estimate-storage">Start a 20-min drill</ZLink>}>
            Estimation was your weakest rubric line in session 14. This drill uses the ledger example from this lesson.
          </AiSurface>
          <section className="at-card" data-anchor="at-members-lesson">
            <h2>Next: Caching that stays correct</h2>
            <p className="at-muted">Then two Members lessons on ledgers and idempotency.</p>
            <button type="button" className="at-btn" onClick={() => openLayer({ modal: 'paywall' })}>See Members lessons</button>
          </section>
        </aside>
      </main>
      {modal === 'paywall' && <Paywall />}
    </>
  );
}

function Paywall() {
  const params = useParams();
  const state = useDemoState();
  const [, setPlan] = usePlan();
  const [method, setMethod] = useState<'card' | 'pix'>('card');
  const [done, setDone] = useState(false);
  const failed = state === 'checkout-failed';
  const close = () => closeLayers(['modal', 'sub']);
  return (
    <>
      <Layer kind="modal" title="Unlock Members lessons" eyebrow="Plans" onClose={close} width={760} anchor="at-paywall"
        footer={<button type="button" className="at-btn primary" onClick={() => openLayer({ sub: 'checkout' })}>Continue with Pro</button>}>
        <div className="at-plans" data-anchor="at-plans">
          {plans.map((plan) => (
            <article key={plan.id} className={`at-plan-card ${plan.id === 'Pro' ? 'featured' : ''}`}>
              {plan.id === 'Pro' && <span className="at-badge">Most chosen</span>}
              <h3>{plan.id}</h3><strong>{plan.price}</strong>
              <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            </article>
          ))}
        </div>
      </Layer>
      {params.get('sub') === 'checkout' && (
        <Layer kind="sub" level={2} title="Checkout · Pro" eyebrow="First week free" onClose={() => closeLayers(['sub'])} width={460} anchor="at-checkout"
          footer={done ? <button type="button" className="at-btn primary wide" onClick={close}>Back to the lesson</button> : <button type="button" className="at-btn primary wide" onClick={() => { if (!failed) { setPlan('Pro'); setDone(true); } }}>Start free week</button>}>
          {done ? (
            <div className="at-success" role="status" data-anchor="at-checkout-success"><b aria-hidden="true">✓</b><strong>You’re Pro</strong><p>Members lessons, unlimited Arena and loop intelligence are unlocked in every open tab. First charge on Oct 3.</p></div>
          ) : (
            <>
              <div className="at-seg" role="group" aria-label="Payment method">{(['card', 'pix'] as const).map((value) => <button key={value} type="button" aria-pressed={method === value} onClick={() => setMethod(value)}>{value === 'card' ? 'Card' : 'Pix'}</button>)}</div>
              {method === 'card' ? (
                <div className="at-card-fields" data-anchor="at-card-fields">
                  <label className="at-input">Card number<input inputMode="numeric" autoComplete="cc-number" defaultValue="4242 4242 4242 4242" /></label>
                  <div className="at-row"><label className="at-input">Expiry<input autoComplete="cc-exp" defaultValue="09/29" /></label><label className="at-input">CVC<input inputMode="numeric" autoComplete="cc-csc" defaultValue="123" /></label></div>
                </div>
              ) : <p className="at-muted">A Pix code appears after you confirm; the plan activates as soon as the payment clears (usually seconds).</p>}
              {failed && <p className="at-banner risk" role="alert" data-anchor="at-checkout-failed">Card declined by the issuer (insufficient funds). Nothing was charged. Try Pix, or another card.</p>}
              <dl className="at-summary" data-anchor="at-summary"><div><dt>Pro · monthly</dt><dd>$29.00</dd></div><div><dt>First week</dt><dd>free</dd></div><div><dt>Due today</dt><dd>$0.00</dd></div></dl>
              <p className="at-note">Test mode: no real payment is taken.</p>
            </>
          )}
        </Layer>
      )}
    </>
  );
}
