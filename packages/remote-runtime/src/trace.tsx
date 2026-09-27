import { getWorld, traceIdOf, type WorldEvent } from '@portfolio/world';

export type OpsSystem = 'counter' | 'product-hub' | 'pay' | 'circle' | 'mesh';

/** Tidewatch lives in the shell zone; traces made in the browser open through its "live" page. */
export const traceHref = (event: Pick<WorldEvent, 'id'>) => `/observability/traces/live?id=${traceIdOf(event.id)}`;

/** Record a consequential action as action.performed and return the link to its trace. */
export function recordAction(system: OpsSystem, action: string, summary: string, actor = 'you') {
  const event = getWorld().record({ topic: 'action.performed', key: `${system}:${action}`, payload: { system, action, summary, actor } });
  return traceHref(event);
}

/** The small "View trace" link every success toast and banner carries (a plain anchor: another zone). */
export function TraceLink({ href, class: className = 'trace-link' }: { href: string; class?: string }) {
  return <a class={className} href={href}>View trace</a>;
}
