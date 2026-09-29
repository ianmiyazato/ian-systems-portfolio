import { parseDiagram, type Diagram } from '@portfolio/story-diagram';
import mareOrders from '../data/stories/mare-orders.json';
import metricsFlow from '../data/stories/metrics-flow.json';
import personalFlow from '../data/stories/personal-flow.json';

export const stories: Record<'metrics-flow' | 'personal-flow' | 'mare-orders', Diagram> = {
  'metrics-flow': parseDiagram(metricsFlow),
  'personal-flow': parseDiagram(personalFlow),
  'mare-orders': parseDiagram(mareOrders)
};

export type StoryId = keyof typeof stories;
