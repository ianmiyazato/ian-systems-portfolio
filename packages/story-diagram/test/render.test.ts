import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import { parseDiagram } from '../src/model';
import { renderDiagram, renderStory } from '../src/render';
import sample from './fixtures/sample.json';

const diagram = parseDiagram(sample);

function parse(html: string) {
  const window = new Window();
  window.document.body.innerHTML = html;
  return window.document;
}

/** The structure without coordinates: tag, class and data attributes, depth-first. */
function outline(node: Element, depth = 0): string[] {
  const attrs = [...node.attributes].filter((attr) => attr.name === 'class' || attr.name.startsWith('data-')).map((attr) => `${attr.name}=${attr.value}`).join(' ');
  return [`${'  '.repeat(depth)}${node.tagName.toLowerCase()} ${attrs}`.trimEnd(), ...[...node.children].flatMap((child) => outline(child, depth + 1))];
}

describe('renderDiagram', () => {
  it('is deterministic: the same model renders the same SVG', () => {
    expect(renderDiagram(diagram)).toBe(renderDiagram(parseDiagram(structuredClone(sample))));
  });

  it('matches the structural snapshot', () => {
    const svg = parse(renderDiagram(diagram)).querySelector('svg')!;
    expect(outline(svg as unknown as Element).join('\n')).toMatchSnapshot();
  });

  it('scales with a viewBox on a 12-column grid and never sets a pixel size', () => {
    const svg = parse(renderDiagram(diagram)).querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 1200 \d+$/);
    expect(svg.hasAttribute('width')).toBe(false);
    expect(svg.hasAttribute('height')).toBe(false);
  });

  it('marks every node and edge with the steps that focus it', () => {
    const doc = parse(renderDiagram(diagram));
    expect(doc.querySelector('[data-id="check"]')!.getAttribute('data-focus-steps')).toBe('2');
    expect(doc.querySelector('[data-id="source->check"]')!.getAttribute('data-focus-steps')).toBe('1');
    expect(doc.querySelector('[data-id="store"]')!.getAttribute('data-focus-steps')).toBe('3');
  });

  it('renders plain text at 16 units or more and keeps engineering text in its own layer', () => {
    const doc = parse(renderDiagram(diagram));
    for (const text of doc.querySelectorAll('.sd-plain')) expect(Number(text.getAttribute('font-size'))).toBeGreaterThanOrEqual(16);
    expect(doc.querySelectorAll('.sd-eng').length).toBe(diagram.nodes.length);
    expect(doc.querySelector('.sd-plain .sd-eng, .sd-eng.sd-plain')).toBeNull();
  });

  it('draws each edge once, with an id that packets can follow', () => {
    const doc = parse(renderDiagram(diagram));
    const paths = [...doc.querySelectorAll('.sd-edge path.sd-edge-line')];
    expect(paths.map((path) => path.getAttribute('data-path-for'))).toEqual(diagram.edges.map((edge) => edge.id));
    for (const path of paths) expect(path.getAttribute('d')).toMatch(/^M[\d.]+,[\d.]+ C/);
  });

  it('reserves at most three packets and hides them from assistive tech', () => {
    const doc = parse(renderDiagram(diagram));
    const packets = doc.querySelectorAll('.sd-packet');
    expect(packets.length).toBe(3);
    expect(doc.querySelector('.sd-packets')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('throws when a label will not fit its node', () => {
    const tooLong = parseDiagram({ ...structuredClone(sample), nodes: sample.nodes.map((node, index) => (index === 0 ? { ...node, label: 'Understanding all' } : node)) });
    expect(() => renderDiagram(tooLong)).toThrow(/does not fit/);
  });
});

describe('renderStory', () => {
  it('pairs the diagram with every step caption, engineering note and presenter note', () => {
    const doc = parse(renderStory(diagram, { screen: 'flow' }));
    const figure = doc.querySelector('[data-screen="flow"]')!;
    expect(figure.getAttribute('data-steps')).toBe('3');
    expect(doc.querySelectorAll('[data-step-only]').length).toBe(3);
    expect(doc.querySelectorAll('.sd-step-eng').length).toBe(3);
    expect(doc.querySelectorAll('[data-note]').length).toBe(3);
    expect(doc.querySelectorAll('.sd-rail button').length).toBe(3);
  });
});
