import { parseDiagram, type Diagram } from '@portfolio/story-diagram';
import mareBlackFriday from '../data/stories/mare-black-friday.json';
import mareOrders from '../data/stories/mare-orders.json';
import mareStorefront from '../data/stories/mare-storefront.json';
import metricsFlow from '../data/stories/metrics-flow.json';
import personalFlow from '../data/stories/personal-flow.json';

export const stories: Record<'metrics-flow' | 'personal-flow' | 'mare-orders' | 'mare-black-friday' | 'mare-storefront', Diagram> = {
  'metrics-flow': parseDiagram(metricsFlow),
  'personal-flow': parseDiagram(personalFlow),
  'mare-orders': parseDiagram(mareOrders),
  'mare-black-friday': parseDiagram(mareBlackFriday),
  'mare-storefront': parseDiagram(mareStorefront)
};

export type StoryId = keyof typeof stories;
