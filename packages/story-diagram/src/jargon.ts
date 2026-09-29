/**
 * The plain-language lint. These words stop a non-technical founder mid-sentence, so they may
 * appear only in the engineering layer (node engLabel, step engineering).
 */
import type { Diagram } from './model';

export const jargon = [
  'kafka', 'idempotent', 'idempotency', 'cdc', 'embedding', 'vector', 'schema', 'sql', 'partition', 'microservice',
  'api', 'latency', 'p95', 'p99', 'dlq', 'bff', 'etl', 'llm', 'rag', 'otel', 'opentelemetry', 'throughput',
  'backpressure', 'shard', 'replica', 'columnar', 'cursor', 'virtualization', 'prefetch', 'endpoint', 'webhook',
  'sdk', 'cdn', 'ssr', 'csv', 'json', 'inference', 'orm', 'olap', 'kubernetes', 'redis', 'postgres'
] as const;

const patterns = jargon.map((word) => [word, new RegExp(`\\b${word}(s|es|ed|ing)?\\b`, 'i')] as const);

/** Jargon words found in `text`, in list order, once each. */
export function findJargon(text: string): string[] {
  return patterns.filter(([, pattern]) => pattern.test(text)).map(([word]) => word);
}

export type LintProblem = { where: string; words: string[] };

export function lintText(where: string, text: string): LintProblem[] {
  const words = findJargon(text);
  return words.length ? [{ where, words }] : [];
}

/** Every plain-layer string in a diagram: node labels and captions, step titles, captions and presenter notes. */
export function lintPlain(diagram: Diagram): LintProblem[] {
  return [
    ...diagram.nodes.flatMap((node) => [...lintText(`node ${node.id} · label`, node.label), ...lintText(`node ${node.id} · caption`, node.caption)]),
    ...diagram.steps.flatMap((step, index) => [
      ...lintText(`step ${index + 1} · title`, step.title),
      ...lintText(`step ${index + 1} · caption`, step.caption),
      ...lintText(`step ${index + 1} · presenterNote`, step.presenterNote)
    ])
  ];
}
