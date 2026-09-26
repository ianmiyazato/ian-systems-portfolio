'use client';

import { useMemo, useState } from 'react';
import { BaseEdge, Handle, Position, ReactFlow, getBezierPath, type Edge, type EdgeProps, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import type { ArchNode, Architecture } from '@/lib/architectures';

type NodeData = { arch: ArchNode; lit: boolean; failed: boolean; selected: boolean };
type EdgeData = { lit: boolean; label?: string };

function ArchNodeView({ data }: NodeProps<Node<NodeData>>) {
  const { arch, lit, failed, selected } = data;
  return (
    <div className={`sd-node kind-${arch.kind} ${lit ? 'lit' : ''} ${failed ? 'failed' : ''} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="sd-handle" />
      <span className="sd-kind">{arch.kind}</span>
      <strong>{arch.label}</strong>
      <small>{arch.sub}</small>
      <Handle type="source" position={Position.Right} className="sd-handle" />
    </div>
  );
}

/** Custom animated edge: packets travel along the same bezier the edge draws (CSS offset-path). */
function PacketEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<Edge<EdgeData>>) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const lit = Boolean(data?.lit);
  return (
    <>
      <BaseEdge id={id} path={path} className={`sd-edge ${lit ? 'lit' : ''}`} />
      {lit && [0, 1, 2].map((index) => <circle key={index} r="5" className="sd-packet" style={{ offsetPath: `path('${path}')`, animationDelay: `${index * -0.6}s` }} />)}
      {data?.label && <text x={labelX} y={labelY - 8} className="sd-edge-label" textAnchor="middle">{data.label}</text>}
    </>
  );
}

const nodeTypes = { arch: ArchNodeView };
const edgeTypes = { packet: PacketEdge };

export function SystemDesign({ arch }: { arch: Architecture }) {
  const [scenarioId, setScenarioId] = useState(arch.scenarios[0]!.id);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'event' | 'sync'>('event');
  const [selected, setSelected] = useState<string | null>(null);
  const scenario = arch.scenarios.find((item) => item.id === scenarioId)!;
  const current = scenario.steps[step]!;
  const seenNodes = useMemo(() => new Set(scenario.steps.slice(0, step + 1).flatMap((item) => item.nodes)), [scenario, step]);
  const seenEdges = useMemo(() => new Set(scenario.steps.slice(0, step + 1).flatMap((item) => item.edges)), [scenario, step]);
  const selectedNode = arch.nodes.find((node) => node.id === selected);

  const nodes: Node<NodeData>[] = arch.nodes.map((node) => ({
    id: node.id, type: 'arch', position: { x: node.x * 0.82, y: node.y * 1.5 }, draggable: false, connectable: false,
    data: { arch: node, lit: seenNodes.has(node.id), failed: Boolean(current.failed?.includes(node.id)), selected: selected === node.id }
  }));
  const edges: Edge<EdgeData>[] = arch.edges.map((edge) => ({ id: edge.id, source: edge.from, target: edge.to, type: 'packet', data: { lit: seenEdges.has(edge.id), label: edge.label } }));

  const pick = (id: string) => { setScenarioId(id); setStep(0); };
  const next = () => setStep((step + 1) % scenario.steps.length);

  return (
    <>
      <div className="sd-controls">
        <div className="sd-scenarios" role="group" aria-label="Scenarios" data-anchor="sd-scenarios">
          {arch.scenarios.map((item) => <button key={item.id} type="button" aria-pressed={item.id === scenarioId} onClick={() => pick(item.id)}>{item.name}</button>)}
        </div>
        <div className="sd-toggle" role="group" aria-label="Architecture" data-anchor="sd-toggle">
          <button type="button" aria-pressed={mode === 'event'} onClick={() => setMode('event')}>Event-driven</button>
          <button type="button" aria-pressed={mode === 'sync'} onClick={() => setMode('sync')}>Synchronous before</button>
        </div>
      </div>
      <section className="sd-stage">
        <div className="sd-canvas" data-anchor="sd-canvas" aria-label={`${arch.name} architecture diagram`}>
          {mode === 'event' ? (
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.12 }}
              nodesDraggable={false} nodesConnectable={false} elementsSelectable panOnDrag={false} zoomOnScroll={false} zoomOnPinch={false} zoomOnDoubleClick={false} preventScrolling={false}
              proOptions={{ hideAttribution: true }} onNodeClick={(_, node) => setSelected(node.id)} />
          ) : (
            <div className="sd-before" data-anchor="sd-before">
              <ol>{arch.before.nodes.map((node, index) => <li key={node.id} style={{ '--i': index } as React.CSSProperties}><span>{node.label}</span>{index < arch.before.nodes.length - 1 && <i aria-hidden="true">→</i>}</li>)}</ol>
              <p>{arch.before.failure}</p>
            </div>
          )}
        </div>
        <aside className="sd-aside" data-anchor="sd-timeline">
          {selectedNode ? (
            <div className="sd-decision" role="region" aria-label={`Decision for ${selectedNode.label}`}>
              <div className="sd-decision-head"><span className={`tag ${selectedNode.decision.tag.toLowerCase()}`}>{selectedNode.decision.tag}</span><button type="button" onClick={() => setSelected(null)} aria-label="Close node decision">×</button></div>
              <h2>{selectedNode.label}</h2>
              <dl><dt>Decision</dt><dd>{selectedNode.decision.decision}</dd><dt>Why</dt><dd>{selectedNode.decision.why}</dd><dt>Value</dt><dd>{selectedNode.decision.value}</dd></dl>
            </div>
          ) : (
            <>
              <span className="eyebrow">Now replaying · step {step + 1}/{scenario.steps.length}</span>
              <h2>{scenario.name}</h2>
              <p className="sd-narration" aria-live="polite" key={`${scenarioId}-${step}`}>{current.narration}</p>
              <button type="button" className="btn primary wide" onClick={next}>{step === scenario.steps.length - 1 ? 'Replay from start' : 'Next step'} →</button>
              <ol className="sd-timeline">
                {scenario.steps.map((item, index) => <li key={index} className={index < step ? 'done' : index === step ? 'now' : ''}><button type="button" onClick={() => setStep(index)}>{item.narration}</button></li>)}
              </ol>
              <div className="sd-inspect" role="group" aria-label="Inspect a component">
                <span>Inspect a component</span>
                {arch.nodes.map((node) => <button key={node.id} type="button" onClick={() => setSelected(node.id)}>{node.label}</button>)}
              </div>
            </>
          )}
        </aside>
      </section>
    </>
  );
}
