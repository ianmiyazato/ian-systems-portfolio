/**
 * Deterministic HTML/SVG rendering for story diagrams. Runs at build time (Astro) and in tests;
 * the browser gets static markup, and the player only toggles classes and starts animations.
 */
import { icons } from './icons';
import type { Diagram, StoryEdge, StoryNode } from './model';

export const VIEW_W = 1200;
const COL_W = VIEW_W / 12;
const GUTTER = 28;
const ROW_H = 196;
const NODE_H = 148;
const PAD = 22;
const INSET = 16;

/** Average glyph widths in em, measured on Bricolage Grotesque 700, Geist 400 and Geist Mono. */
const GLYPH = { label: 0.56, caption: 0.52, eng: 0.61 } as const;
const SIZE = { label: 22, caption: 17, eng: 15 } as const;
const LINE = { caption: 22, eng: 20 } as const;

export const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = (value: number) => Math.round(value * 10) / 10;

type Box = { x: number; y: number; w: number; h: number };

export function nodeBox(node: StoryNode): Box {
  return { x: (node.col - 1) * COL_W + GUTTER / 2, y: PAD + (node.row - 1) * ROW_H, w: node.span * COL_W - GUTTER, h: NODE_H };
}

export function viewHeight(rows: number) {
  return PAD * 2 + rows * ROW_H - (ROW_H - NODE_H);
}

/** Greedy word wrap by estimated width; throws when the text needs more lines than allowed. */
export function wrap(text: string, width: number, kind: keyof typeof GLYPH, maxLines: number, where: string): string[] {
  const perLine = Math.floor(width / (SIZE[kind] * GLYPH[kind]));
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= perLine) line = next;
    else {
      if (!line || word.length > perLine) throw new Error(`${where}: "${text}" does not fit (${perLine} characters per line)`);
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) throw new Error(`${where}: "${text}" does not fit in ${maxLines} line${maxLines > 1 ? 's' : ''} of ${perLine} characters`);
  return lines;
}

/** Anchors on the facing sides and a smooth cubic between them; packets follow this exact path. */
export function edgePath(from: Box, to: Box): string {
  const a = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
  const b = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
  const sameRow = Math.abs(a.y - b.y) < 1;
  const overlapX = from.x < to.x + to.w && to.x < from.x + from.w;
  if (sameRow || !overlapX) {
    // Horizontal first: leave from the side that faces the target.
    const forward = b.x > a.x;
    const x1 = forward ? from.x + from.w : from.x;
    const x2 = forward ? to.x - 6 : to.x + to.w + 6;
    if (sameRow) {
      const mid = (x1 + x2) / 2;
      return `M${r(x1)},${r(a.y)} C${r(mid)},${r(a.y)} ${r(mid)},${r(b.y)} ${r(x2)},${r(b.y)}`;
    }
    // Different rows: bend into the target's side.
    const bend = (x2 - x1) * 0.55;
    return `M${r(x1)},${r(a.y)} C${r(x1 + bend)},${r(a.y)} ${r(x2 - bend)},${r(b.y)} ${r(x2)},${r(b.y)}`;
  }
  // Stacked: leave from the bottom (or top) and enter the facing edge.
  const down = b.y > a.y;
  const y1 = down ? from.y + from.h : from.y;
  const y2 = down ? to.y - 6 : to.y + to.h + 6;
  const mid = (y1 + y2) / 2;
  return `M${r(a.x)},${r(y1)} C${r(a.x)},${r(mid)} ${r(b.x)},${r(mid)} ${r(b.x)},${r(y2)}`;
}

/** Server-rendered focus for step 1, so the page paints in its first state before any script runs. */
function focusClass(diagram: Diagram, id: string) {
  return diagram.steps[0]!.focus.includes(id) ? ' is-focus' : ' is-dim';
}

function focusSteps(diagram: Diagram, id: string) {
  return diagram.steps.flatMap((step, index) => (step.focus.includes(id) ? [index + 1] : [])).join(' ');
}

function renderEdge(diagram: Diagram, edge: StoryEdge, boxes: Map<string, Box>) {
  const d = edgePath(boxes.get(edge.from)!, boxes.get(edge.to)!);
  const id = escapeHtml(edge.id);
  return `<g class="sd-edge${focusClass(diagram, edge.id)}" data-id="${id}" data-kind="${edge.kind}" data-focus-steps="${focusSteps(diagram, edge.id)}">`
    + `<path class="sd-edge-line" data-path-for="${id}" d="${d}" marker-end="url(#${diagram.id}-arrow)"/>`
    + `<path class="sd-edge-hi" d="${d}" marker-end="url(#${diagram.id}-arrow-hi)"/>`
    + '</g>';
}

function tspans(lines: string[], x: number, y: number, lineHeight: number) {
  return lines.map((line, index) => `<tspan x="${x}" y="${y + index * lineHeight}">${escapeHtml(line)}</tspan>`).join('');
}

function renderNode(diagram: Diagram, node: StoryNode) {
  const box = nodeBox(node);
  const inner = box.w - INSET * 2;
  const where = `node ${node.id}`;
  const label = wrap(node.label, inner, 'label', 1, `${where} label`);
  const caption = wrap(node.caption, inner, 'caption', 2, `${where} caption`);
  const eng = wrap(node.engLabel, inner, 'eng', 2, `${where} engLabel`);
  return `<g class="sd-node${focusClass(diagram, node.id)}" data-id="${node.id}" data-tone="${node.tone}" data-focus-steps="${focusSteps(diagram, node.id)}" transform="translate(${r(box.x)} ${r(box.y)})">`
    + `<rect class="sd-ring" x="-7" y="-7" width="${box.w + 14}" height="${box.h + 14}" rx="25"/>`
    + `<rect class="sd-box" width="${box.w}" height="${box.h}" rx="18"/>`
    + `<path class="sd-icon" transform="translate(${INSET} 18) scale(1.25)" d="${icons[node.icon]}"/>`
    + `<text class="sd-label sd-plain" x="${INSET}" y="80" font-size="${SIZE.label}">${escapeHtml(label[0]!)}</text>`
    + `<text class="sd-caption sd-plain" font-size="${SIZE.caption}">${tspans(caption, INSET, 106, LINE.caption)}</text>`
    + `<text class="sd-eng" font-size="${SIZE.eng}">${tspans(eng, INSET, 106, LINE.eng)}</text>`
    + '</g>';
}

/** The diagram alone: a responsive SVG (viewBox only), edges under nodes, three reserved packets. */
export function renderDiagram(diagram: Diagram): string {
  const boxes = new Map(diagram.nodes.map((node) => [node.id, nodeBox(node)]));
  const height = viewHeight(diagram.rows);
  const id = diagram.id;
  const arrow = (suffix: string, className: string) => `<marker id="${id}-${suffix}" class="${className}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z"/></marker>`;
  const description = `${diagram.summary} ${diagram.steps.map((step, index) => `Step ${index + 1}, ${step.title}: ${step.caption}`).join(' ')}`;
  return `<svg class="sd-svg" viewBox="0 0 ${VIEW_W} ${height}" role="img" aria-labelledby="${id}-title ${id}-desc" data-diagram-svg preserveAspectRatio="xMidYMid meet">`
    + `<title id="${id}-title">${escapeHtml(diagram.title)}</title>`
    + `<desc id="${id}-desc">${escapeHtml(description)}</desc>`
    + `<defs>${arrow('arrow', 'sd-arrow')}${arrow('arrow-hi', 'sd-arrow-hi')}</defs>`
    + `<g class="sd-edges">${diagram.edges.map((edge) => renderEdge(diagram, edge, boxes)).join('')}</g>`
    + `<g class="sd-nodes">${diagram.nodes.map((node) => renderNode(diagram, node)).join('')}</g>`
    + '<g class="sd-packets" aria-hidden="true">'
    + [0, 1, 2].map(() => '<circle class="sd-packet" r="7" cx="0" cy="0"/>').join('')
    + '</g></svg>';
}

export type StoryOptions = { screen: string; eyebrow?: string; board?: string };

/** One screen: the diagram, the step rail, one caption per step (plain + engineering) and presenter notes. */
export function renderStory(diagram: Diagram, options: StoryOptions): string {
  const total = diagram.steps.length;
  const rail = diagram.steps.map((step, index) => `<li><button type="button" data-go="${index + 1}"${index === 0 ? ' aria-current="step"' : ''}><span class="sd-rail-n">${index + 1}</span><span class="sd-rail-t">${escapeHtml(step.title)}</span></button></li>`).join('');
  const captions = diagram.steps.map((step, index) => `<div class="sd-caption-block${index === 0 ? '' : ' is-off'}" data-step-only="${index + 1}"${index === 0 ? '' : ' aria-hidden="true"'}>`
    + `<p class="sd-step-kicker">Step ${index + 1} of ${total}</p>`
    + `<h3 class="sd-step-title">${escapeHtml(step.title)}</h3>`
    + `<p class="sd-step-caption">${escapeHtml(step.caption)}</p>`
    + `<p class="sd-step-eng"><span class="sd-eng-tag">Engineering</span>${escapeHtml(step.engineering)}</p>`
    + '</div>').join('');
  const notes = diagram.steps.map((step, index) => `<p data-note="${index + 1}">${escapeHtml(step.presenterNote)}</p>`).join('');
  return `<section class="sd-screen sd-story" data-screen="${escapeHtml(options.screen)}" data-steps="${total}" data-accent="${diagram.accent}" data-step="1"${options.board ? ` data-board="${escapeHtml(options.board)}"` : ''} aria-label="${escapeHtml(diagram.title)}">`
    + `<figure class="sd-figure" data-diagram>${renderDiagram(diagram)}</figure>`
    + '<div class="sd-panel">'
    + `<div class="sd-captions" aria-live="polite">${captions}</div>`
    + '<div class="sd-stepper">'
    + '<button type="button" class="sd-arrow-btn" data-cmd="prev" aria-label="Previous step">←</button>'
    + `<ol class="sd-rail" aria-label="Steps">${rail}</ol>`
    + '<button type="button" class="sd-arrow-btn" data-cmd="next" data-step-next aria-label="Next step">→</button>'
    + '</div></div>'
    + `<div class="sd-notes" aria-label="Presenter notes">${notes}</div>`
    + '</section>';
}

/** The deck toolbar: one per page. Hidden in presentation mode until the mouse moves. */
export function renderControls(): string {
  const toggle = (cmd: string, label: string, key: string) => `<button type="button" class="sd-toggle" data-cmd="${cmd}" aria-pressed="false">${label} <kbd>${key}</kbd></button>`;
  return '<div class="sd-controls" role="toolbar" aria-label="Story controls">'
    + '<button type="button" class="sd-arrow-btn" data-cmd="prev" aria-label="Previous step">←</button>'
    + '<span class="sd-progress" data-progress aria-live="off">Step 1</span>'
    + '<button type="button" class="sd-arrow-btn" data-cmd="next" aria-label="Next step">→</button>'
    + '<span class="sd-controls-sep" aria-hidden="true"></span>'
    + toggle('layer', 'Engineering', 'E')
    + toggle('pause', 'Pause', 'P')
    + toggle('notes', 'Notes', 'N')
    + toggle('present', 'Present', 'F')
    + '</div>';
}
