import { Banner, Layer, closeLayers, openLayer, useParam, useTween } from '@portfolio/remote-runtime';
import { useState } from 'preact/hooks';
import { LEAK_BASELINE, leakUsage } from './data';

export function Leak({ code }: { code: string }) {
  const sub = useParam('sub');
  const grow = useTween(1, 900);
  const [done, setDone] = useState<string | null>(null);
  const [cap, setCap] = useState(25);
  const max = Math.max(...leakUsage);
  const newCode = `${code}-SOL`;
  const close = () => closeLayers(['modal', 'code', 'sub']);

  return (
    <>
      <Layer
        kind="modal"
        title="Investigate coupon leak"
        eyebrow={`${code} · Mariana Luz · @mari.luz`}
        onClose={close}
        width={640}
        anchor="cc-leak"
        footer={
          <>
            <button type="button" class="cc-btn" onClick={() => setDone('Commission on unattributed MARI15 uses is on hold while you review.')}>Hold commission</button>
            <button type="button" class="cc-btn primary" onClick={() => openLayer({ sub: 'rotate' })} data-anchor="cc-rotate-button">Cap and rotate code</button>
          </>
        }
      >
        {done && <Banner tone="success" icon="✓" title="Done">{done}</Banner>}
        <figure class="cc-usage" data-anchor="cc-usage">
          <svg viewBox="0 0 420 150" role="img" aria-label={`Daily ${code} uses over 14 days; baseline about ${LEAK_BASELINE}, today ${leakUsage.at(-1)}`}>
            <line class="baseline" x1="0" x2="420" y1={130 - (LEAK_BASELINE / max) * 116} y2={130 - (LEAK_BASELINE / max) * 116} />
            {leakUsage.map((value, index) => {
              const height = (value / max) * 116 * grow;
              return <rect key={index} class={value > LEAK_BASELINE * 1.8 ? 'spike' : ''} x={index * 30 + 4} width="22" y={130 - height} height={height} rx="7" />;
            })}
            <text x="4" y="146">Sep 13</text><text x="370" y="146">today</text>
          </svg>
          <figcaption>Daily uses · dashed line is the 14-day baseline</figcaption>
        </figure>
        <div class="cc-stats" data-anchor="cc-leak-stats">
          <div><span>Uses today</span><strong>76</strong><small>3.8× baseline</small></div>
          <div><span>No creator session</span><strong>71%</strong><small>from a coupon aggregator</small></div>
          <div><span>Commission at risk</span><strong>R$2.3k</strong><small>unconfirmed</small></div>
        </div>
        <section class="ai-surface ai-inline" aria-label="Simulated AI explanation" data-anchor="cc-leak-why">
          <header class="ai-head"><span class="ai-spark" aria-hidden="true" /><span class="ai-badge">Simulated AI</span><span class="ai-meta">confidence 0.89</span></header>
          <p class="ai-body">The spike started when the code appeared on a coupon aggregator at 09:12. Buyers arrive without visiting Mariana's content first, so these sales aren't creator-influenced. Rotating keeps her real audience working.</p>
          <ul class="ai-sources"><li class="ai-source">referrer logs <b>0.91</b></li><li class="ai-source">creator sessions <b>0.88</b></li><li class="ai-source">coupon uses · 14d <b>0.96</b></li></ul>
        </section>
      </Layer>
      {sub === 'rotate' && (
        <Layer
          kind="sub"
          level={2}
          title="Rotate code"
          eyebrow="Mariana keeps her audience"
          onClose={() => closeLayers(['sub'])}
          width={460}
          anchor="cc-rotate"
          footer={<button type="button" class="cc-btn primary wide" onClick={() => { closeLayers(['sub']); setDone(`${code} retired · ${newCode} is live with a cap of ${cap} uses a day. Mariana was notified.`); }}>Send and rotate</button>}
        >
          <div class="cc-swap" data-anchor="cc-code-swap">
            <s>{code}</s><span aria-hidden="true">→</span><b>{newCode}</b>
          </div>
          <label class="cc-field">
            Daily cap <output>{cap} uses</output>
            <input type="range" min={10} max={60} step={5} value={cap} onInput={(event) => setCap(Number(event.currentTarget.value))} />
          </label>
          <div class="cc-chat" data-anchor="cc-message">
            <span class="cc-avatar small" style={{ '--hue': 2 }}>ML</span>
            <p class="cc-bubble">Hi Mari! Your code {code} leaked on a coupon site, so we made <b>{newCode}</b> just for you. Your real sales keep counting as usual ♥</p>
          </div>
          <p class="cc-note">Existing orders with {code} still pay out after the return window; only new uses switch codes.</p>
        </Layer>
      )}
    </>
  );
}
