'use client';

import { useMemo, useState } from 'react';
import { DEFAULT_START, MINUTE, clock, traceIdOf } from '@portfolio/world';
import { ZLink } from '@/components/zone-link';
import { useTelemetry } from '@/lib/tidewatch';

type System = 'Counter' | 'Product Hub' | 'Pay' | 'Circle' | 'Mesh' | 'Atlas' | 'Pulse';
type Entry = { id: string; at: number; system: System; suggestion: string; approver: string; model: string; outcome: string; status: 'measured' | 'pending' | 'reverted'; trace: string; live?: boolean };

const systems: Array<System | 'All'> = ['All', 'Counter', 'Product Hub', 'Pay', 'Circle', 'Mesh', 'Atlas', 'Pulse'];
const bySlug: Record<string, System> = { counter: 'Counter', 'product-hub': 'Product Hub', pay: 'Pay', circle: 'Circle', mesh: 'Mesh', atlas: 'Atlas', pulse: 'Pulse' };
const modelFor: Record<System, string> = { Counter: 'ft-ops-v4', 'Product Hub': 'ft-pricing-v2', Pay: 'ft-risk-v3 · large for letters', Circle: 'ft-ops-v4', Mesh: 'ft-mesh-v1', Atlas: 'large · rubric-grounded', Pulse: 'large · evidence-grounded' };

/** History the audit starts with: approvals from earlier today and this week, with the outcome measured later. */
const history: Entry[] = [
  { id: 'h1', at: DEFAULT_START - 26 * 60 * MINUTE, system: 'Product Hub', suggestion: 'Lower Stone wide-leg pants R$299 → R$289 on site and app', approver: 'Lara', model: 'ft-pricing-v2', outcome: 'units +18% in 48 h · margin held at 41%', status: 'measured', trace: 'a41c02' },
  { id: 'h2', at: DEFAULT_START - 22 * 60 * MINUTE, system: 'Pay', suggestion: 'Submit evidence pack for CB-2231 (delivery proof + chat log)', approver: 'Rui', model: 'large · evidence letter', outcome: 'dispute won · R$429 kept', status: 'measured', trace: 'b7e310' },
  { id: 'h3', at: DEFAULT_START - 5 * 60 * MINUTE, system: 'Circle', suggestion: 'Rotate MARI15 after the leak spike, cap 40/day', approver: 'Bia', model: 'ft-ops-v4', outcome: 'leak stopped · 0 sales on the old code since', status: 'measured', trace: 'c09a77' },
  { id: 'h4', at: DEFAULT_START - 3 * 60 * MINUTE, system: 'Mesh', suggestion: 'Map Ligeiro Log status X9 → delivered_to_locker', approver: 'Rui', model: 'ft-mesh-v1', outcome: '0 new X9 exceptions in 3 h', status: 'measured', trace: 'd5f101' },
  { id: 'h5', at: DEFAULT_START - 2 * 60 * MINUTE, system: 'Counter', suggestion: 'Move 2 orders to free pickers to keep the 15:00 truck', approver: 'Ana', model: 'ft-ops-v4', outcome: 'all 7 deliveries made the truck', status: 'measured', trace: 'e2a8c4' },
  { id: 'h6', at: DEFAULT_START - 95 * MINUTE, system: 'Atlas', suggestion: 'Practice mix: estimation first, bar raiser mid-mix', approver: 'Ian (member)', model: 'large · rubric-grounded', outcome: 'estimation rubric 58 → 62 after 2 drills', status: 'measured', trace: 'f61b90' },
  { id: 'h7', at: DEFAULT_START - 70 * MINUTE, system: 'Pulse', suggestion: 'Cut the 01:18 bridge for Tokyo with JP captions', approver: 'Min-ji', model: 'large · evidence-grounded', outcome: 'Tokyo completion +9% in 20 min', status: 'measured', trace: '0a9d33' },
  { id: 'h8', at: DEFAULT_START - 40 * MINUTE, system: 'Product Hub', suggestion: 'Raise Sea-salt open knit R$189 → R$199 (low stock)', approver: 'Lara', model: 'ft-pricing-v2', outcome: 'reverted by Lara after 20 min · conversion −11%', status: 'reverted', trace: '1c6e55' }
];

export function AiAudit() {
  const { world, now } = useTelemetry(2000);
  const [system, setSystem] = useState<System | 'All'>('All');

  // Approvals people make anywhere in the portfolio arrive here as action.performed events.
  const live = useMemo<Entry[]>(() => {
    if (!world) return [];
    return world.between(DEFAULT_START - 60 * MINUTE, now, ['action.performed']).flatMap((event) => {
      if (event.topic !== 'action.performed') return [];
      const target = bySlug[event.payload.system];
      if (!target) return [];
      return [{ id: event.id, at: Date.parse(event.at), system: target, suggestion: `${event.payload.action[0]!.toUpperCase()}${event.payload.action.slice(1)} · ${event.payload.summary}`, approver: event.payload.actor === 'you' ? 'You' : event.payload.actor, model: modelFor[target], outcome: 'measured in 24 h', status: 'pending' as const, trace: traceIdOf(event.id), live: true }];
    });
  }, [world, now, world?.state]);

  const rows = [...live, ...history].filter((entry) => system === 'All' || entry.system === system).sort((a, b) => b.at - a.at);
  const counts = (name: System | 'All') => [...live, ...history].filter((entry) => name === 'All' || entry.system === name).length;

  return (
    <main className="tw-main" id="tidewatch-ai-audit">
      <header className="tw-head" data-anchor="tw-audit-head">
        <div><span className="tw-eyebrow">AI audit · every approved suggestion, its model, and what happened next</span><h1>AI audit</h1><p className="tw-muted">Simulated AI proposes; a person approves. Each row keeps who approved, which model version, and the outcome measured afterwards.</p></div>
      </header>
      <div className="tw-tabs" role="tablist" aria-label="System" data-anchor="tw-audit-systems">
        {systems.map((name) => <button key={name} type="button" role="tab" aria-selected={system === name} onClick={() => setSystem(name)}>{name}<span>{counts(name)}</span></button>)}
      </div>
      <section className="tw-panel" aria-labelledby="audit-title" data-anchor="tw-audit-log">
        <header><h2 id="audit-title">{system === 'All' ? 'All systems' : system}</h2><span className="tw-muted">{rows.length} approvals · newest first</span></header>
        <table className="tw-table">
          <thead><tr><th>When</th><th>System</th><th>Suggestion</th><th>Approved by</th><th>Model</th><th>Outcome later</th><th>Trace</th></tr></thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id} data-nav-row className={entry.live ? 'is-arriving' : undefined}>
                <td className="mono">{now - entry.at < 20 * 60 * 60 * 1000 ? clock(entry.at) : 'yesterday'}</td>
                <td>{entry.system}</td>
                <td>{entry.suggestion}</td>
                <td>{entry.approver}</td>
                <td className="mono">{entry.model}</td>
                <td><span className={`tw-status ${entry.status === 'measured' ? 'good' : entry.status === 'reverted' ? 'warning' : 'neutral'}`}>{entry.outcome}</span></td>
                <td><ZLink className="tw-trace-link" data-nav-open href={`/observability/traces/live?id=${entry.trace}`}>{entry.trace}</ZLink></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
