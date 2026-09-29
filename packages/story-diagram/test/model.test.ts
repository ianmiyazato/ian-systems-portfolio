import { describe, expect, it } from 'vitest';
import { diagramSchema, parseDiagram, type DiagramInput } from '../src/model';
import sample from './fixtures/sample.json';

const clone = (): DiagramInput => structuredClone(sample) as DiagramInput;
const issues = (input: unknown) => {
  const result = diagramSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('story model', () => {
  it('accepts a valid diagram and fills defaults', () => {
    const diagram = parseDiagram(sample);
    expect(diagram.nodes[0]!.span).toBe(2);
    expect(diagram.edges[0]!.kind).toBe('flow');
    expect(diagram.edges[0]!.id).toBe('source->check');
  });

  it('rejects an edge that points at a node that does not exist', () => {
    const input = clone();
    input.edges.push({ from: 'store', to: 'nowhere' });
    expect(issues(input).join('\n')).toMatch(/edge store->nowhere.*"nowhere"/);
  });

  it('rejects a step that focuses an id that does not exist', () => {
    const input = clone();
    input.steps[0]!.focus.push('ghost');
    expect(issues(input).join('\n')).toMatch(/step 1 focuses "ghost"/);
  });

  it('requires both a plain and an engineering label on every node', () => {
    const input = clone();
    (input.nodes[1] as { engLabel?: string }).engLabel = '';
    expect(issues(input).length).toBeGreaterThan(0);
    const missing = clone();
    delete (missing.nodes[2] as { label?: string }).label;
    expect(issues(missing).length).toBeGreaterThan(0);
  });

  it('caps plain captions at 140 characters and engineering notes at 200', () => {
    const input = clone();
    input.steps[0]!.caption = 'word '.repeat(29).trim();
    expect(issues(input).join('\n')).toMatch(/140/);
    const engineering = clone();
    engineering.steps[0]!.engineering = 'x'.repeat(201);
    expect(issues(engineering).join('\n')).toMatch(/200/);
  });

  it('keeps presenter notes to one or two spoken sentences', () => {
    const input = clone();
    input.steps[0]!.presenterNote = 'One. Two. Three.';
    expect(issues(input).join('\n')).toMatch(/1–2 sentences/);
  });

  it('rejects nodes that overlap on the grid or spill past column 12', () => {
    const overlap = clone();
    overlap.nodes.push({ id: 'twin', label: 'Twin', caption: 'same place', engLabel: 'dup', icon: 'file', col: 2, row: 1 });
    expect(issues(overlap).join('\n')).toMatch(/overlap/);
    const spill = clone();
    spill.nodes[3]!.col = 12;
    expect(issues(spill).join('\n')).toMatch(/column 12/);
  });

  it('rejects duplicate ids', () => {
    const input = clone();
    input.nodes.push({ ...input.nodes[0]!, row: 2, col: 7 });
    expect(issues(input).join('\n')).toMatch(/duplicate/);
  });
});
