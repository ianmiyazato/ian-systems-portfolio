'use client';

import { useMemo } from 'react';
import { DAY, INCIDENT_START, MINUTE, problems } from '@portfolio/world';
import { useTelemetry } from '@/lib/tidewatch';
import { LineChart } from './charts';

type Slo = { id: string; name: string; target: number; window: string; fault: 'db-pool' | 'carrier-outage' | 'einvoice-fail' | 'topic-lag'; base: number; indicator: string };
const slos: Slo[] = [
  { id: 'checkout-availability', name: 'Checkout availability', target: 99.9, window: '30 days', fault: 'db-pool', base: 0.62, indicator: 'successful POST /graphql CreateOrder' },
  { id: 'checkout-latency', name: 'Checkout latency p95 < 300 ms', target: 99, window: '30 days', fault: 'db-pool', base: 0.48, indicator: 'requests under 300 ms' },
  { id: 'partner-integrations', name: 'Partner integrations', target: 99.5, window: '30 days', fault: 'carrier-outage', base: 0.71, indicator: 'partner calls that succeed or park safely' },
  { id: 'notifications', name: 'Notification freshness < 60 s', target: 99, window: '7 days', fault: 'topic-lag', base: 0.83, indicator: 'messages delivered within 60 s' }
];

export function Slos() {
  const { world, now } = useTelemetry(2000);
  const open = useMemo(() => (world ? problems(world, now) : []), [world, now, world?.state]);
  const burning = (slo: Slo) => open.some((problem) => problem.fault === slo.fault && problem.endedAt === undefined);
  const minutesIn = (slo: Slo) => open.filter((problem) => problem.fault === slo.fault).reduce((sum, problem) => sum + ((problem.endedAt ?? now) - problem.startedAt) / MINUTE, 0);
  const remaining = (slo: Slo) => Math.max(0, slo.base - minutesIn(slo) * (slo.fault === 'db-pool' ? 0.004 : 0.002));
  // 30 days of remaining checkout budget: a steady drain, then the incident's cliff.
  const days = Array.from({ length: 30 }, (_, index) => INCIDENT_START - (29 - index) * DAY);
  const budget = days.map((_, index) => Math.round((1 - index * 0.0125) * 100 - (index === 29 ? (1 - remaining(slos[0]!) / slos[0]!.base) * 30 : 0)));

  return (
    <main className="tw-main" id="tidewatch-slos">
      <header className="tw-head" data-anchor="tw-slos-head">
        <div><span className="tw-eyebrow">Service-level objectives · burn-rate alerting</span><h1>SLOs</h1><p className="tw-muted">Alerts page on how fast the error budget burns, not on single spikes: fast burn 14.4× over 1 h, slow burn 6× over 6 h.</p></div>
      </header>
      <div className="tw-slo-grid" data-anchor="tw-slo-cards">
        {slos.map((slo) => {
          const left = remaining(slo);
          const burn = burning(slo);
          return (
            <article key={slo.id} className={`tw-slo ${burn ? 'burning' : ''}`}>
              <header><h2>{slo.name}</h2><span className={`tw-status ${burn ? 'critical' : left < 0.3 ? 'warning' : 'good'}`}>{burn ? 'fast burn · paging' : left < 0.3 ? 'budget low' : 'healthy'}</span></header>
              <p className="tw-muted">{slo.target}% of {slo.indicator} · {slo.window}</p>
              <div className="tw-budget"><i style={{ '--v': left } as React.CSSProperties} aria-hidden="true" /><b>{Math.round(left * 100)}%</b><span>of error budget left</span></div>
              <dl><div><dt>Burn · 1 h</dt><dd className={burn ? 'bad' : ''}>{burn ? '14.2×' : '0.8×'}</dd></div><div><dt>Burn · 6 h</dt><dd>{burn ? '6.9×' : '0.9×'}</dd></div></dl>
            </article>
          );
        })}
      </div>
      <section className="tw-panel" data-anchor="tw-budget-chart" aria-labelledby="budget-title">
        <header><h2 id="budget-title">Checkout availability · error budget over 30 days</h2></header>
        <LineChart title="Budget remaining" unit="%" times={days} series={[{ id: 'budget', label: 'remaining', color: 'var(--series-1)', values: budget }]} marker={{ at: INCIDENT_START, label: 'P-812' }} />
      </section>
      <section className="tw-panel" data-anchor="tw-alerts" aria-labelledby="alerts-title">
        <header><h2 id="alerts-title">Burn-rate alerts</h2></header>
        <table className="tw-table"><thead><tr><th>Alert</th><th>Window</th><th>Threshold</th><th>State</th></tr></thead>
          <tbody>
            {slos.flatMap((slo) => [
              <tr key={`${slo.id}-fast`}><td>{slo.name} · fast burn</td><td>1 h / 5 min</td><td className="mono">14.4×</td><td><span className={`tw-status ${burning(slo) ? 'critical' : 'good'}`}>{burning(slo) ? 'firing · paged on-call' : 'ok'}</span></td></tr>,
              <tr key={`${slo.id}-slow`}><td>{slo.name} · slow burn</td><td>6 h / 30 min</td><td className="mono">6×</td><td><span className={`tw-status ${burning(slo) ? 'warning' : 'good'}`}>{burning(slo) ? 'firing · ticket' : 'ok'}</span></td></tr>
            ])}
          </tbody></table>
      </section>
    </main>
  );
}
