import { parseDiagram, type Diagram } from '@portfolio/story-diagram';
import metricsFlow from '../data/stories/metrics-flow.json';
import personalFlow from '../data/stories/personal-flow.json';

export const stories: Record<'metrics-flow' | 'personal-flow', Diagram> = {
  'metrics-flow': parseDiagram(metricsFlow),
  'personal-flow': parseDiagram(personalFlow)
};

export type StoryId = keyof typeof stories;
