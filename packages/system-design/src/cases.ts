/**
 * v0.4 system design cases: one system, one backend and one frontend problem, each told as a
 * story, a plan and a business decision. Maré is the pilot; Atlas and Pulse follow the same
 * schema (issue #55). Content lives in data/cases/<system>.json.
 */
import { z } from 'zod';
import mare from '../data/cases/mare.json';
import { stories, type StoryId } from './stories';
import type { DeckStep, Screen } from './deck';

const stepSchema = z.object({ title: z.string().min(1).max(40), caption: z.string().min(1).max(140), presenterNote: z.string().min(1), seconds: z.number().int().min(15) });
const range = z.object({ min: z.number(), max: z.number(), step: z.number().positive(), value: z.number() }).refine((r) => r.min <= r.value && r.value <= r.max, 'value must sit inside min–max');
const decisionSchema = z.object({
  decision: z.string().min(1),
  alternative: z.string().min(1),
  why: z.string().min(1),
  changes: z.array(z.string()).min(3),
  giveUp: z.array(z.string()).min(3),
  wrong: z.array(z.string()).min(2)
});

const caseSchema = z.object({
  system: z.enum(['mare', 'atlas', 'pulse']),
  name: z.string(),
  kind: z.string(),
  href: z.string().startsWith('/system-design/'),
  doc: z.string().url(),
  title: z.string(),
  lede: z.string(),
  context: z.array(z.object({ label: z.string(), text: z.string() })).length(3),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
  problems: z.array(z.object({
    id: z.enum(['backend', 'frontend']),
    accent: z.enum(['a', 'b']),
    label: z.string(),
    title: z.string(),
    question: z.string(),
    bullets: z.array(z.string()).length(3),
    href: z.string(),
    cta: z.string()
  })).length(2),
  ladder: z.object({
    label: z.literal('Illustrative triggers'),
    levels: z.array(z.object({ level: z.string(), name: z.string(), off: z.string(), notice: z.string(), trigger: z.string() })).length(5)
  }),
  worth: z.object({ label: z.literal('Illustrative inputs'), perMinute: range, minutes: range, without: range, with: z.number(), cost: range }),
  decisions: z.object({ backend: decisionSchema, frontend: decisionSchema }),
  concepts: z.array(z.object({ title: z.string(), line: z.string() })).min(5).max(10),
  screens: z.array(z.object({
    id: z.string(),
    board: z.string(),
    href: z.string(),
    title: z.string(),
    diagram: z.string().optional(),
    seconds: z.array(z.number().int().min(15)).optional(),
    steps: z.array(stepSchema).optional()
  })),
  bridge: z.object({ seconds: z.number().int(), points: z.array(z.string()).length(3) })
});

export type CaseData = z.infer<typeof caseSchema>;
export type Case = Omit<CaseData, 'screens'> & { screens: Screen[] };

function resolve(raw: unknown): Case {
  const parsed = caseSchema.parse(raw);
  const screens: Screen[] = parsed.screens.map((screen) => {
    if (!screen.diagram) return { ...screen, diagram: undefined, steps: (screen.steps ?? []) as DeckStep[] };
    const diagram = stories[screen.diagram as StoryId];
    if (!diagram) throw new Error(`screen ${screen.id} names unknown diagram ${screen.diagram}`);
    if (screen.seconds?.length !== diagram.steps.length) throw new Error(`screen ${screen.id} needs one timing per diagram step`);
    return {
      ...screen,
      diagram: screen.diagram as StoryId,
      steps: diagram.steps.map((step, index) => ({ title: step.title, caption: step.caption, presenterNote: step.presenterNote, seconds: screen.seconds![index]! }))
    };
  });
  return { ...parsed, screens };
}

export const cases = { mare: resolve(mare) } as const;
export type CaseId = keyof typeof cases;

export function caseScreenById(id: string): Screen | undefined {
  for (const item of Object.values(cases)) {
    const screen = item.screens.find((candidate) => candidate.id === id);
    if (screen) return screen;
  }
  return undefined;
}

/** The case's presentation run: its pages in order with their step counts. */
export function caseSequence(id: CaseId): Array<{ href: string; steps: number }> {
  const pages: Array<{ href: string; steps: number }> = [];
  for (const screen of cases[id].screens) {
    const last = pages.at(-1);
    if (last?.href === screen.href) last.steps += screen.steps.length;
    else pages.push({ href: screen.href, steps: screen.steps.length });
  }
  return pages;
}

export type Worth = { without: number; with: number; avoided: number; cost: number; worth: boolean };

/**
 * Expected sales lost to an outage, with and without readiness:
 * chance of the outage × minutes down × sales per minute at the peak.
 */
export function expectedLoss(input: { perMinute: number; minutes: number; without: number; with: number; cost: number }): Worth {
  const loss = (chance: number) => Math.round((chance / 100) * input.minutes * input.perMinute);
  const without = loss(input.without);
  const withReadiness = loss(Math.min(input.with, input.without));
  const avoided = without - withReadiness;
  return { without, with: withReadiness, avoided, cost: input.cost, worth: avoided > input.cost };
}
