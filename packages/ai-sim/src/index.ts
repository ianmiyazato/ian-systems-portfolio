export type Chunk = { id: string; text: string; score: number; source: string };
export type AgentStep = { tool: string; input: string; output: string; latencyMs: number };
export type EvalResult = { faithfulness: number; citations: number; relevance: number; passed: boolean };

export interface AIProvider {
  retrieve(query: string, topK?: number): Promise<Chunk[]>;
  rerank(query: string, chunks: Chunk[]): Promise<Chunk[]>;
  generateStream(prompt: string): AsyncIterable<string>;
  runAgent(task: string): Promise<AgentStep[]>;
  judge(answer: string, chunks: Chunk[]): Promise<EvalResult>;
  runEval(scenarios: string[]): Promise<EvalResult[]>;
}

export const defaultCorpus: Chunk[] = [
  { id: 'carrier-cutoff', text: 'Rota Sul Express closes store collection at 17:00.', score: 0, source: 'carrier SLA · rev 12' },
  { id: 'stock-0412', text: 'Store 0412 has three pickup orders inside the risk window.', score: 0, source: 'ATP snapshot · 16:18' },
  { id: 'pulse-seoul', text: 'Seoul short-form completion rose after the chorus moment.', score: 0, source: 'market signal · Seoul' },
  { id: 'policy-44', text: 'Manual credit review is required for scores from 560 to 620.', score: 0, source: 'policy 44 · current' }
];

const tokenise = (text: string) => new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));

export class SimulatedProvider implements AIProvider {
  constructor(private readonly corpus: Chunk[] = defaultCorpus, private readonly answers: Record<string, string> = {}) {}

  async retrieve(query: string, topK = 3): Promise<Chunk[]> {
    const terms = tokenise(query);
    return this.corpus
      .map((chunk) => {
        const words = tokenise(chunk.text + ' ' + chunk.source);
        const overlap = [...terms].filter((term) => words.has(term)).length;
        const stable = [...chunk.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 13;
        return { ...chunk, score: Number((0.62 + overlap * 0.09 + stable / 1000).toFixed(3)) };
      })
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, topK);
  }

  async rerank(_query: string, chunks: Chunk[]): Promise<Chunk[]> {
    return [...chunks].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  }

  async *generateStream(prompt: string): AsyncIterable<string> {
    const response = this.answers[prompt.trim()] ?? `Based on retrieved evidence, ${prompt.trim()} can proceed with a guarded human approval.`;
    for (const token of response.split(' ')) yield `${token} `;
  }

  async runAgent(task: string): Promise<AgentStep[]> {
    return [
      { tool: 'retrieve_context', input: task, output: '4 policy and event records', latencyMs: 84 },
      { tool: 'check_guardrails', input: 'proposed action', output: 'within approval boundary', latencyMs: 31 },
      { tool: 'simulate_impact', input: 'approved action', output: 'no hard constraint violations', latencyMs: 126 },
      { tool: 'write_audit_note', input: task, output: 'draft ready', latencyMs: 42 }
    ];
  }

  async judge(answer: string, chunks: Chunk[]): Promise<EvalResult> {
    const result = { faithfulness: answer.length > 20 ? 0.94 : 0.61, citations: chunks.length ? 0.98 : 0.4, relevance: 0.92 };
    return { ...result, passed: result.faithfulness >= 0.9 && result.citations >= 0.9 };
  }

  async runEval(scenarios: string[]): Promise<EvalResult[]> {
    return Promise.all(scenarios.map(async (scenario) => this.judge(scenario, await this.retrieve(scenario))));
  }
}

export class LiveProvider implements AIProvider {
  private unavailable(): never { throw new Error('LiveProvider is server-only and requires GROQ_API_KEY and GEMINI_API_KEY.'); }
  retrieve(): Promise<Chunk[]> { return Promise.reject(this.unavailable()); }
  rerank(): Promise<Chunk[]> { return Promise.reject(this.unavailable()); }
  async *generateStream(): AsyncIterable<string> { this.unavailable(); }
  runAgent(): Promise<AgentStep[]> { return Promise.reject(this.unavailable()); }
  judge(): Promise<EvalResult> { return Promise.reject(this.unavailable()); }
  runEval(): Promise<EvalResult[]> { return Promise.reject(this.unavailable()); }
}


/* Provenance ------------------------------------------------------------------------------------ */

export type ProvenanceSource = { label: string; score?: number };
export type Provenance = {
  sources: ProvenanceSource[];
  tools: Array<{ tool: string; ms: number; output: string }>;
  route: string;
  evalScore: number;
  tokens: { input: number; output: number };
  cost: number;
};

const hash = (value: string) => [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);

/**
 * "How this was made" for any simulated AI card, deterministic per card: the same card always shows the
 * same tools, latencies, route, eval score, tokens and cost. Scoring cards route to a fine-tuned model;
 * long-form text escalates to the large model.
 */
export function provenanceFor(key: string, sources: ProvenanceSource[], route?: string): Provenance {
  const seed = hash(key);
  const long = key.length > 42 || /why|summary|pitch|brief|draft|root cause|what/i.test(key);
  const chosen = route ?? (long ? 'large · escalated: open-ended text' : `ft-${['pricing-v2', 'risk-v3', 'ops-v4', 'mesh-v1'][seed % 4]}`);
  const input = 900 + (seed % 2400);
  const output = long ? 180 + (seed % 220) : 40 + (seed % 60);
  const large = chosen.startsWith('large');
  return {
    sources: sources.length ? sources : [{ label: 'grounding corpus', score: 0.8 + (seed % 15) / 100 }],
    tools: [
      { tool: 'retrieve', ms: 30 + (seed % 40), output: `${Math.max(3, sources.length + 2)} chunks` },
      { tool: 'rerank', ms: 12 + (seed % 20), output: `top ${Math.max(1, sources.length)}` },
      { tool: 'guardrails', ms: 6 + (seed % 9), output: 'passed' },
      { tool: large ? 'generate · large' : `generate · ${chosen}`, ms: (large ? 620 : 140) + (seed % 260), output: `${output} tokens` }
    ],
    route: chosen,
    evalScore: Math.round((0.84 + (seed % 13) / 100) * 100) / 100,
    tokens: { input, output },
    cost: Math.round(((input / 1_000_000) * (large ? 3 : 0.4) + (output / 1_000_000) * (large ? 15 : 1.6)) * 10_000) / 10_000
  };
}
