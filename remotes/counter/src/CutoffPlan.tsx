import { AiSurface, Layer, closeLayers, openLayer, useParam, useSequence } from '@portfolio/remote-runtime';
import type { Action } from './board';

const moves = [
  { order: 'MR-904121', from: 'To pick', to: 'Luiza · now', reason: 'Delivery for Rota Sul 17:00; Luiza frees up at 16:22 in aisle B' },
  { order: 'MR-904124', from: 'To pick', to: 'Otávio · now', reason: '3 items near A1–A3; picked in 7 min at current pace' },
  { order: 'MR-904115', from: 'Rota Sul 17:00', to: 'Via Norte 18:30', reason: 'Truck is full; Via Norte adds R$ 9,20 instead of a missed SLA' }
];

const sources = [
  { label: 'carrier SLA · rev 12', score: 0.94 },
  { label: 'ATP snapshot · 16:18', score: 0.91 },
  { label: 'picker pace · last 30 min', score: 0.88 },
  { label: 'policy · missed-cutoff refund', score: 0.83 }
];

export function CutoffPlan({ act }: { act: (action: Action) => void }) {
  const sub = useParam('sub');
  const shown = useSequence(moves.length, 220);
  const close = () => closeLayers(['modal', 'sub']);
  const apply = () => {
    close();
    const run = () => act({ type: 'apply-plan' });
    // Cards glide between lanes via shared view-transition names.
    const doc = document as Document & { startViewTransition?: (callback: () => Promise<void>) => unknown };
    if (doc.startViewTransition) doc.startViewTransition(() => new Promise<void>((resolve) => { run(); setTimeout(resolve, 30); }));
    else run();
  };

  return (
    <>
      <Layer
        kind="sheet"
        title="Keep every delivery on today's truck"
        eyebrow="Cutoff plan · 16:18"
        onClose={close}
        width={820}
        anchor="ct-cutoff-plan"
        footer={
          <>
            <button type="button" class="ct-ghost" onClick={close}>Dismiss</button>
            <button type="button" class="ct-secondary" onClick={() => openLayer({ sub: 'why' })} data-anchor="ct-why-button">Why this plan?</button>
            <button type="button" class="ct-primary" onClick={apply}>Apply plan</button>
          </>
        }
      >
        <div class="ct-impact" data-anchor="ct-impact">
          <div class="good"><span>Missed cutoffs</span><strong>3 → 0</strong></div>
          <div><span>Extra cost</span><strong>R$ 18,40</strong></div>
          <div><span>Staff time</span><strong>+6 min</strong></div>
        </div>
        <ol class="ct-moves" data-anchor="ct-moves">
          {moves.slice(0, shown).map((move) => (
            <li key={move.order}>
              <b>{move.order}</b>
              <span class="ct-from">{move.from}</span>
              <span aria-hidden="true">→</span>
              <span class="ct-to">{move.to}</span>
              <small>{move.reason}</small>
            </li>
          ))}
        </ol>
        <AiSurface inline title="Proposed by the cutoff agent · you approve" meta="confidence 0.92" sources={sources} anchor="ct-plan-ai">
          Nothing moves until you apply. Each move is a replay-safe command with its own idempotency key.
        </AiSurface>
      </Layer>
      {sub === 'why' && (
        <Layer kind="sub-drawer" level={2} title="Why this plan" eyebrow="Evidence behind each move" onClose={() => closeLayers(['sub'])} anchor="ct-why">
          <ol class="ct-reasons">
            <li><b>1</b><p>At the current pace (4.1 min per item) three delivery orders finish after Rota Sul's 17:00 collection.</p></li>
            <li><b>2</b><p>Luiza and Otávio finish their current orders by 16:22 and are the nearest pickers to aisles A and B.</p></li>
            <li><b>3</b><p>Via Norte's 18:30 run costs R$ 9,20 per parcel, less than the refund policy for a missed same-day delivery.</p></li>
          </ol>
          <ul class="ai-sources" aria-label="Sources">
            {sources.map((source) => <li class="ai-source" key={source.label}>{source.label}<b>{source.score.toFixed(2)}</b></li>)}
          </ul>
          <p class="ct-note">Guardrail: the plan never moves a pickup whose customer is already on the way.</p>
        </Layer>
      )}
    </>
  );
}
