/**
 * The presentation: eight screens across six pages, each step with a spoken note and a timing.
 * Diagram screens take their steps from the story model; the rest are written here.
 */
import { z } from 'zod';
import raw from '../data/deck.json';
import { stories, type StoryId } from './stories';

const stepSchema = z.object({ title: z.string().min(1), caption: z.string().optional(), presenterNote: z.string().min(1), seconds: z.number().int().min(5) });
const textSchema = z.object({ title: z.string(), plain: z.string(), engineering: z.string() });

const deckSchema = z.object({
  title: z.string(),
  problems: z.array(z.object({ id: z.enum(['a', 'b']), label: z.string(), title: z.string(), who: z.string(), bullets: z.array(z.string()).length(3), href: z.string(), cta: z.string() })).length(2),
  banner: z.string(),
  chips: z.object({ label: z.literal('Illustrative targets'), items: z.array(z.object({ value: z.string(), text: z.string() })) }),
  report: z.object({ headline: z.string(), cause: z.string(), suggestion: z.string(), sources: z.array(z.string()).min(1), honesty: z.array(textSchema).length(3) }),
  race: z.object({
    label: z.literal('Illustrative targets'),
    axis: z.number(),
    lanes: z.array(z.object({
      id: z.string(),
      title: z.string(),
      segments: z.array(z.object({ label: z.string(), from: z.number(), to: z.number(), background: z.boolean().optional() })),
      result: z.object({ at: z.number(), text: z.string() })
    })).length(2)
  }),
  techniques: z.array(textSchema).length(4),
  bridge: z.object({ seconds: z.number(), points: z.array(z.string()).length(3) }),
  screens: z.array(z.object({
    id: z.string(),
    board: z.string(),
    href: z.string(),
    title: z.string(),
    diagram: z.string().optional(),
    seconds: z.array(z.number()).optional(),
    steps: z.array(stepSchema).optional()
  })),
  questions: z.array(z.string()).length(4)
});

export type DeckStep = z.infer<typeof stepSchema>;
export type Screen = { id: string; board: string; href: string; title: string; diagram?: StoryId; steps: DeckStep[] };

function resolve() {
  const parsed = deckSchema.parse(raw);
  const screens: Screen[] = parsed.screens.map((screen) => {
    if (!screen.diagram) return { ...screen, diagram: undefined, steps: screen.steps ?? [] };
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

export const deck = resolve();

export function screensOn(href: string): Screen[] {
  return deck.screens.filter((screen) => screen.href === href);
}

export function screenById(id: string): Screen {
  const screen = deck.screens.find((item) => item.id === id);
  if (!screen) throw new Error(`unknown screen ${id}`);
  return screen;
}

/** Pages in presentation order with their total steps; the player crosses pages with it. */
export function presentationSequence(): Array<{ href: string; steps: number }> {
  const pages: Array<{ href: string; steps: number }> = [];
  for (const screen of deck.screens) {
    const last = pages.at(-1);
    if (last?.href === screen.href) last.steps += screen.steps.length;
    else pages.push({ href: screen.href, steps: screen.steps.length });
  }
  return pages;
}
