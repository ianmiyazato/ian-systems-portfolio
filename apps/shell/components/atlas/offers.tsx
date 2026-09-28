'use client';

import { useEffect, useState } from 'react';
import { brl } from '@portfolio/mocks';
import { DEFAULT_START, clock, duration, parseLocalTime } from '@portfolio/world';
import { ZLink } from '@/components/zone-link';
import { AiSurface, Layer, closeLayers, openLayer, useDemoState, useParams } from '@/components/overlay';
import { useSimNow } from '@/lib/world';
import { applications } from '@/lib/atlas';
import { archiveNote, fx, netOf, offers, takeHome, type Offer } from '@/lib/atlas-offers';
import { AtlasHeader } from './header';
import { useAcceptedOffer, withAcceptedOffer } from './offer-state';

const money = (value: number, shown: boolean) => (shown ? brl(Math.round(value)) : 'R$ ••••');

/** The BRL-per-USD rate at which the USD contract nets the same as the BRL offer (bisection; net rises with the rate). */
function crossingRate(target: number) {
  let low = 1;
  let high = 12;
  for (let step = 0; step < 40; step += 1) {
    const mid = (low + high) / 2;
    if (netOf(takeHome(offers[0]!, mid)) < target) low = mid; else high = mid;
  }
  return (low + high) / 2;
}

function Masked({ value, shown }: { value: number; shown: boolean }) {
  return shown ? <>{brl(Math.round(value))}</> : <><span aria-hidden="true">R$ ••••</span><span className="visually-hidden">amount hidden</span></>;
}

function OfferCard({ offer, rate, shown, selected, onSelect, expiring, now }: { offer: Offer; rate: number; shown: boolean; selected: boolean; onSelect: () => void; expiring: boolean; now: number }) {
  const net = netOf(takeHome(offer, rate));
  const deadline = parseLocalTime('22:00', now)!;
  return (
    <article className={`of-card ${offer.currency === 'USD' ? 'usd' : 'brl'} ${selected ? 'is-selected' : ''}`} data-anchor={offer.id === 'kite' ? 'of-card' : undefined}>
      <header><span className="of-kind">{offer.kind}</span>{expiring && offer.id === 'kite' ? <span className="of-expiry urgent" data-anchor="of-expiry">Expires in {duration(Math.max(0, deadline - now))} · {clock(deadline)}</span> : <span className="of-expiry">Decide by {offer.decideBy}</span>}</header>
      <h2>{offer.company}</h2>
      <p className="of-role">{offer.role}</p>
      <p className="of-net"><small>Net per month</small><b><Masked value={net} shown={shown} /></b></p>
      <ul className="of-perks">{offer.perks.map((perk) => <li key={perk}>{perk}</li>)}</ul>
      <div className="of-card-actions">
        <button type="button" className="at-btn" aria-pressed={selected} onClick={onSelect}>{selected ? 'Showing breakdown' : 'See breakdown'}</button>
        {offer.id === 'kite' && <button type="button" className="at-btn primary" onClick={() => openLayer({ sheet: 'accept', offer: offer.id })} data-anchor="of-accept">Accept offer</button>}
      </div>
    </article>
  );
}

function AcceptSheet({ offer, onAccept, accepted }: { offer: Offer; onAccept: () => void; accepted: boolean }) {
  const [phase, setPhase] = useState<'ready' | 'scanning' | 'done'>(accepted ? 'done' : 'ready');
  const archived = withAcceptedOffer(applications, offer.pipelineId ?? offer.id).archived;
  useEffect(() => {
    if (phase !== 'scanning') return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => { onAccept(); setPhase('done'); }, reduce ? 0 : 1200);
    return () => window.clearTimeout(timer);
  }, [phase]);
  return (
    <Layer kind="sheet" title={phase === 'done' ? `You accepted ${offer.company}` : `Accept ${offer.company}?`} eyebrow="Offer wallet · confirm it's you" onClose={() => closeLayers(['sheet', 'offer'])} width={560} anchor="of-sheet"
      footer={phase === 'done'
        ? <><ZLink className="at-btn primary" href="/atlas/pipeline/board">Open the board</ZLink><button type="button" className="at-btn" onClick={() => closeLayers(['sheet', 'offer'])}>Done</button></>
        : <><button type="button" className="at-btn primary" onClick={() => setPhase('scanning')} disabled={phase === 'scanning'}>{phase === 'scanning' ? 'Confirming…' : 'Confirm with Face ID'}</button><button type="button" className="at-btn" onClick={() => closeLayers(['sheet', 'offer'])}>Not yet</button></>}>
      {phase !== 'done' ? (
        <div className="of-bio">
          <div className={`of-ring ${phase}`} aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M6 16V10a4 4 0 0 1 4-4h6M32 6h6a4 4 0 0 1 4 4v6M42 32v6a4 4 0 0 1-4 4h-6M16 42h-6a4 4 0 0 1-4-4v-6" /><circle cx="18" cy="20" r="1.5" /><circle cx="30" cy="20" r="1.5" /><path d="M24 20v7h-2M18 32q6 5 12 0" /></svg></div>
          <p>Accepting moves {offer.company} to Accepted, archives {archived.length} other processes with a polite note, and sets a contract review reminder.</p>
        </div>
      ) : (
        <div className="of-done" role="status">
          <p><span aria-hidden="true">✓</span> {offer.company} moved to <b>Accepted</b></p>
          <p><span aria-hidden="true">✓</span> Contract review reminder · Mon 10:00</p>
          <p><span aria-hidden="true">✓</span> {archived.length} processes archived, notes queued:</p>
          <ul className="of-notes">{archived.map((app) => <li key={app.id}><b>{app.company}</b><q>{archiveNote(app.company)}</q></li>)}</ul>
        </div>
      )}
    </Layer>
  );
}

export function OfferWallet() {
  const state = useDemoState();
  const params = useParams();
  const now = useSimNow(1000) ?? DEFAULT_START;
  const [shown, setShown] = useState(false);
  const [rate, setRate] = useState(fx.rate);
  const [selectedId, setSelectedId] = useState('kite');
  const [accepted, setAccepted] = useAcceptedOffer();
  const selected = offers.find((offer) => offer.id === selectedId)!;
  const steps = takeHome(selected, rate);
  const net = netOf(steps);
  const max = Math.max(...steps.map((step) => Math.abs(step.amount)));
  const expiring = state === 'expiring';
  const sheetOffer = params.get('sheet') === 'accept' ? offers.find((offer) => offer.id === params.get('offer')) : undefined;
  const usdNet = netOf(takeHome(offers[0]!, rate));
  const brlNet = netOf(takeHome(offers[1]!, rate));
  const breakEven = crossingRate(brlNet);

  return (
    <>
      <AtlasHeader active="Offers" />
      <main className="of" data-anchor="of-main">
        <header className="of-head">
          <div><span className="at-eyebrow">Offer wallet · private by default</span><h1>Offers</h1><p className="at-muted">Compare what actually lands in your account each month, in reais.</p></div>
          <button type="button" className="of-eye" aria-pressed={shown} aria-label={shown ? 'Hide amounts' : 'Show amounts'} onClick={() => setShown(!shown)} data-anchor="of-eye">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{!shown && <path d="M4 4l16 16" />}</svg>
            <span>{shown ? 'Hide' : 'Show'}</span>
          </button>
        </header>
        {accepted && <p className="at-banner info" role="status">You accepted {offers.find((offer) => offer.pipelineId === accepted || offer.id === accepted)?.company}. <button type="button" className="of-undo" onClick={() => setAccepted(null)}>Undo (demo)</button></p>}
        {expiring && <p className="at-banner warn" data-anchor="of-expiring">Kite Robotics&apos; offer expires tonight at 22:00. Ask for an extension or decide today.</p>}

        <div className="of-cards">
          {offers.map((offer) => <OfferCard key={offer.id} offer={offer} rate={rate} shown={shown} selected={offer.id === selectedId} onSelect={() => setSelectedId(offer.id)} expiring={expiring} now={now} />)}
        </div>

        <section className="at-card of-breakdown" aria-labelledby="of-bd-title" data-anchor="of-breakdown">
          <header><h2 id="of-bd-title">{selected.company}: gross to net per month</h2><span className="at-muted">{selected.kind}</span></header>
          <ol className="of-steps">
            {steps.map((step) => (
              <li key={step.label} className={step.amount < 0 ? 'minus' : 'plus'}>
                <span className="of-step-label">{step.label}<small>{step.note}</small></span>
                <span className="of-step-bar" aria-hidden="true"><i style={{ transform: `scaleX(${Math.abs(step.amount) / max})` }} /></span>
                <b className="of-step-amount">{step.amount < 0 ? '−' : ''}<Masked value={Math.abs(step.amount)} shown={shown} /></b>
              </li>
            ))}
            <li className="of-total"><span className="of-step-label">Net per month</span><span /><b className="of-step-amount"><Masked value={net} shown={shown} /></b></li>
          </ol>
          <label className="of-fx" data-anchor="of-fx">
            <span>FX scenario · <b>R${rate.toFixed(2)}</b> per US$ <small>fixture {fx.rate.toFixed(2)} · {fx.asOf}</small></span>
            <input type="range" min={fx.min} max={fx.max} step={0.01} value={rate} onChange={(event) => setRate(Number(event.currentTarget.value))} aria-valuetext={`R$${rate.toFixed(2)} per dollar`} />
          </label>
        </section>

        <AiSurface title="Where the line crosses" meta="deterministic · no advice" anchor="of-ai"
          sources={[{ label: `FX fixture · ${fx.asOf}` }, { label: 'your two offers' }]}
          actions={<><button type="button" className="ai-approve" onClick={() => setRate(Math.round(breakEven * 100) / 100)}>Show me the break-even</button><button type="button" className="ai-explain" onClick={() => setRate(fx.rate)}>Back to today&apos;s rate</button></>}>
          At R${rate.toFixed(2)} the USD contract nets {money(Math.abs(usdNet - brlNet), shown)} {usdNet >= brlNet ? 'more' : 'less'} a month than the counter-offer. The two cross at about R${breakEven.toFixed(2)} per dollar, so the real bet is on the exchange rate, not the salary.
        </AiSurface>
      </main>
      {sheetOffer && <AcceptSheet offer={sheetOffer} accepted={accepted === (sheetOffer.pipelineId ?? sheetOffer.id)} onAccept={() => setAccepted(sheetOffer.pipelineId ?? sheetOffer.id)} />}
    </>
  );
}
