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

