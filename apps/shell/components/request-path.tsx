'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MINUTE, getWorld, type FaultId, type Topic, type World } from '@portfolio/world';
import { dbNodes, layerLabels, layers, links, nodeById, nodes, routes, scenarios, type Layer, type PathNode } from '@/lib/request-path';
import { useSimNow, useWorldState } from '@/lib/world';
import { WorldControls } from './world-controls';

const COL: Record<Layer, number> = { client: 80, edge: 255, bff: 440, middleware: 605, service: 760, database: 925, backbone: 1105, partner: 1325, observability: 0 };
const SAMPLE = 1_500;

type Box = { x: number; y: number; w: number; h: number };

function box(node: PathNode): Box {
  const w = node.w ?? (node.layer === 'middleware' ? 60 : 150);
  const h = node.h ?? (node.layer === 'middleware' ? 660 : 54);
  const x = node.layer === 'observability' ? node.x : COL[node.layer];
  const y = node.layer === 'middleware' ? 385 : node.y;
  return { x, y, w, h };
}

const anchor = (node: PathNode, side: 'in' | 'out', towardY?: number) => {
  const b = box(node);
  const x = side === 'out' ? b.x + b.w / 2 : b.x - b.w / 2;
  // The middleware band is tall: enter and leave it at the height of whatever it connects to.
  const y = node.layer === 'middleware' && towardY !== undefined ? towardY : b.y;
  return { x, y };
};

function linkPath(from: PathNode, to: PathNode) {
  if (from.layer === 'observability' && to.layer === 'observability') {
    const a = anchor(from, 'out');
    const b = anchor(to, 'in');
    return `M${a.x},${a.y} L${b.x},${b.y}`;
  }
  const a = anchor(from, 'out', box(to).y);
  const b = anchor(to, 'in', box(from).y);
  const mid = (a.x + b.x) / 2;
  return `M${a.x},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.x},${b.y}`;
}

/** One smooth path through every node on a route, for a packet to follow. */
function routePath(ids: string[]) {
  const list = ids.map(nodeById);
  let d = '';
  list.forEach((node, index) => {
    if (index === 0) {
      const start = anchor(node, 'out');
      d += `M${start.x},${start.y}`;
      return;
    }
    const prev = list[index - 1]!;
    const a = anchor(prev, 'out', box(node).y);
    const b = anchor(node, 'in', box(prev).y);
    const mid = (a.x + b.x) / 2;
    d += ` L${a.x},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.x},${b.y}`;
  });
  return d;
}

type Signals = { p95: number; throughput: number; errors: number; saturation: number };

const faultEffect: Partial<Record<FaultId, (node: PathNode, s: Signals) => Signals>> = {
  'db-pool': (node, s) => (node.id === 'orders' ? { ...s, p95: 900, saturation: 98, errors: 4.1 } : node.id === 'credit' ? { ...s, p95: 214, saturation: 91 } : node.id === 'networks' ? { ...s, p95: 240 } : s),
  'carrier-outage': (node, s) => (node.id === 'carriers' ? { ...s, errors: 38, p95: 2000, saturation: 88 } : node.id === 'dlq' ? { ...s, saturation: 64 } : s),
  'einvoice-fail': (node, s) => (node.id === 'tax' || node.id === 'invoicing' ? { ...s, errors: 45 } : node.id === 'dlq' ? { ...s, saturation: 58 } : s),
  'topic-lag': (node, s) => (node.id === 'kafka' || node.id === 'outbox' || node.id === 'notifications' ? { ...s, saturation: 93, p95: s.p95 * 6 } : s),
  'traffic-spike': (_node, s) => ({ ...s, saturation: Math.min(97, s.saturation * 1.8), p95: s.p95 * 1.4 })
};

/** Golden signals for a node at `now`: baseline, the world's traffic through it, then active faults. */
function signalsFor(node: PathNode, world: World, now: number): Signals {
  const touching = (Object.entries(routes) as Array<[Topic, string[]]>).filter(([, route]) => route.includes(node.id)).map(([topic]) => topic);
  const events = touching.length ? world.between(now - MINUTE, now, touching).length : 0;
  const wobble = 1 + Math.sin(now / 37_000 + node.id.length) * 0.06;
  let signals: Signals = { p95: Math.round(node.base.p95 * wobble), throughput: (events * SAMPLE) / 60, errors: node.base.errors, saturation: Math.round(node.base.saturation * wobble) };
  if (world.state.scenario === 'black-friday') signals = faultEffect['traffic-spike']!(node, signals);
  for (const fault of Object.keys(faultEffect) as FaultId[]) if (world.isFaulted(fault, now)) signals = faultEffect[fault]!(node, signals);
  return signals;
}

const rate = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k/s` : `${Math.round(value)}/s`);

type Packet = { id: number; d: string; topic: Topic; duration: number };

export function RequestPath() {
  const worldState = useWorldState();
  const now = useSimNow(1000);
  const [layer, setLayer] = useState<(typeof layers)[number]['id']>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState(scenarios[0]!.id);
  const [step, setStep] = useState(0);
  const [packets, setPackets] = useState<Packet[]>([]);
  const counter = useRef(0);
  const lastSpawn = useRef(0);
  const scenario = scenarios.find((item) => item.id === scenarioId)!;
  const current = scenario.steps[step]!;
  const lit = useMemo(() => new Set(scenario.steps.slice(0, step + 1).flatMap((item) => item.nodes)), [scenario, step]);
  const failed = new Set(current.failed ?? []);
  const show = layers.find((item) => item.id === layer)!.show;
  const paths = useMemo(() => Object.fromEntries((Object.entries(routes) as Array<[Topic, string[]]>).map(([topic, route]) => [topic, routePath(route)])), []);

  // Live packets: each world event travels its real route (throttled, capped, off under reduced motion).
  useEffect(() => {
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return getWorld().subscribe(({ events }) => {
      const nowMs = performance.now();
      const picked = events.filter((event) => paths[event.topic]).slice(-3);
      if (!picked.length || nowMs - lastSpawn.current < 280) return;
      lastSpawn.current = nowMs;
      setPackets((list) => [...list.slice(-20), ...picked.map((event) => ({ id: (counter.current += 1), d: paths[event.topic]!, topic: event.topic, duration: 2.6 + (counter.current % 5) * 0.2 }))]);
    });
  }, [paths]);

  const world = worldState ? getWorld() : null;
  const signals = useMemo(() => (world && now !== null ? Object.fromEntries(nodes.map((node) => [node.id, signalsFor(node, world, now)])) : {}), [world, now, worldState]);
  const selectedNode = selected ? nodeById(selected) : null;
  const hoveredNode = hovered ? nodeById(hovered) : null;
  const activeFault = scenario.fault ? worldState?.faults[scenario.fault]?.some((window) => window.until === undefined) : worldState?.scenario === 'black-friday' && scenario.blackFriday;

  const runLive = () => {
    const w = getWorld();
    if (scenario.blackFriday) w.setScenario(activeFault ? 'normal' : 'black-friday');
    else if (scenario.fault) w.setFault(scenario.fault, !activeFault);
  };

  const nodeClass = (node: PathNode) => [
    'rp-node', `layer-${node.layer}`,
    show(node.layer) ? '' : 'dim',
    lit.has(node.id) ? 'lit' : '',
    failed.has(node.id) || (signals[node.id]?.errors ?? 0) > 10 || (signals[node.id]?.saturation ?? 0) > 90 ? 'failed' : '',
    selected === node.id ? 'selected' : ''
  ].join(' ');

  return (
    <>
      <div className="rp-toolbar">
        <div className="sd-toggle" role="group" aria-label="Show layers" data-anchor="rp-layers">
          {layers.map((item) => <button key={item.id} type="button" aria-pressed={layer === item.id} onClick={() => setLayer(item.id)}>{item.label}</button>)}
        </div>
        <WorldControls anchor="rp-world" />
      </div>
      <section className="sd-stage rp-stage">
        <div className="rp-canvas" data-anchor="rp-diagram">
          <svg viewBox="0 0 1410 880" role="group" aria-label="Maré request path from clients through the edge, BFFs, middleware and services with their own databases, to the Kafka backbone and partner adapters, observed by an OpenTelemetry pipeline">
            {layerLabels.map((item) => <text key={item.layer} className={`rp-lane ${show(item.layer) ? '' : 'dim'}`} x={item.layer === 'middleware' ? 605 : item.x} y="34" textAnchor="middle">{item.label}</text>)}
            <text className={`rp-lane ${show('observability') ? '' : 'dim'}`} x="20" y="786">observability plane</text>
            <rect className={`rp-plane ${show('observability') ? '' : 'dim'}`} x="10" y="790" width="1390" height="70" rx="14" />
            {links.map(([from, to]) => {
              const a = nodeById(from);
              const b = nodeById(to);
              const visible = show(a.layer) && show(b.layer);
              return <path key={`${from}-${to}`} className={`rp-link ${visible ? '' : 'dim'} ${lit.has(from) && lit.has(to) ? 'lit' : ''}`} d={linkPath(a, b)} />;
            })}
            {/* Trace context flows from every hop into the collector. */}
            <path className={`rp-link otel ${show('observability') ? '' : 'dim'}`} d="M605,715 C605,780 470,760 470,800" />
            {dbNodes.map((db) => {
              const service = nodeById(db.of);
              return (
                <g key={db.id} className={`rp-db ${show('database') ? '' : 'dim'}`}>
                  <path className="rp-link db" d={`M${COL.service + 75},${service.y} L${COL.database - 75},${service.y}`} />
                  <rect x={COL.database - 75} y={service.y - 18} width="150" height="36" rx="18" />
                  <text x={COL.database} y={service.y + 4} textAnchor="middle">{db.label.length > 22 ? `${db.label.slice(0, 21)}…` : db.label}</text>
                </g>
              );
            })}
            {nodes.map((node) => {
              const b = box(node);
              if (node.layer === 'middleware') {
                const chain = ['auth scopes', 'idempotency keys', 'otel context', 'feature flags', 'circuit breakers', 'validation'];
                return (
                  <g key={node.id} className={nodeClass(node)} role="button" tabIndex={0} aria-label="Middleware chain: auth scopes, idempotency keys, OpenTelemetry context, feature flags, circuit breakers, validation" onClick={() => setSelected(node.id)} onKeyDown={(event) => event.key === 'Enter' && setSelected(node.id)} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(node.id)} onBlur={() => setHovered(null)}>
                    <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx="16" />
                    {chain.map((item, index) => <text key={item} className="rp-chain" x={b.x} y={b.y - b.h / 2 + 70 + index * 100} textAnchor="middle" transform={`rotate(-90 ${b.x} ${b.y - b.h / 2 + 70 + index * 100})`}>{item}</text>)}
                  </g>
                );
              }
              return (
                <g key={node.id} className={nodeClass(node)} role="button" tabIndex={0} aria-label={`${node.label}, ${node.sub}`} onClick={() => setSelected(node.id)} onKeyDown={(event) => event.key === 'Enter' && setSelected(node.id)} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(node.id)} onBlur={() => setHovered(null)}>
                  <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx="12" />
                  <text className="rp-label" x={b.x - b.w / 2 + 12} y={b.y - 4}>{node.label}</text>
                  <text className="rp-sub" x={b.x - b.w / 2 + 12} y={b.y + 13}>{node.sub.length > 24 ? `${node.sub.slice(0, 23)}…` : node.sub}</text>
                  {(signals[node.id]?.saturation ?? 0) > 0 && <rect className="rp-sat" x={b.x - b.w / 2 + 12} y={b.y + b.h / 2 - 7} width={(b.w - 24) * Math.min(1, (signals[node.id]?.saturation ?? 0) / 100)} height="3" rx="1.5" />}
                </g>
              );
            })}
            {packets.map((packet) => <circle key={packet.id} r="4.5" className={`rp-packet t-${packet.topic.split('.')[0]}`} style={{ offsetPath: `path('${packet.d}')`, animationDuration: `${packet.duration}s` }} onAnimationEnd={() => setPackets((list) => list.filter((item) => item.id !== packet.id))} />)}
            {hoveredNode && signals[hoveredNode.id] && <Tooltip node={hoveredNode} signals={signals[hoveredNode.id]!} />}
          </svg>
        </div>
        <aside className="sd-aside rp-aside" data-anchor="rp-panel">
          {selectedNode ? (
            <div className="sd-decision" role="region" aria-label={`${selectedNode.label} details`} data-anchor="rp-node-panel">
              <div className="sd-decision-head"><span className="tag">{selectedNode.layer}</span><button type="button" onClick={() => setSelected(null)} aria-label="Close details">×</button></div>
              <h2>{selectedNode.label}</h2>
              <p className="rp-sub-line">{selectedNode.sub}</p>
              {signals[selectedNode.id] && (
                <dl className="rp-signals">
                  <div><dt>p95</dt><dd>{signals[selectedNode.id]!.p95 ? `${signals[selectedNode.id]!.p95} ms` : '—'}</dd></div>
                  <div><dt>throughput</dt><dd>{rate(signals[selectedNode.id]!.throughput)}</dd></div>
                  <div><dt>errors</dt><dd>{signals[selectedNode.id]!.errors.toFixed(1)}%</dd></div>
                  <div><dt>saturation</dt><dd>{signals[selectedNode.id]!.saturation}%</dd></div>
                </dl>
              )}
              {selectedNode.db && <><h3>Its own database</h3><p><b>{selectedNode.db.tech}</b> · {selectedNode.db.why}</p></>}
              <h3>Decisions</h3>
              <ul>{selectedNode.decisions.map((item) => <li key={item}>{item}</li>)}</ul>
              {selectedNode.failures.length > 0 && <><h3>Failure modes</h3><ul>{selectedNode.failures.map((item) => <li key={item}>{item}</li>)}</ul></>}
            </div>
          ) : (
            <>
              <div className="rp-col">
              <div className="rp-scenarios" role="group" aria-label="Scenario replays" data-anchor="rp-scenarios">
                {scenarios.map((item) => <button key={item.id} type="button" aria-pressed={item.id === scenarioId} onClick={() => { setScenarioId(item.id); setStep(0); }}>{item.name}</button>)}
              </div>
              <span className="eyebrow">Replay · step {step + 1}/{scenario.steps.length}</span>
              <h2>{scenario.name}</h2>
              <p className="sd-narration" aria-live="polite" key={`${scenarioId}-${step}`}>{current.narration}</p>
              <button type="button" className="btn primary wide" onClick={() => setStep((step + 1) % scenario.steps.length)}>{step === scenario.steps.length - 1 ? 'Replay from start' : 'Next step'} →</button>
              {(scenario.fault || scenario.blackFriday) && (
                <button type="button" className={`btn wide ${activeFault ? 'danger' : ''}`} onClick={runLive} data-anchor="rp-run-live">{activeFault ? 'Recover · end the incident' : 'Run it live across the portfolio'}</button>
              )}
              </div>
              <div className="rp-col">
              <ol className="sd-timeline">{scenario.steps.map((item, index) => <li key={index} className={index < step ? 'done' : index === step ? 'now' : ''}><button type="button" onClick={() => setStep(index)}>{item.narration}</button></li>)}</ol>
              <div className="rp-links" data-anchor="rp-deep-links"><span>See it in the product</span>{scenario.links.map((link) => <a key={link.href} href={link.href}>{link.label} →</a>)}</div>
              </div>
            </>
          )}
        </aside>
      </section>
    </>
  );
}

function Tooltip({ node, signals }: { node: PathNode; signals: Signals }) {
  const b = box(node);
  const x = Math.min(1410 - 190, Math.max(10, b.x + b.w / 2 + 10));
  const y = node.layer === 'observability' ? b.y - 110 : Math.min(880 - 100, Math.max(10, b.y - 40));
  return (
    <g className="rp-tooltip" pointerEvents="none">
      <rect x={x} y={y} width="180" height="92" rx="10" />
      <text x={x + 12} y={y + 20} className="rp-tip-title">{node.label}</text>
      <text x={x + 12} y={y + 40}>p95 {signals.p95 ? `${signals.p95} ms` : '—'} · {rate(signals.throughput)}</text>
      <text x={x + 12} y={y + 58}>errors {signals.errors.toFixed(1)}%</text>
      <text x={x + 12} y={y + 76}>saturation {signals.saturation}%</text>
    </g>
  );
}
