import type { RemoteContext } from '@portfolio/remote-runtime';
import { AiSurface, Banner, Link, openFeed, startDemoDriver, useDemoState } from '@portfolio/remote-runtime';
import { useEffect, useRef, useState } from 'preact/hooks';
import { edges, logScript, nodes, partners, pathFor, type Edge, type LogLine, type Node } from './data';

const clock = (offset: number) => {
  const seconds = 16 * 3600 + 18 * 60 + 44 + offset;
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((part) => String(part).padStart(2, '0')).join(':');
};

export function Topology({ ctx }: { ctx: RemoteContext }) {
  const state = useDemoState();
  const calm = state === 'calm' || state === 'replayed';
  const down = state === 'down';
  const healthOf = (health: Node['health'] | Edge['health'], id: string) => (calm ? 'ok' : down && id === 'ligeiro' ? 'down' : health);
  const [lines, setLines] = useState<LogLine[]>(() => logScript.slice(0, 5).map((line, index) => ({ ...line, t: clock(index * 3 - 15) })));
  const counter = useRef(5);

  useEffect(() => {
    if (state === 'empty' || state === 'loading') return;
    const feed = openFeed<LogLine>('mesh-log-stream', ctx.data, (message) => {
      if (message.event === 'log') setLines((current) => [...current.slice(-11), message.payload]);
    });
    const stop = startDemoDriver('mesh-log-stream', 2600, () => {
      const next = logScript[counter.current % logScript.length]!;
      feed.send('log', { ...next, t: clock(counter.current * 3) });
      counter.current += 1;
    });
    return () => { stop(); feed.close(); };
  }, [ctx.data, state]);

  return (
    <main class="ms-main ms-topology">
      {down && <Banner tone="risk" icon="✕" title="ligeiro log is down · circuit open since 16:11" anchor="ms-down" action={<Link class="ms-btn" href="/mare/ops/mesh/partners/ligeiro-log">open adapter</Link>}>calls fail fast; 64 events wait in the dlq with their idempotency keys. next half-open probe in 42s.</Banner>}
      {state === 'replayed' && <Banner tone="success" icon="✓" title="replay finished · 15 succeeded · 2 transformed · 1 skipped (duplicate)" anchor="ms-replayed">no event was applied twice; dlq is empty.</Banner>}
      {state === 'error' && <Banner tone="risk" icon="!" title="metrics pipeline delayed · topology as of 16:14" anchor="ms-error">events still flow; only the dashboard is stale.</Banner>}
      {state === 'offline' && <Banner tone="warn" icon="↯" title="console offline · actions disabled until reconnect" anchor="ms-offline" />}
      {state === 'locked' && <Banner tone="info" icon="i" title="change freeze · black friday window · read-only" anchor="ms-locked">replays and mapping deploys need an incident commander until 23:59.</Banner>}

      <section class="ms-panel ms-graph" aria-labelledby="topo-title" data-anchor="ms-topology">
        <header><h1 id="topo-title">live topology</h1><span class="ms-muted">packets = sampled events · edge color = health</span></header>
        {state === 'loading' ? <div class="skeleton ms-graph-skeleton" aria-hidden="true" /> : (
          <svg viewBox="0 0 1000 420" role="img" aria-label="Topology: site, app, stores and marketplace publish to the event bus, which feeds fulfillment, e-invoicing and three carriers. Ligeiro Log is degraded.">
            {edges.map((edge) => <path key={`e-${edge.to}-${edge.from}`} class={`edge ${healthOf(edge.health, edge.to)}`} d={pathFor(edge)} />)}
            {edges.map((edge, index) => {
              const health = healthOf(edge.health, edge.to);
              if (health === 'down') return null;
              return [0, 1].map((copy) => (
                <circle key={`p-${index}-${copy}`} r="5" class={`packet ${health}`} style={{ offsetPath: `path('${pathFor(edge)}')`, animationDuration: health === 'warn' ? '3.6s' : '2.2s', animationDelay: `${index * -0.37 - copy * 1.1}s` }} />
              ));
            })}
            {edges.filter((edge) => edge.from === 'core').map((edge) => {
              const target = nodes.find((node) => node.id === edge.to)!;
              return <text key={`r-${edge.to}`} class="rate" text-anchor="end" x={target.x - 98} y={target.y - 10}>{healthOf(edge.health, edge.to) === 'down' ? 'open circuit' : edge.rate}</text>;
            })}
            {nodes.map((node) => {
              const health = healthOf(node.health, node.id);
              const width = node.side === 'core' ? 156 : node.side === 'out' ? 180 : 160;
              return (
                <g key={node.id} class={`node ${health} ${node.side}`}>
                  <rect x={node.x - width / 2} y={node.y - (node.side === 'core' ? 44 : 26)} width={width} height={node.side === 'core' ? 88 : 52} rx="6" />
                  {node.id === 'ligeiro' && health !== 'ok' && <circle class="halo" cx={node.x + width / 2 - 12} cy={node.y - 14} r="6" />}
                  <text x={node.x - width / 2 + 12} y={node.y - (node.side === 'core' ? 6 : 3)} class="label">{node.label}</text>
                  <text x={node.x - width / 2 + 12} y={node.y + (node.side === 'core' ? 14 : 15)} class="sub">{node.id === 'ligeiro' && health === 'down' ? 'circuit open' : node.sub}</text>
                </g>
              );
            })}
          </svg>
        )}
      </section>

      <div class="ms-row">
        <section class="ms-panel" aria-labelledby="partners-title" data-anchor="ms-partners">
          <header><h2 id="partners-title">partner adapters</h2></header>
          <table class="ms-table">
            <thead><tr><th>partner</th><th>protocol</th><th>p95</th><th>errors</th><th>circuit</th><th>last event</th></tr></thead>
            <tbody>
              {partners.map((partner) => {
                const circuit = calm ? 'closed' : down && partner.id === 'ligeiro-log' ? 'open' : partner.circuit;
                return (
                  <tr key={partner.id}>
                    <td><Link href={`/mare/ops/mesh/partners/${partner.id}`}>{partner.name}</Link></td>
                    <td>{partner.protocol}</td>
                    <td>{partner.p95}</td>
                    <td class={parseFloat(partner.errors) > 2 && !calm ? 'warn' : ''}>{calm ? '0.1%' : partner.errors}</td>
                    <td><span class={`ms-circuit ${circuit}`}>{circuit}</span></td>
                    <td>{partner.last}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section class="ms-panel" aria-labelledby="log-title" data-anchor="ms-log">
          <header><h2 id="log-title">log tail</h2><span class="ms-live"><i />streaming</span></header>
          <ol class="ms-log" aria-live="polite">
            {state === 'empty' ? <li class="ms-muted">no events in the last 5 min · the bus is idle, not broken</li> : lines.map((line, index) => (
              <li key={`${line.t}-${index}`} class={`lvl-${line.level}`}><time>{line.t}</time><b>{line.level}</b><span>{line.source}</span><p>{line.text}</p></li>
            ))}
          </ol>
        </section>

        <AiSurface title={calm ? 'all quiet' : 'triage is ready · ligeiro log'} meta={calm ? 'no anomalies' : '18 dlq events'} anchor="ms-triage" className="ms-ai"
          sources={calm ? [] : [{ label: 'ligeiro changelog v2.14', score: 0.93 }, { label: 'dlq samples · 18', score: 0.9 }, { label: 'contract canonical.tracking.v3', score: 0.88 }]}
          actions={calm ? undefined : <><Link class="ai-approve ms-ai-link" href="/mare/ops/mesh/partners/ligeiro-log">review mapping</Link><Link class="ai-explain ms-ai-link" href="/mare/ops/mesh/dlq?modal=replay">replay dlq</Link></>}>
          {calm ? 'every circuit is closed and the dlq is empty. nothing needs you.' : 'ligeiro log started sending status x9 at 15:52. their changelog v2.14 says x9 means "delivery rescheduled". proposed: map x9 → delivery_exception.rescheduled, then replay the 18 parked events.'}
        </AiSurface>
      </div>
    </main>
  );
}
