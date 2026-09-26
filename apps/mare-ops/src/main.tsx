import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@portfolio/tokens/styles.css';
import './style.css';

const systems = [
  ['balcão', '59 open orders', 'Store work shaped around the next cutoff.'],
  ['product hub', 'Summer · needs action', 'Dense merchandising with forecast evidence.'],
  ['pay', '37 applications in review', 'Model contributions meet human policy.'],
  ['circle', '318 creators active', 'Attribution and payout rules stay legible.'],
  ['mesh', '1 circuit half-open', 'Failure is visible, bounded, and replayable.']
] as const;

function App() {
  return <main><header><a href="/">IM</a><span>Maré Ops · runtime remote index</span><kbd>⌘K</kbd></header><section><span className="eyebrow">Five systems · five design languages</span><h1>One operating platform, built around five different jobs.</h1><p>The production shell composes these surfaces through a manifest. This direct zone entry remains a health and recovery index.</p><div className="systems">{systems.map(([name,title,copy])=><a key={name} href={`/mare/ops/${name.replace('ã','a').replace(' ','-')}`}><small>{name}</small><strong>{title}</strong><span>{copy}</span><b>Open remote →</b></a>)}</div></section><footer>All names are fictitious · data is synthetic · AI behavior is simulated in v0.1</footer></main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

