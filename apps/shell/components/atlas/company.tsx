'use client';

import { ZLink } from '@/components/zone-link';
import { members, velocity } from '@/lib/atlas';
import { AtlasHeader } from './header';
import { usePlan } from './plan';

export function Company() {
  const [plan] = usePlan();
  const pro = plan === 'Pro';
  const max = Math.max(...velocity.map(([, hires]) => hires));
  return (
    <>
      <AtlasHeader active="Pipeline" />
      <main className="at-main">
        <header className="at-head at-company-head" data-anchor="at-company-head">
          <span className="at-logo-mark" aria-hidden="true">PP</span>
          <div><span className="at-eyebrow">Fintech · 240 people · Remote-first</span><h1>Parallax Pay</h1></div>
          <div className="at-actions"><button type="button" className="at-btn">Follow</button><ZLink className="at-btn primary" href="/atlas/pipeline/board?drawer=parallax-pay">Your application</ZLink></div>
        </header>
        <div className="at-grid">
          <section className="at-card span-2" aria-labelledby="velocity-title" data-anchor="at-velocity">
            <h2 id="velocity-title">Hiring velocity · engineering</h2>
            <div className="at-bars" role="img" aria-label="Engineering hires per month rising from 3 in April to 8 in September; days to offer falling from 34 to 19">
              {velocity.map(([month, hires, days], index) => (
                <div key={month} style={{ '--h': hires / max, '--i': index } as React.CSSProperties}><i /><b>{hires}</b><span>{month}</span><small>{days}d</small></div>
              ))}
            </div>
            <p className="at-muted">Hires per month · days from first call to offer underneath.</p>
          </section>
          <section className="at-card" aria-labelledby="roles-title" data-anchor="at-roles">
            <h2 id="roles-title">Open roles</h2>
            <ul className="at-list"><li><strong>Senior engineer, payments</strong><small>Remote · $170–200k</small></li><li><strong>Staff engineer, risk</strong><small>Remote · $200–230k</small></li><li><strong>Engineering manager</strong><small>São Paulo · hybrid</small></li></ul>
          </section>
          <section className={`at-card span-2 at-locked ${pro ? 'unlocked' : ''}`} aria-labelledby="loop-title" data-anchor="at-loop-intel">
            <h2 id="loop-title">Interview loop intelligence</h2>
            <div className="at-loop" aria-hidden={!pro}>
              {[['Recruiter', '30 min', '92% pass'], ['Tech screen', 'System design · 60 min', '48% pass'], ['Onsite', '4 rounds incl. ledger design', '37% pass'], ['Offer', 'Median 11 days after onsite', '']].map(([stage, detail, rate]) => <div key={stage}><strong>{stage}</strong><span>{detail}</span><b>{rate}</b></div>)}
            </div>
            {!pro && (
              <div className="at-lock" data-anchor="at-lock">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                <strong>Pro · loop stages, pass rates and what they ask</strong>
                <ZLink className="at-btn primary" href="/atlas/academy/designing-for-10x?modal=paywall">Upgrade to Pro</ZLink>
              </div>
            )}
          </section>
          <section className="at-card" aria-labelledby="members-title" data-anchor="at-members">
            <h2 id="members-title">Members hired here</h2>
            <ul className="at-members">{members.map(([initials, name, role]) => <li key={name}><span className="at-av">{initials}</span><div><strong>{name}</strong><small>{role}</small></div></li>)}</ul>
          </section>
          <section className="at-card span-3" aria-labelledby="history-title" data-anchor="at-history">
            <h2 id="history-title">Your history with Parallax Pay</h2>
            <ol className="at-timeline horizontal"><li className="done"><b>Mar 2025</b>Applied · no reply</li><li className="done"><b>Sep 2</b>Applied with referral</li><li className="done"><b>Sep 18</b>Tech screen</li><li className="now"><b>Thu</b>Onsite</li></ol>
          </section>
        </div>
      </main>
    </>
  );
}
