import { edges, nodes, pathFor } from './data';

export function Tile() {
  return (
    <div class="ms-tile">
      <small>integrations console · lowercase mono</small>
      <strong>1 circuit half-open</strong>
      <svg viewBox="0 0 1000 420" aria-hidden="true">
        {edges.map((edge) => <path key={edge.to + edge.from} class={`edge ${edge.health}`} d={pathFor(edge)} />)}
        {edges.map((edge, index) => <circle key={`p${index}`} r="7" class={`packet ${edge.health}`} style={{ offsetPath: `path('${pathFor(edge)}')`, animationDelay: `${index * -0.4}s` }} />)}
        {nodes.map((node) => <rect key={node.id} x={node.x - 60} y={node.y - 18} width="120" height="36" rx="6" class={`node ${node.health}`} />)}
      </svg>
    </div>
  );
}
