/**
 * v0.1 tags (Frontend, Backend, Data, AI) stay valid; v0.2 adds the four review lenses
 * (Design, UX, Architecture, Engineering) and Free-tier for choices made for cost reasons.
 */
export const decisionTags = ['Frontend', 'Backend', 'Data', 'AI', 'Design', 'UX', 'Architecture', 'Engineering', 'Free-tier'] as const;
export type DecisionTag = (typeof decisionTags)[number];

/** A screen must explain both what people see and how the system behind it works. */
const experienceTags: DecisionTag[] = ['Frontend', 'Design', 'UX'];
const systemTags: DecisionTag[] = ['Backend', 'Architecture', 'Engineering', 'Data', 'Free-tier'];

export type Decision = {
  id: string;
  /** CSS selector, normally a [data-anchor="…"] attribute, that the hotspot pins to. */
  anchor: string;
  tag: DecisionTag;
  decision: string;
  why: string;
  alternative: string;
  value: string;
};

const loaders = import.meta.glob<Decision[]>('../../../decisions/*.json', { import: 'default' });

export function hasDecisions(screenId: string) {
  return `../../../decisions/${screenId}.json` in loaders;
}

export async function loadDecisions(screenId: string): Promise<Decision[]> {
  const load = loaders[`../../../decisions/${screenId}.json`];
  return load ? load() : [];
}

/** Returns human-readable problems; an empty list means the file satisfies the lens contract. */
export function validateDecisions(screenId: string, decisions: unknown): string[] {
  if (!Array.isArray(decisions)) return [`${screenId}: decisions must be an array`];
  const problems: string[] = [];
  if (decisions.length < 4) problems.push(`${screenId}: needs at least 4 decisions, has ${decisions.length}`);
  const ids = new Set<string>();
  for (const [index, item] of decisions.entries()) {
    const entry = item as Partial<Decision>;
    for (const key of ['id', 'anchor', 'tag', 'decision', 'why', 'alternative', 'value'] as const) {
      if (typeof entry[key] !== 'string' || entry[key]!.trim() === '') problems.push(`${screenId}[${index}]: missing ${key}`);
    }
    if (entry.tag && !decisionTags.includes(entry.tag)) problems.push(`${screenId}[${index}]: unknown tag ${entry.tag}`);
    if (entry.id) {
      if (ids.has(entry.id)) problems.push(`${screenId}: duplicate id ${entry.id}`);
      ids.add(entry.id);
    }
  }
  const tags = new Set(decisions.map((item) => (item as Decision).tag));
  if (!experienceTags.some((tag) => tags.has(tag)) || !systemTags.some((tag) => tags.has(tag))) problems.push(`${screenId}: must mix an experience decision (${experienceTags.join('/')}) with a system decision (${systemTags.join('/')})`);
  if (tags.size < 3) problems.push(`${screenId}: must span at least three tags`);
  return problems;
}
