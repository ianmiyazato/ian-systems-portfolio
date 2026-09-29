/**
 * The story model: nodes on a 12-column grid, edges between them, and an ordered list of steps
 * that each focus one idea. Validated with Zod at build time and in tests; the browser only
 * receives the rendered SVG, never this schema.
 */
import { z } from 'zod';
import { iconNames } from './icons';

export const accents = { a: '#3553FF', b: '#E4572E' } as const;
export type Accent = keyof typeof accents;

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter((part) => part.trim().length > 0).length;

export const nodeSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'node ids are kebab-case'),
  /** Plain label, one short line. */
  label: z.string().min(1).max(18),
  /** Plain caption under the label, up to two short lines. */
  caption: z.string().min(1).max(44),
  /** Engineering label, shown instead of the caption in the engineering layer. */
  engLabel: z.string().min(1).max(40),
  icon: z.enum(iconNames),
  /** Grid position: first column (1–12), span in columns, and row. */
  col: z.number().int().min(1).max(12),
  span: z.number().int().min(2).max(12).default(2),
  row: z.number().int().min(1).max(6),
  /** accent = the problem's color, good = safe outcome, giveup = what we trade away. */
  tone: z.enum(['ink', 'accent', 'good', 'giveup']).default('ink')
});

export const edgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  kind: z.enum(['flow', 'data', 'ai']).default('flow')
}).transform((edge) => ({ ...edge, id: `${edge.from}->${edge.to}` }));

export const stepSchema = z.object({
  title: z.string().min(1).max(40),
  focus: z.array(z.string()).min(1),
  caption: z.string().min(1).max(140, 'plain captions are at most 140 characters'),
  engineering: z.string().min(1).max(200, 'engineering notes are at most 200 characters'),
  presenterNote: z.string().min(1).refine((text) => sentences(text) <= 2, 'presenter notes are 1–2 sentences')
});

export const diagramSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  title: z.string().min(1),
  /** One sentence for screen readers: what the whole diagram shows. */
  summary: z.string().min(1),
  accent: z.enum(['a', 'b']),
  rows: z.number().int().min(1).max(6),
  nodes: z.array(nodeSchema).min(1),
  edges: z.array(edgeSchema),
  steps: z.array(stepSchema).min(1)
}).superRefine((diagram, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  const nodeIds = new Set<string>();
  for (const node of diagram.nodes) {
    if (nodeIds.has(node.id)) issue(`duplicate node id "${node.id}"`);
    nodeIds.add(node.id);
    if (node.col + node.span - 1 > 12) issue(`node ${node.id} spills past column 12`);
    if (node.row > diagram.rows) issue(`node ${node.id} is on row ${node.row} but the diagram has ${diagram.rows}`);
  }
  for (const [index, a] of diagram.nodes.entries()) {
    for (const b of diagram.nodes.slice(index + 1)) {
      if (a.row === b.row && a.col < b.col + b.span && b.col < a.col + a.span) issue(`nodes ${a.id} and ${b.id} overlap on row ${a.row}`);
    }
  }
  const edgeIds = new Set<string>();
  for (const edge of diagram.edges) {
    for (const end of [edge.from, edge.to]) if (!nodeIds.has(end)) issue(`edge ${edge.id} references "${end}", which is not a node`);
    if (edgeIds.has(edge.id)) issue(`duplicate edge ${edge.id}`);
    edgeIds.add(edge.id);
  }
  for (const [index, step] of diagram.steps.entries()) {
    for (const id of step.focus) if (!nodeIds.has(id) && !edgeIds.has(id)) issue(`step ${index + 1} focuses "${id}", which is neither a node nor an edge`);
  }
});

export type DiagramInput = z.input<typeof diagramSchema>;
export type Diagram = z.output<typeof diagramSchema>;
export type StoryNode = Diagram['nodes'][number];
export type StoryEdge = Diagram['edges'][number];
export type StoryStep = Diagram['steps'][number];

/** Parses and validates; throws a readable error listing every problem. */
export function parseDiagram(input: unknown): Diagram {
  const result = diagramSchema.safeParse(input);
  if (!result.success) throw new Error(`Invalid story diagram:\n${result.error.issues.map((issue) => `- ${issue.path.join('.') || '(diagram)'}: ${issue.message}`).join('\n')}`);
  return result.data;
}
