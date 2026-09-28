'use client';

import { usePathname } from 'next/navigation';
import { ZLink } from '@/components/zone-link';
import { LiveControl } from '@/components/live';
import { useDemoState } from '@/components/overlay';
import { useProblems } from '@/lib/tidewatch';

const items = [['Problems', '/observability'], ['Traces', '/observability/traces/9f3a2c'], ['Logs', '/observability/logs'], ['SLOs', '/observability/slos'], ['AI audit', '/observability/ai-audit']] as const;

export function TidewatchNav() {
  const path = usePathname();
  const state = useDemoState();
  const problems = useProblems().filter((problem) => problem.endedAt === undefined).length;
  const open = state === 'empty' || state === 'loading' ? 0 : problems;
  const current = (href: string) => (href === '/observability' ? path === '/observability' : path.startsWith(href.split('/').slice(0, 3).join('/')));
  return (
    <header className="tw-nav" data-anchor="tw-nav">
      <ZLink className="tw-logo" href="/observability"><span aria-hidden="true" />tidewatch</ZLink>
      <nav aria-label="Tidewatch" data-shortcut-nav>
        {items.map(([label, href]) => (
          <ZLink key={href} href={href} aria-current={current(href) ? 'page' : undefined}>{label}{label === 'Problems' && open > 0 && <b className="tw-count">{open}</b>}</ZLink>
        ))}
      </nav>
      <span className="tw-env">maré · production · otel</span>
      <LiveControl anchor="tw-live" />
    </header>
  );
}
