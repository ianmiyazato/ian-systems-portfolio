import { AiSurface, Banner, Layer, LiveControl, closeLayers, openLayer, useDemoState, useLocation, useSimNow } from '@portfolio/remote-runtime';
import { DEFAULT_START, clock } from '@portfolio/world';
import { useState } from 'preact/hooks';

type Job = { id: string; source: string; kind: 'Seller feed' | 'Supplier CSV' | 'Images' | 'Price list'; total: number; started: number; perSecond: number; errors: number; failed?: boolean };

/** Imports in flight at 16:18; progress is a function of sim time, so every tab agrees. */
const jobs: Job[] = [
  { id: 'IMP-2291', source: 'Linho & Co · marketplace feed', kind: 'Seller feed', total: 1_842, started: DEFAULT_START - 4 * 60_000, perSecond: 2.1, errors: 14 },
  { id: 'IMP-2290', source: 'Casa Ribeira · supplier CSV', kind: 'Supplier CSV', total: 640, started: DEFAULT_START - 11 * 60_000, perSecond: 0.9, errors: 3 },
  { id: 'IMP-2288', source: 'Summer 27 · image batch', kind: 'Images', total: 4_210, started: DEFAULT_START - 2 * 60_000, perSecond: 6.5, errors: 0 },
  { id: 'IMP-2286', source: 'Q4 price list · merchandising', kind: 'Price list', total: 1_310, started: DEFAULT_START - 38 * 60_000, perSecond: 3, errors: 0 },
  { id: 'IMP-2283', source: 'Atelier Norte · marketplace feed', kind: 'Seller feed', total: 512, started: DEFAULT_START - 52 * 60_000, perSecond: 1.2, errors: 41, failed: true }
];

const errorRows = [
  { row: 118, field: 'clr', value: 'SND', problem: 'unknown color code', fix: 'Sand' },
  { row: 119, field: 'clr', value: 'SND', problem: 'unknown color code', fix: 'Sand' },
  { row: 204, field: 'sz_cd', value: 'GG', problem: 'size outside US letters', fix: 'XL' },
  { row: 311, field: 'ncm', value: '6205.9', problem: 'NCM must have 8 digits', fix: '6205.90.00' },
  { row: 402, field: 'price', value: '259,90', problem: 'decimal comma', fix: '259.90' }
];

export function Imports() {
  const state = useDemoState();
  const { params } = useLocation();
  const now = useSimNow(1000);
  const [retried, setRetried] = useState<string[]>([]);
  const failed = state === 'failed';

  const progress = (job: Job) => {
    if (job.failed && !retried.includes(job.id)) return { done: Math.round(job.total * 0.34), status: 'failed' as const };
    const done = Math.min(job.total, Math.max(0, Math.round(((now - job.started) / 1000) * job.perSecond)));
    return { done, status: done >= job.total ? ('done' as const) : ('running' as const) };
  };
  const visible = failed ? jobs : jobs.filter((job) => !job.failed || retried.includes(job.id));
  const selected = params.get('drawer') === 'import' ? jobs.find((job) => job.id === params.get('job')) : undefined;

  return (
    <main class="ph-main" id="product-hub-imports">
      <div class="ph-title-row" data-anchor="ph-imports-head">
        <div>
          <h1>Imports</h1>
          <p class="ph-muted">Feeds, supplier files and image batches · validated row by row, never all-or-nothing</p>
        </div>
        <div class="ph-title-actions"><LiveControl anchor="ph-imports-live" /><button type="button" class="ph-btn primary">New import</button></div>
      </div>
      {failed && <Banner tone="risk" icon="!" title="IMP-2283 stopped at 34% · Atelier Norte changed its feed format" anchor="ph-import-failed" action={<button type="button" class="ph-btn" onClick={() => openLayer({ drawer: 'import', job: 'IMP-2283' })}>Open errors</button>}>174 rows imported and live; the rest wait. Nothing already published was touched.</Banner>}

      <section class="ph-table-wrap" aria-labelledby="jobs-title" data-anchor="ph-import-jobs">
        <header class="ph-table-head"><h2 id="jobs-title">Jobs</h2><span class="ph-muted">{visible.filter((job) => progress(job).status === 'running').length} running</span></header>
        <table class="ph-table">
          <thead><tr><th>Job</th><th>Source</th><th>Type</th><th>Progress</th><th class="num">Errors</th><th>Status</th><th>Started</th></tr></thead>
          <tbody>
            {visible.map((job) => {
              const { done, status } = progress(job);
              return (
                <tr key={job.id} class={status === 'failed' ? 'failed' : ''}>
                  <td><button type="button" class="ph-row-link mono" onClick={() => openLayer({ drawer: 'import', job: job.id })}>{job.id}</button></td>
                  <td>{job.source}</td>
                  <td>{job.kind}</td>
                  <td><span class="ph-progress" style={{ '--p': done / job.total }}><i /></span><small class="mono"> {done.toLocaleString('en-US')} / {job.total.toLocaleString('en-US')}</small></td>
                  <td class={`num mono ${job.errors ? 'warn' : ''}`}>{job.errors}</td>
                  <td><span class={`ph-tag ${status === 'done' ? 'ok' : status === 'failed' ? 'bad' : 'run'}`}>{status}</span></td>
                  <td class="mono">{clock(job.started)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <AiSurface title="14 rows fail on two codes Linho & Co always uses" meta="mapping agent · 0.93" anchor="ph-import-ai"
        sources={[{ label: 'rejected rows · IMP-2291', score: 0.96 }, { label: 'accepted mappings · Linho & Co', score: 0.91 }]}
        actions={<button type="button" class="ai-approve" onClick={() => openLayer({ drawer: 'import', job: 'IMP-2291' })}>Review fixes</button>}>
        “SND” is their code for Sand and “GG” is their XL. Saving both as seller mappings fixes these rows and the next feed.
      </AiSurface>

      {selected && <ImportDrawer job={selected} progress={progress(selected)} onRetry={() => { setRetried([...retried, selected.id]); closeLayers(['drawer', 'job']); }} />}
    </main>
  );
}

function ImportDrawer({ job, progress, onRetry }: { job: Job; progress: { done: number; status: string }; onRetry: () => void }) {
  const [accepted, setAccepted] = useState<number[]>([]);
  return (
    <Layer kind="drawer" title={job.id} eyebrow={`${job.source} · ${job.kind}`} onClose={() => closeLayers(['drawer', 'job'])} width={600} anchor="ph-import-drawer"
      footer={<><button type="button" class="ph-btn" onClick={() => setAccepted(errorRows.map((row) => row.row))}>Accept all fixes</button><button type="button" class="ph-btn primary" onClick={onRetry}>Retry failed rows</button></>}>
      <dl class="ph-live">
        <div><dt>Imported</dt><dd>{progress.done.toLocaleString('en-US')}</dd></div>
        <div><dt>Errors</dt><dd class={job.errors ? 'bad' : ''}>{job.errors}</dd></div>
        <div><dt>Status</dt><dd>{progress.status}</dd></div>
      </dl>
      <table class="ph-table compact">
        <thead><tr><th>Row</th><th>Field</th><th>Value</th><th>Problem</th><th>Suggested</th></tr></thead>
        <tbody>
          {errorRows.map((row) => (
            <tr key={row.row} class={accepted.includes(row.row) ? 'accepted' : ''}>
              <td class="mono">{row.row}</td><td class="mono">{row.field}</td><td class="mono">{row.value}</td><td>{row.problem}</td>
              <td><button type="button" class="ph-btn" aria-pressed={accepted.includes(row.row)} onClick={() => setAccepted(accepted.includes(row.row) ? accepted.filter((item) => item !== row.row) : [...accepted, row.row])}>{accepted.includes(row.row) ? `✓ ${row.fix}` : row.fix}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p class="ph-note">Rows are validated one by one: good rows go live as they pass, bad rows wait here. Accepted fixes become seller mappings, so the next feed imports cleanly.</p>
    </Layer>
  );
}
