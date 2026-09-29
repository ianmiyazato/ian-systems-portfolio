import { describe, expect, it } from 'vitest';
import { findJargon, jargon, lintPlain } from '../src/jargon';
import { parseDiagram } from '../src/model';
import sample from './fixtures/sample.json';

describe('plain-language lint', () => {
  it('knows the words a non-technical founder stops on', () => {
    for (const word of ['kafka', 'idempotent', 'cdc', 'embedding', 'vector', 'schema', 'sql', 'partition', 'microservice', 'api', 'latency', 'p95']) expect(jargon).toContain(word);
    expect(jargon.length).toBeGreaterThan(20);
  });

  it('finds jargon as whole words, case-insensitively, including plurals', () => {
    expect(findJargon('Our API answers in time')).toEqual(['api']);
    expect(findJargon('Embeddings and a vector index')).toEqual(['embedding', 'vector']);
    expect(findJargon('Kept in a form built for fast totals')).toEqual([]);
    // Substrings are not words: "rapid" contains "api", "sequel" is not "sql".
    expect(findJargon('A rapid sequel')).toEqual([]);
  });

  it('passes a plain diagram and allows jargon in the engineering layer', () => {
    const diagram = parseDiagram(sample);
    expect(diagram.steps[2]!.engineering).toMatch(/SQL/);
    expect(lintPlain(diagram)).toEqual([]);
  });

  it('fails when a plain caption, label, title or presenter note uses jargon', () => {
    const diagram = parseDiagram(sample);
    diagram.steps[0]!.caption = 'Every system writes to Kafka every minute.';
    diagram.nodes[1]!.caption = 'schema checks';
    diagram.steps[1]!.presenterNote = 'We validate every partition.';
    const problems = lintPlain(diagram);
    expect(problems).toEqual([
      { where: 'node check · caption', words: ['schema'] },
      { where: 'step 1 · caption', words: ['kafka'] },
      { where: 'step 2 · presenterNote', words: ['partition'] }
    ]);
  });
});
