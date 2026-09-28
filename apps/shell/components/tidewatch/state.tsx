'use client';

import type { ReactNode } from 'react';
import { clock } from '@portfolio/world';
import { useDemoState } from '@/components/overlay';
import { ZLink } from '@/components/zone-link';
import { useTelemetry } from '@/lib/tidewatch';

/** Tidewatch's designed states (`?state=`): banners over live data, or a skeleton / first-run page instead of it. */
export function TidewatchState({ children }: { children: ReactNode }) {
  const state = useDemoState();
  const { now } = useTelemetry(60_000);

  if (state === 'loading') {
    return (
      <main className="tw-main" aria-busy="true" data-anchor="tw-state">
        <p className="tw-banner info" role="status">Loading telemetry · querying the last 45 minutes of spans</p>
        <div className="tw-skeleton" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>
      </main>
    );
  }
  if (state === 'empty') {
    return (
      <main className="tw-main" data-anchor="tw-state">
        <section className="tw-panel tw-first-run">
          <span className="tw-eyebrow">No telemetry yet</span>
          <h1>Nothing has reported from maré · production yet</h1>
          <p className="tw-muted">Tidewatch builds its service flow, problems and SLOs from OpenTelemetry spans. Point one service's exporter here and the first trace appears within a minute.</p>
          <pre><code>OTEL_EXPORTER_OTLP_ENDPOINT=https://ingest.tidewatch.example{'\n'}OTEL_SERVICE_NAME=orders-api{'\n'}OTEL_TRACES_SAMPLER=parentbased_traceidratio{'\n'}OTEL_TRACES_SAMPLER_ARG=0.1</code></pre>
          <p><ZLink className="tw-link" href="/system-design/mare/request-path">See which services the request path touches →</ZLink></p>
        </section>
      </main>
    );
  }
  return (
    <>
      {state === 'error' && <p className="tw-banner risk" role="alert" data-anchor="tw-state">Ingest delayed · the collector queue is backing up, so charts can trail real time by up to 4 minutes. Nothing is dropped.</p>}
      {state === 'offline' && <p className="tw-banner warn" role="status" data-anchor="tw-state">Offline · showing the snapshot from {clock(now)}. The live tail resumes when you reconnect.</p>}
      {state === 'locked' && <p className="tw-banner info" role="status" data-anchor="tw-state">Read-only seat · remediation and alert edits need the on-call role. Ask the incident commander to add you.</p>}
      {children}
    </>
  );
}
