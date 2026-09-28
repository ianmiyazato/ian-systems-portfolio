import { AiSurface, Banner, Layer, LiveControl, Tween, closeLayers, getWorld, openLayer, useDemoState, useFlip, useLocation, useWorldEvents } from '@portfolio/remote-runtime';
import { brl, brlCompact } from '@portfolio/mocks';
import { withViewTransition } from '@portfolio/motion';
import { useMemo, useState } from 'preact/hooks';
import { COMMISSION_RATE, codedCreator, creatorByCode, newcomer, roster, type Creator } from './roster';

const levels = ['All', 'Rising', 'Core', 'Star'] as const;
const categories = ['All', 'Swim', 'Linen', 'Street', 'Accessories'] as const;
const cities = ['All', 'São Paulo', 'Rio', 'Recife', 'Curitiba', 'Salvador'] as const;

/** Sales since the page opened, per creator code, from coded orders in the world simulation. */
function useLiveSales() {
  const [extra, setExtra] = useState<Record<string, number>>(() => {
    const seeded: Record<string, number> = {};
    for (const event of getWorld().recent(['orders.placed'], 40)) {
      const creator = codedCreator(event.payload.orderId);
      if (creator) seeded[creator.code] = (seeded[creator.code] ?? 0) + 1;
    }
    return seeded;
  });
  const [bumped, setBumped] = useState<string | null>(null);
  useWorldEvents(['orders.placed'], (event) => {
    const creator = codedCreator(event.payload.orderId);
    if (!creator) return;
    setExtra((current) => ({ ...current, [creator.code]: (current[creator.code] ?? 0) + 1 }));
    setBumped(creator.code);
  });
  return { extra, bumped };
}

export function Creators() {
  const state = useDemoState();
  const { params } = useLocation();
  const { extra, bumped } = useLiveSales();
  const openCode = params.get('drawer') === 'creator' ? params.get('creator') : null;
  // Card avatar → profile avatar share a view-transition-name; the drawer opens inside the transition.
  const openProfile = (code: string) => withViewTransition(() => new Promise<void>((resolve) => {
    openLayer({ drawer: 'creator', creator: code });
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  const [level, setLevel] = useState<(typeof levels)[number]>('All');
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [city, setCity] = useState<(typeof cities)[number]>('All');
  const [invited, setInvited] = useState<Creator[]>(state === 'new' ? [newcomer] : []);

  const ranked = useMemo(
    () => roster.map((creator) => ({ ...creator, sales: creator.sales + (extra[creator.code] ?? 0) })).sort((a, b) => b.sales - a.sales || a.code.localeCompare(b.code)),
    [extra]
  );
  const visible = [...invited, ...ranked].filter((creator) => (level === 'All' || creator.level === level) && (category === 'All' || creator.category === category) && (city === 'All' || creator.city === city));
  const order = visible.map((creator) => creator.code).join(',');
  const grid = useFlip<HTMLDivElement>(order);
  const selected = params.get('drawer') === 'creator' ? creatorByCode(params.get('creator')) : undefined;
  const liveSelected = selected ? ranked.find((creator) => creator.code === selected.code) ?? selected : undefined;
  const totalSales = ranked.reduce((sum, creator) => sum + creator.sales, 0);

  return (
    <main class="cc-main" id="circle-creators">
      <header class="cc-page-head" data-anchor="cc-creators-head">
        <div>
          <h1>Creators</h1>
          <p>{roster.length + invited.length} creators · <Tween value={totalSales} /> coded orders this month · ranked live as orders come in</p>
        </div>
        <div class="cc-head-actions">
          <LiveControl anchor="cc-creators-live" />
          <button type="button" class="cc-btn primary" onClick={() => openLayer({ modal: 'invite' })} data-anchor="cc-invite-button">Invite creator</button>
        </div>
      </header>
      {state === 'error' && <Banner tone="risk" icon="!" title="Attribution delayed · sales as of 15:40" anchor="cc-creators-error">Orders are recorded; creator totals catch up when the stream recovers.</Banner>}

      <div class="cc-filters" data-anchor="cc-creator-filters">
        {([['Level', levels, level, setLevel], ['Category', categories, category, setCategory], ['City', cities, city, setCity]] as const).map(([label, options, value, set]) => (
          <div class="cc-filter-row" role="group" aria-label={label} key={label}>
            <span>{label}</span>
            {options.map((option) => <button type="button" key={option} aria-pressed={value === option} onClick={() => (set as (next: string) => void)(option)}>{option}</button>)}
          </div>
        ))}
      </div>

      {invited.some((creator) => creator.sales === 0) && (
        <section class="cc-first" data-anchor="cc-new-creator">
          <span class="cc-avatar ring" style={{ '--hue': newcomer.hue }}>{newcomer.initials}</span>
          <div>
            <strong>{invited[0]!.name} joined {invited[0]!.joined} · no sales yet</strong>
            <p>Most creators make a first sale within a week once they do these three things:</p>
            <ol>
              <li class="done">Sign the creator contract</li>
              <li>Share code <code>{invited[0]!.code}</code> in a story or bio link</li>
              <li>Join the Summer swim drop</li>
            </ol>
            <button type="button" class="cc-btn primary">Send a starter kit</button>
          </div>
        </section>
      )}

      <div class="cc-creator-grid" ref={grid} data-anchor="cc-creator-grid">
        {visible.map((creator, index) => (
          <button type="button" key={creator.code} data-flip={creator.code} data-nav-row class={`cc-creator ${bumped === creator.code ? 'is-bumped' : ''} ${creator.sales === 0 ? 'is-new' : ''}`} onClick={() => openProfile(creator.code)} aria-label={`${creator.name}, ${creator.sales} sales, rank ${index + 1}`}>
            <span class="cc-rank" aria-hidden="true">{creator.sales ? index + 1 - invited.length : '·'}</span>
            <span class={`cc-avatar ring level-${creator.level.toLowerCase()}`} style={{ '--hue': creator.hue, viewTransitionName: openCode === creator.code ? undefined : `creator-${creator.code}` }}>{creator.initials}</span>
            <strong>{creator.name}</strong>
            <small>{creator.handle} · {creator.city}</small>
            <span class="cc-code">{creator.code}</span>
            <span class={`cc-level ${creator.level.toLowerCase()}`}>{creator.level} · {creator.category}</span>
            <dl>
              <div><dt>Sales</dt><dd><Tween value={creator.sales} /></dd></div>
              <div><dt>Conversion</dt><dd>{creator.conversion ? `${creator.conversion}%` : '—'}</dd></div>
            </dl>
            {bumped === creator.code && <em class="cc-plus" aria-hidden="true">+1</em>}
          </button>
        ))}
        {!visible.length && <div class="cc-empty"><strong>No creators match</strong><p>Clear a filter to see everyone.</p></div>}
      </div>

      {liveSelected && <CreatorDrawer creator={liveSelected} />}
      {params.get('modal') === 'invite' && <Invite onSent={(creator) => { setInvited([creator]); closeLayers(['modal']); }} />}
    </main>
  );
}

function CreatorDrawer({ creator }: { creator: Creator }) {
  const max = Math.max(...creator.spark, 1);
  const points = creator.spark.map((value, index) => `${(index / 13) * 300},${96 - (value / max) * 86}`).join(' ');
  const earned = creator.revenue * COMMISSION_RATE;
  return (
    <Layer kind="drawer" title={creator.name} eyebrow={`${creator.handle} · ${creator.level} · ${creator.category} · ${creator.city}`} onClose={() => closeLayers(['drawer', 'creator'])} width={520} anchor="cc-creator-drawer"
      footer={<><button type="button" class="cc-btn">Message</button><button type="button" class="cc-btn primary">Send brief</button></>}>
      <div class="cc-drawer-head"><span class={`cc-avatar ring big level-${creator.level.toLowerCase()}`} style={{ '--hue': creator.hue, viewTransitionName: `creator-${creator.code}` }}>{creator.initials}</span><div><strong>{creator.name}</strong><small>{creator.handle} · {creator.city}</small></div></div>
      <div class="cc-drawer-stats">
        <div><span>Coded sales</span><strong><Tween value={creator.sales} /></strong></div>
        <div><span>Revenue</span><strong>{brlCompact(creator.revenue)}</strong></div>
        <div><span>Earned</span><strong>{brl(Math.round(earned))}</strong></div>
      </div>
      <section class="cc-drawer-section">
        <h3>Performance · 14 days</h3>
        <svg class="cc-perf" viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label={`Daily coded sales over 14 days, peak ${Math.round(max)}`}>
          <polygon points={`0,100 ${points} 300,100`} />
          <polyline points={points} />
        </svg>
      </section>
      <section class="cc-drawer-section">
        <h3>Codes and contract</h3>
        <ul class="cc-codes">
          <li><span class="cc-code">{creator.code}</span>main code · 10% off for followers</li>
          <li><span class="cc-code">{creator.code.replace(/\d+$/, '')}SWIM</span>Summer swim drop · ends Oct 9</li>
          <li class={creator.contract === 'Pending' ? 'pending' : ''}><b>{creator.contract === 'Pending' ? 'Contract pending' : 'Contract signed'}</b>{creator.contract === 'Pending' ? ' · payouts wait for a signature' : ` · since ${creator.joined}`}</li>
        </ul>
      </section>
      <section class="cc-drawer-section">
        <h3>Content</h3>
        <ul class="cc-content">
          <li><span class="cc-type reel">Reel</span>Try-on: linen midi dress, 3 ways<small>Sep 24 · 182k views · 41 sales</small></li>
          <li><span class="cc-type story">Story</span>Code reminder before the weekend<small>Sep 23 · 36k views · 12 sales</small></li>
          <li><span class="cc-type post">Post</span>Beach day with the canvas tote<small>Sep 19 · 58k views · 9 sales</small></li>
        </ul>
      </section>
      <section class="cc-drawer-section">
        <h3>Payouts</h3>
        <ul class="cc-payouts">
          <li><span>Sep 25</span><b>{brl(Math.round(earned * 0.31))}</b><small>paid · Pix</small></li>
          <li><span>Sep 18</span><b>{brl(Math.round(earned * 0.27))}</b><small>paid · Pix</small></li>
          <li><span>Sep 11</span><b>{brl(Math.round(earned * 0.22))}</b><small>paid · Pix</small></li>
        </ul>
      </section>
    </Layer>
  );
}

function Invite({ onSent }: { onSent: (creator: Creator) => void }) {
  const [name, setName] = useState('Lia Prado');
  const [handle, setHandle] = useState('@liaprado');
  const [rate, setRate] = useState(10);
  const code = `${name.split(' ')[0]!.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)}10`;
  return (
    <Layer kind="modal" title="Invite a creator" eyebrow="Contract preview updates as you type" onClose={() => closeLayers(['modal'])} width={820} anchor="cc-invite"
      footer={<><button type="button" class="cc-btn" onClick={() => closeLayers(['modal'])}>Cancel</button><button type="button" class="cc-btn primary" disabled={!name.trim() || !handle.trim()} onClick={() => onSent({ ...newcomer, name: name.trim(), handle: handle.trim(), code, initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), joined: 'today' })}>Send invite</button></>}>
      <div class="cc-invite">
        <div class="cc-invite-form">
          <label class="cc-field">Name<input value={name} onInput={(event) => setName(event.currentTarget.value)} data-autofocus /></label>
          <label class="cc-field">Handle<input value={handle} onInput={(event) => setHandle(event.currentTarget.value)} /></label>
          <label class="cc-field">Commission <output>{rate}%</output><input type="range" min={8} max={12} value={rate} onInput={(event) => setRate(Number(event.currentTarget.value))} /></label>
          <p class="cc-note">Code <span class="cc-code">{code}</span> is created on signature and gives followers 10% off.</p>
        </div>
        <article class="cc-contract" aria-label="Contract preview" data-anchor="cc-contract-preview">
          <header><b>Maré Circle · creator agreement</b><small>v3 · plain language</small></header>
          <ol>
            <li><b>{name || 'The creator'}</b> ({handle || '@handle'}) earns <b>{rate}%</b> of each order placed with code <b>{code}</b>.</li>
            <li>Commission <b>confirms 30 days after delivery</b>. Returned items never become a clawback, because nothing is paid before the window closes.</li>
            <li>Payouts every Friday by Pix once confirmed commission passes R$50.</li>
            <li>Posts about Maré are labeled as a paid partnership.</li>
            <li>Either side can end the agreement with 7 days' notice; confirmed commission is always paid.</li>
          </ol>
        </article>
      </div>
      <AiSurface inline title="Suggested: 10% and the Summer swim drop" meta="fit model · 0.79" sources={[{ label: 'audience overlap · Recife', score: 0.84 }, { label: 'similar creators · 90 days', score: 0.78 }]}>
        Creators with a similar audience earn most from swim in October; 10% matches peers without starting a rate war.
      </AiSurface>
    </Layer>
  );
}
