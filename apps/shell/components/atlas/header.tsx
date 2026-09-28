'use client';

import { ZLink } from '@/components/zone-link';
import { usePlan } from './plan';

const tabs = [['Pipeline', '/atlas/pipeline'], ['Arena', '/atlas/arena'], ['Academy', '/atlas/academy'], ['Mentors', '/atlas/mentors/live'], ['Offers', '/atlas/offers']] as const;

export function AtlasHeader({ active }: { active: 'Pipeline' | 'Arena' | 'Academy' | 'Offers' | 'Mentors' | 'Welcome' }) {
  const [plan] = usePlan();
  return (
    <header className="at-nav" data-anchor="at-nav">
      <ZLink className="at-logo" href="/atlas/pipeline"><span aria-hidden="true" />atlas</ZLink>
      <nav aria-label="Atlas">{tabs.map(([label, href]) => <ZLink key={label} href={href} aria-current={label === active ? 'page' : undefined}>{label}</ZLink>)}</nav>
      <span className={`at-plan ${plan.toLowerCase()}`} data-anchor="at-plan">{plan}</span>
      <span className="at-avatar" aria-label="Signed in as Ian">IM</span>
    </header>
  );
}
