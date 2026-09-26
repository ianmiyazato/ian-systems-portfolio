'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { routeLinks, screenFor } from '@/lib/screens';
import { RealtimeFeed } from '@/components/realtime-feed';

type ExperienceProps = { path: string };
type Overlay = 'modal' | 'sub' | null;

const decisions = [
  { tag: 'Frontend', title: 'Information follows the next decision', why: 'Hierarchy is based on the operator’s next safe action, not the database shape.', alternative: 'A generic dashboard with equal-weight cards.', value: 'Less scanning and faster handoff during a live demo.' },
  { tag: 'Backend', title: 'Every action is replay-safe', why: 'Commands carry stable idempotency keys and write an audit event before side effects.', alternative: 'Direct synchronous mutations from the screen.', value: 'Retries stay safe during offline work and partner outages.' },
  { tag: 'Data', title: 'Freshness is visible', why: 'Timestamps, source chips, and health states expose when evidence can be trusted.', alternative: 'Hide staleness behind a single success state.', value: 'Reviewers can distinguish missing data from a real zero.' },
  { tag: 'AI', title: 'AI proposes; a person approves', why: 'Simulation traces retrieval, tools, guardrails, and sources before enabling the action.', alternative: 'An autonomous button with no evidence trail.', value: 'The trust pattern stays consistent across every design language.' }
];

const scenarioMap: Record<string, string[]> = {
  mare: ['Black Friday spike', 'Carrier outage', 'E-invoice rejections', 'Coupon leak'],
  atlas: ['Member upgrades plan', 'Arena session scored'],
  pulse: ['Moment detected → campaign', 'Model release through the eval gate']
};

export function Experience({ path }: ExperienceProps) {
  const screen = useMemo(() => screenFor(path), [path]);
  const [lensOpen, setLensOpen] = useState(false);
  const [decision, setDecision] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [palette, setPalette] = useState(false);
  const [demoState, setDemoState] = useState('live');
  const [approved, setApproved] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'KR' | 'JP'>('EN');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDemoState(params.get('state') ?? 'live');
    if (params.has('sub')) setOverlay('sub');
    else if (params.has('modal')) setOverlay('modal');
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select')) return;
      if (event.key.toLowerCase() === 'd') setLensOpen((value) => !value);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette((value) => !value);
      }
      if (event.key === 'Escape') {
        if (overlay === 'sub') setOverlay('modal');
        else if (overlay === 'modal') setOverlay(null);
        else setPalette(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlay]);

  const openOverlay = (next: Overlay) => {
    setOverlay(next);
    const query = next === 'sub' ? '?modal=decision&sub=evidence' : next === 'modal' ? '?modal=decision' : '';
    window.history.replaceState(null, '', `${path}${query}`);
  };

  return (
    <div className="app-shell" data-theme={screen.theme}>
      <header className="portfolio-bar">
        <Link className="identity" href="/" aria-label="Ian Miyazato home">
          <span className="monogram">IM</span>
          <span>Ian Miyazato</span>
        </Link>
        <nav aria-label="Portfolio">
          <Link href="/work">Work</Link>
          <Link href="/system-design/mare">Systems</Link>
          <Link href="/work/mare/languages">Design languages</Link>
        </nav>
        <div className="bar-actions">
          <span className="availability"><i /> Open to roles</span>
          <button className="quiet-button" onClick={() => setPalette(true)} aria-label="Open command palette">⌘K</button>
          <button className={lensOpen ? 'lens-button active' : 'lens-button'} onClick={() => setLensOpen(!lensOpen)} aria-pressed={lensOpen}>Show decisions <kbd>D</kbd></button>
        </div>
      </header>

      {path === '/' ? <Home /> : path.startsWith('/system-design/') ? <SystemDesign path={path} /> : <Workspace path={path} screen={screen} state={demoState} language={language} setLanguage={setLanguage} openModal={() => openOverlay('modal')} approved={approved} />}

      <footer>All names are fictitious · data is synthetic · AI behavior is simulated in v0.1</footer>

      {lensOpen && (
        <div className="decision-layer" aria-label="Decision lens annotations">
          {decisions.map((item, index) => (
            <button key={item.title} className={`hotspot hotspot-${index + 1}`} onClick={() => setDecision(index)} aria-label={`Decision ${index + 1}: ${item.title}`}>{index + 1}</button>
          ))}
        </div>
      )}

      {decision !== null && (
        <div className="scrim" role="presentation" onMouseDown={() => setDecision(null)}>
          <section className="decision-card" role="dialog" aria-modal="true" aria-labelledby="decision-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head"><span className="tag">{decisions[decision]?.tag}</span><button onClick={() => setDecision(null)} aria-label="Close decision">×</button></div>
            <h2 id="decision-title">{decisions[decision]?.title}</h2>
            <dl><dt>Decision</dt><dd>{decisions[decision]?.title}</dd><dt>Why</dt><dd>{decisions[decision]?.why}</dd><dt>Alternative considered</dt><dd>{decisions[decision]?.alternative}</dd><dt>Value</dt><dd>{decisions[decision]?.value}</dd></dl>
          </section>
        </div>
      )}

      {overlay && (
        <div className="scrim overlay-scrim" role="presentation" onMouseDown={() => openOverlay(null)}>
          <section className="action-modal" role="dialog" aria-modal="true" aria-labelledby="overlay-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head"><span className="overline">Decision · human approval</span><button onClick={() => openOverlay(null)} aria-label="Close modal">×</button></div>
            <h2 id="overlay-title">{screen.modal.title}</h2>
            <p>Review the proposed action, its policy boundary, and the evidence recorded for the audit log.</p>
            <div className="choice-grid"><button className="choice selected"><strong>Recommended</strong><span>Inside policy band</span></button><button className="choice"><strong>Conservative</strong><span>Lower operational risk</span></button></div>
            <label className="field">Reason for the audit log<textarea defaultValue="Evidence reviewed; proceed with the guarded proposal." /></label>
            <div className="ai-card compact"><div><span className="spark">✦</span><strong>Simulated AI</strong></div><p>Guardrails passed · confidence 0.92</p><div className="sources"><span>policy 44</span><span>live snapshot</span></div></div>
            <div className="modal-actions"><button className="secondary" onClick={() => openOverlay('sub')}>{screen.modal.subTitle}…</button><button className="primary" onClick={() => { setApproved(true); openOverlay(null); }}>{screen.modal.action}</button></div>
          </section>
          {overlay === 'sub' && (
            <section className="sub-modal" role="dialog" aria-modal="true" aria-labelledby="sub-title" onMouseDown={(event) => event.stopPropagation()}>
              <div className="modal-head"><span className="overline">Nested decision</span><button onClick={() => openOverlay('modal')} aria-label="Close top layer">×</button></div>
              <h2 id="sub-title">{screen.modal.subTitle}</h2>
              <p>The parent decision remains visible. Esc closes only this layer and returns focus to its trigger.</p>
              <div className="evidence-list"><span>01 · Request is replay-safe</span><span>02 · Source freshness is under 60 seconds</span><span>03 · A second approver is online</span></div>
              <label className="field">Confirmation code<input defaultValue="4471" /></label>
              <button className="primary wide" onClick={() => { setApproved(true); openOverlay(null); }}>Confirm and record</button>
            </section>
          )}
        </div>
      )}

      {palette && (
        <div className="scrim palette-scrim" role="presentation" onMouseDown={() => setPalette(false)}>
          <section className="palette" role="dialog" aria-modal="true" aria-labelledby="palette-title" onMouseDown={(event) => event.stopPropagation()}>
            <label id="palette-title">Jump to a system<input autoFocus placeholder="Search routes and demo states…" /></label>
            <div className="palette-grid">{routeLinks.map(([label, href]) => <a key={href} href={href}><span>{label}</span><small>{href}</small></a>)}</div>
            <div className="state-row"><span>Show state:</span>{['empty', 'loading', 'error', 'offline', 'locked'].map((state) => <button key={state} onClick={() => { window.location.assign(`${path}?state=${state}`); }}>{state}</button>)}</div>
          </section>
        </div>
      )}
    </div>
  );
}

function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-copy"><span className="overline">Backend depth · product judgment · frontend craft</span><h1>I build the core platform <em>and the product people touch</em> on top of it.</h1><p>Systems work is product work: the best architecture makes the next human decision faster, safer, and easier to explain.</p><div className="hero-actions"><Link className="primary" href="/work">Explore the work</Link><Link className="secondary" href="/system-design/mare">Replay a system</Link></div></div>
        <div className="hero-orbit" aria-hidden="true"><span className="orbit orbit-a"/><span className="orbit orbit-b"/><div className="core">event<br/>core</div><div className="orbit-label label-a">UI</div><div className="orbit-label label-b">data</div><div className="orbit-label label-c">AI</div></div>
      </section>
      <div className="marquee"><div>{['API latency 450 → ~200 ms','Uptime 99.5 → 99.9%','Deploys 2 → 8–12 per week','Batch runtime 60–90 → 5–15 min'].concat(['API latency 450 → ~200 ms','Uptime 99.5 → 99.9%','Deploys 2 → 8–12 per week']).map((item,index)=><span key={`${item}-${index}`}>{item}</span>)}</div></div>
      <section className="project-section"><div className="section-heading"><span>Selected systems</span><h2>Three products. Three operating models. One decision lens.</h2></div><div className="project-grid"><Project title="Maré" type="Retail platform" copy="Five teams keep distinct interaction languages while sharing contracts, events, and trust patterns." accent="Topology" href="/work/mare"/><Project title="Atlas" type="Careers platform" copy="Practice signals flow into a career pipeline without turning people into a score." accent="Funnel" href="/work/atlas"/><Project title="Pulse" type="Entertainment concept" copy="Market intelligence, distribution, and model evaluation share one evidence trail." accent="Signal" href="/work/pulse"/></div></section>
      <section className="principles"><div><span>01</span><h3>Make the system legible</h3><p>Surface freshness, ownership, fallback state, and the cost of a decision.</p></div><div><span>02</span><h3>Design for failure first</h3><p>Offline queues, circuit breakers, and replay tools are part of the primary UX.</p></div><div><span>03</span><h3>Earn automation</h3><p>AI proposes with sources and guardrails. Humans approve consequential actions.</p></div></section>
      <section className="founder-table"><div className="section-heading"><span>Operating range</span><h2>What a founding engineer needs, and where I’ve done it</h2></div>{[['Turn ambiguity into a product','Decision maps, prototypes, and vertical slices','Across Maré, Atlas, Pulse'],['Build the hard platform layer','Events, reliability, integrations, data contracts','Maré Integration Mesh'],['Ship an interface people trust','Dense operations UI and explainable automation','Balcão, Pay, Product Hub'],['Raise the learning rate','Instrumentation, eval gates, scenario replay','Pulse AI harness']].map((row)=><div className="table-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span></div>)}</section>
    </main>
  );
}

function Project({ title, type, copy, accent, href }: { title: string; type: string; copy: string; accent: string; href: string }) {
  return <a className={`project-card project-${title.toLowerCase()}`} href={href}><div className="project-preview"><div className="preview-grid"/><div className="pulse-dot"/><span>{accent}</span></div><div><span className="overline">{type}</span><h3>{title}</h3><p>{copy}</p><b>Open case study →</b></div></a>;
}

function SystemDesign({ path }: { path: string }) {
  const project = path.split('/').at(-1) ?? 'mare';
  const scenarios = scenarioMap[project] ?? scenarioMap.mare ?? [];
  const [active, setActive] = useState(scenarios[0] ?? 'Scenario');
  const [step, setStep] = useState(0);
  const flow = ['Experience', 'API edge', 'Event bus', 'Workers', 'Read models'];
  return <main className="system-page"><section className="system-head"><div><span className="overline">Interactive architecture · {project}</span><h1>Decisions under load</h1><p>Replay the event path, then inspect why each boundary exists.</p></div><div className="before-after"><button className="active">Event-driven</button><button>Synchronous before</button></div></section><div className="scenario-buttons">{scenarios.map((scenario)=><button key={scenario} className={active===scenario?'active':''} onClick={()=>{setActive(scenario);setStep(0);}}>{scenario}</button>)}</div><section className="architecture"><div className="flow-canvas">{flow.map((node,index)=><div key={node} className={`node ${index<=step?'lit':''}`}><span>{String(index+1).padStart(2,'0')}</span><strong>{node}</strong><small>{index===0?'intent + idempotency':index===1?'auth + rate limit':index===2?'ordered contract':index===3?'retry + DLQ':'fast, purpose-built reads'}</small>{index<flow.length-1&&<i/>}</div>)}</div><aside><span className="overline">Now replaying</span><h2>{active}</h2><p>{['Request accepted and given a stable key.','Command writes once; the user is released.','Consumers scale independently behind the event log.','A failed edge opens its circuit without stopping the flow.','Read models converge and the UI shows freshness.'][step]}</p><button className="primary wide" onClick={()=>setStep((step+1)%flow.length)}>{step===flow.length-1?'Replay':'Next step'} →</button><div className="timeline">{flow.map((item,index)=><span key={item} className={index<=step?'done':''}>{item}</span>)}</div></aside></section><section className="metric-compare"><div><span>API latency</span><strong>450 → ~200 ms</strong></div><div><span>Error rate</span><strong>1.8% → 0.5–0.7%</strong></div><div><span>Recovery time (MTTR)</span><strong>2–3 h → 30–45 min</strong></div><div><span>Availability</span><strong>99.8%</strong></div></section></main>;
}

function Workspace({ path, screen, state, language, setLanguage, openModal, approved }: { path: string; screen: ReturnType<typeof screenFor>; state: string; language: 'EN'|'KR'|'JP'; setLanguage: (value:'EN'|'KR'|'JP')=>void; openModal:()=>void; approved:boolean }) {
  const isOps = path.startsWith('/mare/ops');
  const feedKind = screen.theme === 'balcao' ? 'orders' : screen.theme === 'mesh' ? 'mesh' : screen.theme === 'pulse' ? 'pulse' : null;
  return <main className="workspace" id="workspace"><section className="workspace-top"><div><span className="overline">{screen.eyebrow}</span><h1>{screen.title}</h1><p>{screen.description}</p></div><div className="top-tools">{screen.theme==='pulse'&&<div className="language-switch">{(['EN','KR','JP'] as const).map((item)=><button className={language===item?'active':''} key={item} onClick={()=>setLanguage(item)}>{item}</button>)}</div>}<span className="health"><i/> {isOps?'remote healthy':'live local simulation'}</span></div></section><nav className="system-tabs" aria-label="System sections">{screen.tabs.map((tab,index)=><a className={index===0?'active':''} key={tab} href="#workspace">{tab}</a>)}</nav>{state!=='live'&&<StateBanner state={state}/>}<section className="kpi-grid">{screen.kpis.map(([label,value,tone])=><div className={tone==='risk'?'risk':''} key={label}><span>{label}</span><strong>{value}</strong><i/></div>)}</section>{feedKind&&<RealtimeFeed kind={feedKind}/>}<section className="work-grid"><div className="main-panel"><div className="panel-head"><div><span className="overline">Operational workspace</span><h2>{path.includes('picking')?'Scan the next item':'Live decision queue'}</h2></div><button className="filter">All states ↓</button></div><div className={state==='loading'?'records loading':'records'}>{state==='empty'?<div className="empty-state"><span>○</span><h3>Nothing needs attention</h3><p>Change the demo state from the command palette.</p></div>:screen.cards.map((card,index)=><article className="record" key={card.title} style={{'--delay':`${index*70}ms`} as React.CSSProperties}><div className="record-visual"><span>{String(index+1).padStart(2,'0')}</span><i/></div><div><span className="record-meta">{card.meta}</span><h3>{card.title}</h3><p>{card.body}</p></div><div className="record-action"><span className={`status ${card.status.toLowerCase().replaceAll(' ','-')}`}>{card.status}</span><button onClick={openModal} aria-label={`Open ${card.title}`}>→</button></div></article>)}</div></div><aside className="side-panel"><div className="ai-card"><div className="ai-title"><span className="spark">✦</span><div><strong>Simulated AI</strong><small>grounded proposal</small></div></div><h2>{screen.theme==='mesh'?'Triage is ready':screen.theme==='pulse'?'Ask Pulse':screen.theme==='circle'?'Leak pattern found':'Next action is ready'}</h2><p>Retrieved evidence supports a guarded plan. Nothing changes until a person approves.</p><div className="sources"><span>source · 0.94</span><span>policy · 0.91</span></div><button className="primary wide" onClick={openModal}>Review plan</button><button className="text-button">Explain this suggestion</button></div><div className="trace-card"><span className="overline">Live trace</span>{['retrieve context','rerank 5 chunks','check guardrails','draft audit note'].map((item,index)=><div key={item}><i className={index<3?'done':''}/><span>{item}</span><small>{[84,31,126,42][index]}ms</small></div>)}</div>{approved&&<div className="success-card"><span>✓</span><div><strong>Decision recorded</strong><p>The synthetic event was appended to the audit trail.</p></div></div>}</aside></section><section className="depth-row"><div><span className="overline">Subpage</span><h2>Inspect the evidence, not just the score</h2><p>Details preserve source freshness, failure modes, and the human handoff.</p><a href={`${path.replace(/\/$/,'')}/detail`}>Open detail →</a></div><div className="chart-card"><div className="chart-head"><span>Signal over time</span><strong>live</strong></div><svg viewBox="0 0 600 180" role="img" aria-label="Synthetic signal chart"><path className="grid-line" d="M0 30H600M0 90H600M0 150H600"/><path className="chart-line" d="M0 135 C70 118 90 138 150 98 S250 62 300 80 S390 122 430 58 S530 22 600 42"/><circle cx="430" cy="58" r="5"/></svg></div></section></main>;
}

function StateBanner({ state }: { state: string }) {
  const copy: Record<string,string> = { offline:'Offline · 3 actions queued, will sync', error:'Partner unavailable · circuit open, retry scheduled', locked:'This evidence is available on the Pro plan', loading:'Refreshing the latest synthetic snapshot…', empty:'No records match this view' };
  return <div className={`state-banner ${state}`}><span>{state==='offline'?'↯':state==='error'?'!':'○'}</span>{copy[state]??`Demo state: ${state}`}</div>;
}
