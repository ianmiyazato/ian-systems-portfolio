export * from './domain';
import { z } from 'zod';

export const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('order.created'), id: z.string(), channel: z.enum(['pickup', 'delivery']), occurredAt: z.string().datetime() }),
  z.object({ type: z.literal('carrier.degraded'), partner: z.string(), p95Ms: z.number().nonnegative(), occurredAt: z.string().datetime() }),
  z.object({ type: z.literal('campaign.moment'), market: z.enum(['LA', 'Seoul', 'Tokyo']), score: z.number().min(0).max(1), occurredAt: z.string().datetime() })
]);

export type PortfolioEvent = z.infer<typeof eventSchema>;

export const localEventChannel = (name = 'portfolio-events') =>
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(name);

