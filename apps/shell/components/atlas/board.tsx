'use client';

import { useEffect, useState } from 'react';
import { ZLink } from '@/components/zone-link';
import { Layer, closeLayers, openLayer, useParams } from '@/components/overlay';
import { useAcceptedOffer, withAcceptedOffer } from './offer-state';
import { applications as seed, pipelineTimeline, stages, type Application, type Stage } from '@/lib/atlas';
import { DEFAULT_START, MINUTE } from '@portfolio/world';
import { useSimNow } from '@/lib/world';
import { LiveControl } from '@/components/live';
import { AtlasHeader } from './header';

export function Board() {
  const params = useParams();
  const [apps, setApps] = useState<Application[]>(seed);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [coach, setCoach] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const now = useSimNow();

  // Recruiters reply while the member watches: timeline entries apply once, unless moved by hand.
  useEffect(() => {
    if (now === null) return;
    const due = pipelineTimeline.filter((entry) => !applied.includes(entry.id) && now - DEFAULT_START >= entry.afterMinutes * MINUTE);
    if (!due.length) return;
    setApplied((list) => [...list, ...due.map((entry) => entry.id)]);
    setApps((list) => list.map((app) => {
      const entry = due.find((item) => item.id === app.id);
      return entry ? { ...app, stage: entry.stage, next: entry.next, moved: true } : app;
    }));
    setToast(due.at(-1)!.toast);
  }, [now, applied]);
  const [accepted] = useAcceptedOffer();
  const view = withAcceptedOffer(apps, accepted);
  const drawer = params.get('drawer');
  const current = apps.find((app) => app.id === drawer);

  useEffect(() => {
    try { setCoach(localStorage.getItem('atlas-coach-drag') !== 'done'); } catch { setCoach(true); }
  }, []);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 3800); return () => clearTimeout(id); }, [toast]);

  const dismissCoach = () => { setCoach(false); try { localStorage.setItem('atlas-coach-drag', 'done'); } catch { /* optional */ } };
  const move = (id: string, stage: Stage) => { setApps((list) => list.map((app) => (app.id === id ? { ...app, stage } : app))); dismissCoach(); };

  return (
    <>
      <AtlasHeader active="Pipeline" />
      <main className="at-main">
        <header className="at-head" data-anchor="at-board-head">
          <div><span className="at-eyebrow">Pipeline · board</span><h1>Applications</h1>{view.archived.length > 0 && <p className="at-muted" role="status">{view.archived.length} processes archived after you accepted an offer · polite notes sent</p>}</div>
          <div className="at-actions"><LiveControl anchor="at-board-live" /><ZLink className="at-btn" href="/atlas/pipeline">Overview</ZLink><button type="button" className="at-btn primary">Add application</button></div>
        </header>
        <div className="at-board" data-anchor="at-board">
          {stages.map((stage) => {
            const cards = view.apps.filter((app) => app.stage === stage.id);
            const coachTarget = coach && stage.id === 'onsite';
            return (
              <section key={stage.id} className={`at-col ${over === stage.id || coachTarget ? 'drop' : ''}`} aria-labelledby={`col-${stage.id}`}
                onDragOver={(event) => { event.preventDefault(); setOver(stage.id); }} onDragLeave={() => setOver(null)}
                onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (id) move(id, stage.id); setOver(null); setDragging(null); }}>
                <header><h2 id={`col-${stage.id}`}>{stage.label}</h2><span>{cards.length}</span></header>
                {cards.map((app) => {
                  const lifted = coach && app.id === 'nimbus';
                  return (
                    <article key={app.id} className={`at-app ${dragging === app.id ? 'dragging' : ''} ${lifted ? 'lifted' : ''} ${app.moved ? 'is-arriving' : ''}`} draggable
                      onDragStart={(event) => { event.dataTransfer.setData('text/plain', app.id); setDragging(app.id); }} onDragEnd={() => { setDragging(null); setOver(null); }}
                      data-anchor={app.id === 'parallax-pay' ? 'at-card-parallax' : undefined}>
                      <button type="button" className="at-app-open" onClick={() => openLayer({ drawer: app.id })}>
                        <strong>{app.company}</strong><span>{app.role}</span><small>{app.next}</small>
                      </button>
                      <footer><span className="at-salary">{app.salary}</span>{app.prep && <span className="at-prep">prep · {app.prep}</span>}</footer>
                      {lifted && <p className="at-coach" role="note">Drag cards between stages · <button type="button" onClick={dismissCoach}>Got it</button></p>}
                    </article>
                  );
                })}
                {(over === stage.id || coachTarget) && <div className="at-dropzone" aria-hidden="true">Drop to move</div>}
              </section>
            );
          })}
        </div>
        {toast && <div className="at-toast" role="status">{toast}</div>}
      </main>
      {current && <AppDrawer app={current} onMoved={(stage) => { move(current.id, stage); setToast(`${current.company} moved to Onsite · Arena prompt added`); closeLayers(['drawer', 'sub']); }} />}
    </>
  );
}

function AppDrawer({ app, onMoved }: { app: Application; onMoved: (stage: Stage) => void }) {
  const params = useParams();
  const [result, setResult] = useState('passed');
  const [asked, setAsked] = useState('Design a ledger for card payments; asked how I would handle reversals and idempotency.');
  return (
    <>
      <Layer kind="drawer" title={app.company} eyebrow={`${app.role} · ${app.location}`} onClose={() => closeLayers(['drawer', 'sub'])} width={460} anchor="at-drawer"
        footer={<button type="button" className="at-btn primary" onClick={() => openLayer({ sub: 'log-outcome' })} data-anchor="at-log-outcome-button">Log outcome</button>}>
        <dl className="at-meta"><div><dt>Stage</dt><dd>{app.stage}</dd></div><div><dt>Salary</dt><dd>{app.salary}</dd></div><div><dt>Next</dt><dd>{app.next}</dd></div></dl>
        <h3 className="at-sub">Timeline</h3>
        <ol className="at-timeline" data-anchor="at-app-timeline">
          <li className="done"><b>Sep 2</b>Applied with referral from Ana</li>
          <li className="done"><b>Sep 9</b>Recruiter call · passed</li>
          <li className="done"><b>Sep 18</b>Tech screen · system design</li>
          <li className="now"><b>Today</b>Waiting on outcome · onsite pencilled for Thu</li>
        </ol>
        <ZLink className="at-prep-link" href="/atlas/arena?modal=setup&prompt=payments-ledger" data-anchor="at-prep-link"><span className="ai-spark" aria-hidden="true" />Prep in Arena: Design a payments ledger →</ZLink>
      </Layer>
      {params.get('sub') === 'log-outcome' && (
        <Layer kind="sub" level={2} title="Log interview outcome" eyebrow={`${app.company} · tech screen`} onClose={() => closeLayers(['sub'])} width={460} anchor="at-log-outcome"
          footer={<button type="button" className="at-btn primary wide" onClick={() => onMoved(result === 'passed' ? 'onsite' : app.stage)}>{result === 'passed' ? 'Save and move to Onsite' : 'Save outcome'}</button>}>
          <fieldset className="at-radio" data-anchor="at-outcome-result"><legend>Result</legend>
            {['passed', 'waiting', 'rejected'].map((value) => <label key={value}><input type="radio" name="result" value={value} checked={result === value} onChange={() => setResult(value)} /><span>{value[0]!.toUpperCase() + value.slice(1)}</span></label>)}
          </fieldset>
          <label className="at-input">Next step<select defaultValue="onsite"><option value="onsite">Onsite · Thu 10:00</option><option value="final">Final round</option><option value="none">None yet</option></select></label>
          <label className="at-input">What they asked<textarea rows={3} value={asked} onChange={(event) => setAsked(event.target.value)} /></label>
          <section className="ai-surface ai-inline" aria-label="Simulated AI note" data-anchor="at-outcome-ai">
            <header className="ai-head"><span className="ai-spark" aria-hidden="true" /><span className="ai-badge">Simulated AI</span></header>
            <p className="ai-body">I’ll add a matching Arena prompt, “Ledger reversals and idempotency”, to this week’s plan.</p>
          </section>
        </Layer>
      )}
    </>
  );
}
