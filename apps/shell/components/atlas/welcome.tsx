'use client';

import { useMemo, useState } from 'react';
import { ZLink } from '@/components/zone-link';
import { openLayer, useParams } from '@/components/overlay';
import { AtlasHeader } from './header';

const steps = ['Your level', 'Where to work', 'Your stack', 'First practice'];
const regions = ['Remote · Americas', 'Remote · Europe', 'São Paulo', 'Lisbon', 'New York'];
const styles = ['Remote', 'Hybrid', 'On-site', 'Startup', 'Scale-up'];

export function Welcome() {
  const params = useParams();
  const step = Math.min(4, Math.max(1, Number(params.get('step') ?? 2)));
  const [picked, setPicked] = useState(['Remote · Americas', 'São Paulo']);
  const [work, setWork] = useState(['Remote', 'Startup']);
  const [min, setMin] = useState(140);
  const [max, setMax] = useState(190);
  const toggle = (list: string[], set: (next: string[]) => void, value: string) => set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const matches = useMemo(() => Math.max(2, Math.round(picked.length * 6 + work.length * 2 - (max - min < 30 ? 6 : 0) - Math.max(0, min - 150) / 10)), [picked, work, min, max]);

  return (
    <>
      <AtlasHeader active="Welcome" />
      <main className="at-main at-welcome">
        <ol className="at-steps" data-anchor="at-steps">
          {steps.map((label, index) => (
            <li key={label} className={index + 1 < step ? 'done' : index + 1 === step ? 'active' : ''}>
              <button type="button" onClick={() => openLayer({ step: String(index + 1) })} aria-current={index + 1 === step ? 'step' : undefined}><b>{index + 1 < step ? '✓' : index + 1}</b>{label}</button>
            </li>
          ))}
        </ol>
        <div className="at-welcome-grid">
          <section className="at-card" aria-labelledby="step-title">
            {step === 2 ? (
              <>
                <h1 id="step-title">Where do you want to work?</h1>
                <p className="at-muted">Pick everything that fits. Your plan updates as you answer.</p>
                <fieldset className="at-field" data-anchor="at-regions"><legend>Regions</legend>
                  <div className="at-toggles">{regions.map((region) => <button type="button" key={region} aria-pressed={picked.includes(region)} onClick={() => toggle(picked, setPicked, region)}>{region}</button>)}</div>
                </fieldset>
                <fieldset className="at-field" data-anchor="at-salary"><legend>Base salary (USD) <output>${min}k – ${max}k</output></legend>
                  <div className="at-range" style={{ '--min': `${((min - 80) / 170) * 100}%`, '--max': `${((max - 80) / 170) * 100}%` } as React.CSSProperties}>
                    <input type="range" min={80} max={250} step={5} value={min} aria-label="Minimum salary" onChange={(event) => setMin(Math.min(Number(event.target.value), max - 10))} />
                    <input type="range" min={80} max={250} step={5} value={max} aria-label="Maximum salary" onChange={(event) => setMax(Math.max(Number(event.target.value), min + 10))} />
                  </div>
                </fieldset>
                <fieldset className="at-field" data-anchor="at-work-style"><legend>Work style</legend>
                  <div className="at-toggles">{styles.map((style) => <button type="button" key={style} aria-pressed={work.includes(style)} onClick={() => toggle(work, setWork, style)}>{style}</button>)}</div>
                </fieldset>
                <div className="at-actions"><button type="button" className="at-btn" onClick={() => openLayer({ step: '1' })}>Back</button><button type="button" className="at-btn primary" onClick={() => openLayer({ step: '3' })}>Continue</button></div>
              </>
            ) : (
              <>
                <h1 id="step-title">{steps[step - 1]}</h1>
                <p className="at-muted">{step === 1 ? 'Senior · 7 years · backend and platform.' : step === 3 ? 'Go, TypeScript, Postgres, Kafka: we use this to pick practice prompts.' : 'Your first Arena session: Design a payments ledger, 45 minutes, friendly interviewer.'}</p>
                <div className="at-actions">
                  {step > 1 && <button type="button" className="at-btn" onClick={() => openLayer({ step: String(step - 1) })}>Back</button>}
                  {step < 4 ? <button type="button" className="at-btn primary" onClick={() => openLayer({ step: String(step + 1) })}>Continue</button> : <ZLink className="at-btn primary" href="/atlas/arena?modal=setup&prompt=payments-ledger">Set up first practice</ZLink>}
                </div>
              </>
            )}
          </section>
          <aside className="at-card at-plan-live" aria-live="polite" data-anchor="at-live-plan">
            <span className="at-eyebrow">Your plan, as you answer</span>
            <strong className="at-big">{matches} roles match</strong>
            <ul>
              <li><b>Where</b>{picked.length ? picked.join(', ') : 'Anywhere'}</li>
              <li><b>Band</b>${min}k – ${max}k base</li>
              <li><b>Style</b>{work.join(' · ') || 'Open'}</li>
              <li><b>Weekly</b>2 Arena sessions on distributed systems</li>
              <li><b>First lesson</b>Designing for 10×</li>
            </ul>
            <section className="ai-surface ai-inline" aria-label="Simulated AI suggestion">
              <header className="ai-head"><span className="ai-spark" aria-hidden="true" /><span className="ai-badge">Simulated AI</span></header>
              <p className="ai-body">{min >= 180 ? 'Staff roles dominate above $180k; I’ll add one staff-level system design prompt a week.' : 'Most remote Americas roles in this band ask for system design plus a payments or data background.'}</p>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
