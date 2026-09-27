'use client';

import { ZLink } from '@/components/zone-link';
import { AiSurface, useDemoState } from '@/components/overlay';
import { applications, funnel, skills } from '@/lib/atlas';
import { AtlasHeader } from './header';

export function Pipeline() {
  const state = useDemoState();
  const empty = state === 'empty';
  const upcoming = applications.filter((app) => app.stage === 'screen' || app.stage === 'onsite');
  const max = funnel[0][1];
  return (
    <>
      <AtlasHeader active="Pipeline" />
      <main className="at-main">
        <header className="at-head" data-anchor="at-head">
          <div><span className="at-eyebrow">Pipeline · week of Sep 22</span><h1>{empty ? 'Start your pipeline' : 'Four interviews this week'}</h1></div>
          <ZLink className="at-btn primary" href="/atlas/pipeline/board">Open board</ZLink>
        </header>
        {state === 'error' && <p className="at-banner risk" data-anchor="at-error">Job board sync failed 12 min ago · your pipeline is safe, new postings will appear when it recovers.</p>}
        {state === 'offline' && <p className="at-banner warn" data-anchor="at-offline">Offline · edits save locally and sync when you reconnect.</p>}
        {state === 'locked' && <p className="at-banner info" data-anchor="at-locked">Loop intelligence is a Pro feature · <ZLink href="/atlas/academy/designing-for-10x?modal=paywall">see plans</ZLink></p>}
        {state === 'limit' && <p className="at-banner warn" data-anchor="at-limit">You've used 3 of 3 free Arena sessions this month · next resets Oct 1, or go Pro for unlimited.</p>}
        {state === 'loading' ? (
          <div className="at-grid" aria-busy="true" data-anchor="at-loading">
            {[0, 1, 2, 3, 4].map((key) => <div key={key} className={`at-card skeleton ${key === 0 || key === 3 ? 'span-2' : ''}`} style={{ minHeight: key < 3 ? 200 : 120 }} aria-hidden="true" />)}
          </div>
        ) : empty ? (
          <section className="at-card at-empty" data-anchor="at-empty">
            <h2>No applications yet</h2>
            <p className="at-muted">Save a role, paste a job link, or import from a spreadsheet. Atlas links each one to the practice that fits it.</p>
            <div className="at-actions"><ZLink className="at-btn primary" href="/atlas/welcome?step=2">Tell us what you want</ZLink><button type="button" className="at-btn">Import CSV</button></div>
          </section>
        ) : (
          <>
            <div className="at-kpis" data-anchor="at-kpis">
              <div><span>Active roles</span><strong>{state === 'loading' ? '—' : 12}</strong></div>
              <div><span>Interviews this week</span><strong>4</strong></div>
              <div><span>Practice score</span><strong>78<small> ↑6</small></strong></div>
              <div><span>Screen → onsite</span><strong>44%</strong></div>
            </div>
            <div className="at-grid">
              <section className="at-card span-2" aria-labelledby="funnel-title" data-anchor="at-funnel">
                <h2 id="funnel-title">Funnel · 90 days</h2>
                <ol className="at-funnel">{funnel.map(([label, value], index) => <li key={label} style={{ '--w': `${Math.max(8, (value / max) * 100)}%`, '--i': index } as React.CSSProperties}><span>{label}</span><b>{value}</b></li>)}</ol>
              </section>
              <AiSurface title="Next best action" meta="from your Arena rubric" anchor="at-next-action" sources={[{ label: 'session 14 · estimation 2/4', score: 0.92 }, { label: 'Parallax Pay onsite · Thu', score: 0.88 }]}
                actions={<ZLink className="ai-approve" href="/atlas/arena?modal=setup&prompt=estimate-storage">Practice estimation</ZLink>}>
                Before the Parallax Pay onsite on Thursday, run the 20-minute estimation drill: it was your weakest rubric line last session.
              </AiSurface>
              <section className="at-card span-2" aria-labelledby="week-title" data-anchor="at-week">
                <h2 id="week-title">This week</h2>
                <ul className="at-week">{upcoming.map((app) => (
                  <li key={app.id}><div><strong>{app.company}</strong><small>{app.role}</small></div><span>{app.next}</span>{app.prep && <ZLink href="/atlas/arena?modal=setup&prompt=payments-ledger">Prep: {app.prep} →</ZLink>}</li>
                ))}</ul>
              </section>
              <section className="at-card" aria-labelledby="skills-title" data-anchor="at-skills">
                <h2 id="skills-title">Readiness</h2>
                <ul className="at-skills">{skills.map(([label, value]) => <li key={label}><span>{label}</span><i style={{ '--v': value / 100 } as React.CSSProperties} /><b>{value}</b></li>)}</ul>
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}
