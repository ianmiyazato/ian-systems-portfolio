export type Stage = 'saved' | 'applied' | 'screen' | 'onsite' | 'offer';
export type Application = { id: string; company: string; role: string; stage: Stage; next: string; salary: string; location: string; prep?: string; /** Moved by the live timeline (not by hand), so the card can announce it. */ moved?: boolean };

export const stages: Array<{ id: Stage; label: string }> = [
  { id: 'saved', label: 'Saved' }, { id: 'applied', label: 'Applied' }, { id: 'screen', label: 'Screen' }, { id: 'onsite', label: 'Onsite' }, { id: 'offer', label: 'Offer' }
];

export const applications: Application[] = [
  { id: 'lumen-grid', company: 'Lumen Grid', role: 'Senior backend engineer', stage: 'saved', next: 'Referral from Ana', salary: '$150–180k', location: 'Remote · Americas' },
  { id: 'harbor-ai', company: 'Harbor AI', role: 'Platform engineer', stage: 'saved', next: 'Closes Fri', salary: '$140–170k', location: 'Lisbon' },
  { id: 'quanta', company: 'Quanta Health', role: 'Staff engineer, data', stage: 'applied', next: 'Applied 3 days ago', salary: '$180–210k', location: 'Remote' },
  { id: 'orbital', company: 'Orbital Freight', role: 'Founding engineer', stage: 'applied', next: 'Recruiter viewed', salary: '$160k + 1%', location: 'São Paulo' },
  { id: 'nimbus', company: 'Nimbus Labs', role: 'Staff engineer', stage: 'screen', next: 'Tech screen Tue 14:00', salary: '$190–220k', location: 'Remote · Americas', prep: 'Rate limiter' },
  { id: 'parallax-pay', company: 'Parallax Pay', role: 'Senior engineer, payments', stage: 'screen', next: 'Outcome pending · onsite Thu', salary: '$170–200k', location: 'Remote', prep: 'Payments ledger' },
  { id: 'fieldnote', company: 'Fieldnote', role: 'Backend lead', stage: 'onsite', next: 'Onsite Mon 10:00', salary: '$175–205k', location: 'NYC · hybrid', prep: 'Feed ranking' },
  { id: 'kite', company: 'Kite Robotics', role: 'Senior engineer', stage: 'offer', next: 'Offer · decide by Oct 3', salary: '$120k', location: 'Remote' }
];

export const funnel = [['Saved', 31], ['Applied', 18], ['Screen', 9], ['Onsite', 4], ['Offer', 1]] as const;
export const skills = [['System design', 78], ['Coding', 71], ['Behavioral', 84], ['Estimation', 62]] as const;

export type Prompt = { id: string; title: string; kind: 'System design' | 'Coding' | 'Behavioral' | 'Estimation'; level: 'Mid' | 'Senior' | 'Staff'; last?: number; minutes: number; locked?: boolean; company?: string };
export const prompts: Prompt[] = [
  { id: 'payments-ledger', title: 'Design a payments ledger', kind: 'System design', level: 'Senior', last: 71, minutes: 45, company: 'Asked at Parallax Pay' },
  { id: 'rate-limiter', title: 'Distributed rate limiter', kind: 'System design', level: 'Senior', last: 82, minutes: 45 },
  { id: 'feed-ranking', title: 'Rank a home feed', kind: 'System design', level: 'Staff', minutes: 60 },
  { id: 'estimate-storage', title: 'Estimate storage for 10× growth', kind: 'Estimation', level: 'Senior', last: 58, minutes: 20 },
  { id: 'lru-cache', title: 'Implement an LRU cache', kind: 'Coding', level: 'Mid', last: 90, minutes: 30 },
  { id: 'conflict', title: 'A disagreement with a PM', kind: 'Behavioral', level: 'Senior', last: 84, minutes: 20 },
  { id: 'multi-region', title: 'Multi-region failover', kind: 'System design', level: 'Staff', minutes: 60, locked: true },
  { id: 'queue-backpressure', title: 'Backpressure in a job queue', kind: 'Coding', level: 'Senior', minutes: 40 }
];

export const rubric = [
  { id: 'requirements', label: 'Requirements', score: 4, t: '02:10', note: 'Clarified idempotency and currency scope early.' },
  { id: 'estimation', label: 'Estimation', score: 2, t: '31:30', note: 'Estimated storage without write rate or retention.', weak: true },
  { id: 'data-model', label: 'Data model', score: 3, t: '12:45', note: 'Double-entry ledger with immutable entries.' },
  { id: 'consistency', label: 'Consistency', score: 3, t: '24:05', note: 'Outbox pattern; missed cache invalidation on reversal.' },
  { id: 'tradeoffs', label: 'Trade-offs', score: 3, t: '38:20', note: 'Compared sync vs async settlement with numbers.' },
  { id: 'communication', label: 'Communication', score: 4, t: '41:00', note: 'Clear structure, checked in with the interviewer.' }
];

export const transcript = [
  { t: '29:40', who: 'Interviewer', text: 'Let’s talk capacity. How much storage does the ledger need in a year?' },
  { t: '30:05', who: 'You', text: 'Each entry is maybe 200 bytes. We have a lot of transactions, so a few terabytes should be fine.' },
  { t: '30:48', who: 'Interviewer', text: 'What write rate are you assuming, and how long do you keep entries?' },
  { t: '31:30', who: 'You', text: 'I’d say… it depends on growth. I’ll keep everything forever and shard if it gets big.', weak: true },
  { t: '32:10', who: 'Interviewer', text: 'Okay. And if traffic grows 10×?' },
  { t: '32:40', who: 'You', text: 'Then we’d add more shards; the ledger partitions by account.' },
  { t: '33:15', who: 'Interviewer', text: 'Good. Let’s move to consistency between the ledger and balances.' }
];

export const lessons = [
  { module: 'Foundations', items: [['Back-of-envelope maths', 'done'], ['Latency numbers', 'done']] },
  { module: 'Scaling', items: [['Designing for 10×', 'current'], ['Caching that stays correct', 'open'], ['Queues and backpressure', 'members']] },
  { module: 'Payments', items: [['Ledgers and double entry', 'members'], ['Idempotency everywhere', 'members']] }
] as const;

export const members = [['RM', 'Rafaela M.', 'Senior engineer · 2026'], ['TK', 'Tiago K.', 'Staff engineer · 2025'], ['LS', 'Luana S.', 'Engineer II · 2026']] as const;
export const velocity = [['Apr', 3, 34], ['May', 5, 29], ['Jun', 4, 31], ['Jul', 7, 24], ['Aug', 6, 22], ['Sep', 8, 19]] as const;

/**
 * While the member watches, the world moves their pipeline: recruiters reply and cards change
 * stage at fixed sim-time offsets from 16:18, so every tab (and every screenshot) agrees.
 */
export const pipelineTimeline: Array<{ afterMinutes: number; id: string; stage: Stage; next: string; toast: string }> = [
  { afterMinutes: 2, id: 'quanta', stage: 'screen', next: 'Screen booked Wed 11:00', toast: 'Quanta Health replied · screen booked for Wednesday' },
  { afterMinutes: 6, id: 'harbor-ai', stage: 'applied', next: 'Applied just now', toast: 'Harbor AI · application sent from your saved role' },
  { afterMinutes: 11, id: 'orbital', stage: 'screen', next: 'Recruiter call Thu 16:00', toast: 'Orbital Freight wants a recruiter call on Thursday' }
];

/* Academy browse ------------------------------------------------------------------------------- */

export type RubricArea = 'Estimation' | 'Trade-offs' | 'Failure modes' | 'Data modeling';
export type Motif = 'ledger' | 'cache' | 'queue' | 'shard' | 'limit' | 'search' | 'feed' | 'retry';
export type Title = { id: string; title: string; kind: 'Series' | 'Lesson'; episodes?: number; minutes: number; match: number; level: 'Mid' | 'Senior' | 'Staff'; motif: Motif; members?: boolean; progress?: number; resume?: string; drill?: string; blurb: string };

/** The member's weakest rubric line (session 14): it picks the artwork variant on every card. */
export const weakestArea: RubricArea = 'Estimation';
export const rubricAreas: RubricArea[] = ['Estimation', 'Trade-offs', 'Failure modes', 'Data modeling'];

export const billboard: Title = { id: 'payments-at-scale', title: 'Payments at scale', kind: 'Series', episodes: 6, minutes: 84, match: 96, level: 'Senior', motif: 'ledger', drill: 'payments-ledger', blurb: 'Ledgers, idempotency and reconciliation, from the first charge to 10× Black Friday traffic. Each episode ends with a 20-minute Arena drill.' };

export const continueWatching: Title[] = [
  { id: 'designing-for-10x', title: 'Designing for 10×', kind: 'Lesson', minutes: 14, match: 94, level: 'Senior', motif: 'shard', progress: 0.43, resume: '06:02', drill: 'estimate-storage', blurb: 'Find the shared thing before it becomes the bottleneck.' },
  { id: 'caching-correct', title: 'Caching that stays correct', kind: 'Lesson', minutes: 18, match: 91, level: 'Senior', motif: 'cache', progress: 0.12, resume: '02:10', drill: 'lru-cache', blurb: 'TTL, write-through and the invalidation you will get wrong.' },
  { id: 'queues-backpressure', title: 'Queues and backpressure', kind: 'Series', episodes: 4, minutes: 52, match: 88, level: 'Mid', motif: 'queue', progress: 0.68, resume: 'Ep 3 · 04:40', drill: 'queue-backpressure', blurb: 'When producers win, consumers lose. Design the pushback.' },
  { id: 'rate-limits', title: 'Rate limits that feel fair', kind: 'Lesson', minutes: 12, match: 86, level: 'Mid', motif: 'limit', progress: 0.3, resume: '03:36', drill: 'rate-limiter', blurb: 'Token buckets, quotas and the error message people read.' }
];

export const topFive: Title[] = [
  { id: 'payments-at-scale', title: 'Payments at scale', kind: 'Series', episodes: 6, minutes: 84, match: 96, level: 'Senior', motif: 'ledger', blurb: '' },
  { id: 'search-relevance', title: 'Search that ranks', kind: 'Series', episodes: 5, minutes: 61, match: 79, level: 'Senior', motif: 'search', members: true, blurb: '' },
  { id: 'feeds-fanout', title: 'Feeds and fan-out', kind: 'Lesson', minutes: 16, match: 83, level: 'Staff', motif: 'feed', blurb: '' },
  { id: 'retries-idempotency', title: 'Retries without duplicates', kind: 'Lesson', minutes: 11, match: 92, level: 'Mid', motif: 'retry', blurb: '' },
  { id: 'sharding-101', title: 'Sharding without regret', kind: 'Series', episodes: 3, minutes: 40, match: 87, level: 'Staff', motif: 'shard', members: true, blurb: '' }
];

/** One short line per rubric area: what the personalized artwork emphasizes. */
export const artFocus: Record<RubricArea, string> = {
  'Estimation': 'numbers on the diagram',
  'Trade-offs': 'the two options side by side',
  'Failure modes': 'where it breaks',
  'Data modeling': 'the tables and keys'
};

/* Practice Mix --------------------------------------------------------------------------------- */

export type MixKind = 'Drill' | 'Lesson' | 'Mock';
export type MixTrack = { id: string; title: string; kind: MixKind; why: string; minutes: number; area: RubricArea | 'Communication'; weakness: number; href: string; fresh?: boolean };
export type Mix = { id: string; title: string; blurb: string; cover: [string, string]; count: number };

export const mixes: Mix[] = [
  { id: 'today', title: 'Interview Mix · Tuesday', blurb: 'Made for you from rubric scores and your next onsite', cover: ['accent', 'accent-2'], count: 7 },
  { id: 'estimation', title: 'Estimation Mix', blurb: 'Your weakest line, in 10-minute drills', cover: ['accent-2', 'info'], count: 9 },
  { id: 'payments', title: 'Payments loop', blurb: 'Ledgers, idempotency, reconciliation', cover: ['warn', 'accent'], count: 6 },
  { id: 'senior-us', title: 'Senior US staples', blurb: 'What US senior loops ask most', cover: ['info', 'accent-2'], count: 12 },
  { id: 'liked', title: 'Liked lessons', blurb: '14 saved', cover: ['risk', 'warn'], count: 14 }
];

/** Weakness 0–1 (higher = weaker): drives "Shuffle by weakness". Durations are real practice minutes. */
export const mixTracks: MixTrack[] = [
  { id: 'estimate-storage', title: 'Estimate storage for a payments ledger', kind: 'Drill', why: 'Estimation is your lowest rubric line (62)', minutes: 20, area: 'Estimation', weakness: 0.9, href: '/atlas/arena?modal=setup&prompt=estimate-storage' },
  { id: 'designing-for-10x', title: 'Designing for 10×', kind: 'Lesson', why: 'Finishes the lesson you are 43% through', minutes: 14, area: 'Estimation', weakness: 0.7, href: '/atlas/academy/designing-for-10x' },
  { id: 'idempotency-keys', title: 'Idempotency keys under retries', kind: 'Drill', why: 'Parallax Pay asked it in 9 of 14 member reports', minutes: 15, area: 'Failure modes', weakness: 0.6, href: '/atlas/arena?modal=setup&prompt=payments-ledger' },
  { id: 'bar-raiser-ledger', title: 'Bar raiser mock: payments ledger', kind: 'Mock', why: 'Parallax Pay onsite is Thursday, Oct 1', minutes: 45, area: 'Trade-offs', weakness: 0.5, href: '/atlas/arena?modal=setup&prompt=payments-ledger' },
  { id: 'caching-correct', title: 'Caching that stays correct', kind: 'Lesson', why: 'You liked it on Sunday', minutes: 18, area: 'Failure modes', weakness: 0.3, href: '/atlas/academy/designing-for-10x' },
  { id: 'fanout-envelope', title: 'Back-of-envelope: notification fan-out', kind: 'Drill', why: 'Estimation again, shorter', minutes: 10, area: 'Estimation', weakness: 0.8, href: '/atlas/arena?modal=setup&prompt=queue-backpressure' },
  { id: 'tradeoffs-out-loud', title: 'Trade-offs, out loud', kind: 'Drill', why: 'Communication scored 71 in session 14', minutes: 12, area: 'Communication', weakness: 0.4, href: '/atlas/arena?modal=setup&prompt=rate-limiter' }
];

/** Added live when the world books Orbital Freight's recruiter call (pipelineTimeline, +11 min). */
export const orbitalTrack: MixTrack = { id: 'orbital-screen', title: 'Recruiter screen prep: Orbital Freight', kind: 'Drill', why: 'Orbital Freight just booked a recruiter call for Thursday', minutes: 8, area: 'Communication', weakness: 0.65, href: '/atlas/companies/parallax-pay', fresh: true };

/* Offer wallet --------------------------------------------------------------------------------- */

/** Static FX fixture (no network): BRL per USD, with the bank's spread on conversion. */
export const fx = { rate: 5.42, spread: 0.012, asOf: 'Sep 26 close', min: 4.8, max: 6.2 };

export type Offer = { id: string; company: string; role: string; kind: 'USD contractor' | 'BRL employee'; currency: 'USD' | 'BRL'; monthly: number; decideBy: string; perks: string[]; pipelineId?: string };
export const offers: Offer[] = [
  { id: 'kite', company: 'Kite Robotics', role: 'Senior engineer · remote, paid in USD', kind: 'USD contractor', currency: 'USD', monthly: 10_000, decideBy: 'Oct 3', perks: ['$120k a year', '0.08% equity', 'Home office stipend'], pipelineId: 'kite' },
  { id: 'counter', company: 'Current role · counter-offer', role: 'Staff engineer · São Paulo, paid in BRL', kind: 'BRL employee', currency: 'BRL', monthly: 42_000, decideBy: 'Oct 5', perks: ['13th salary + vacation bonus', 'Employer health plan', 'Meal card'] }
];

export type Step = { label: string; amount: number; note: string };

/** Gross → net per month in BRL. Contractors pay their own company taxes, accountant, bank and health. */
export function takeHome(offer: Offer, rate: number): Step[] {
  if (offer.currency === 'USD') {
    const gross = offer.monthly * rate;
    const spread = -gross * fx.spread;
    const revenue = gross + spread;
    const taxes = -revenue * 0.06;
    const fees = -(450 + 15 * rate + revenue * 0.0038);
    const health = -1_100;
    const beforeReserve = revenue + taxes + fees + health;
    const reserve = -beforeReserve * 0.11;
    return [
      { label: 'Gross at today’s rate', amount: gross, note: `$${offer.monthly.toLocaleString('en-US')} × ${rate.toFixed(2)}` },
      { label: 'FX spread', amount: spread, note: `${(fx.spread * 100).toFixed(1)}% bank spread` },
      { label: 'Company taxes', amount: taxes, note: 'simplified regime · 6%' },
      { label: 'Accountant and bank fees', amount: fees, note: 'R$450 + wire + 0.38% IOF' },
      { label: 'Health insurance', amount: health, note: 'individual plan' },
      { label: 'Suggested reserve', amount: reserve, note: '11% for vacation, 13th and gaps' }
    ];
  }
  const gross = offer.monthly;
  const social = -951.63;
  const income = -(gross + social) * 0.225;
  const extras = (gross * 2.33) / 12;
  return [
    { label: 'Gross salary', amount: gross, note: 'monthly, before deductions' },
    { label: 'Social security', amount: social, note: 'capped contribution' },
    { label: 'Income tax', amount: income, note: 'progressive · ~22.5% effective' },
    { label: '13th salary and vacation bonus', amount: extras, note: 'spread across 12 months' }
  ];
}
export const netOf = (steps: Step[]) => steps.reduce((sum, step) => sum + step.amount, 0);

/** Polite, templated notes sent to the processes an accepted offer archives. */
export const archiveNote = (company: string) => `Thank you for the time your team gave me. I've accepted another offer, so I'm withdrawing from the ${company} process. I'd be glad to stay in touch.`;
export const OFFER_KEY = 'atlas:accepted-offer';
export const OFFER_CHANNEL = 'atlas-offer';

/* Live mock match -------------------------------------------------------------------------------- */

export type Mentor = { id: string; name: string; city: string; x: number; y: number; utcOffset: number; rating: number; mocks: number; role: string; languages: string[] };

/** Equirectangular projection onto a 1000 × 500 map: x = (lon + 180) / 360, y = (90 − lat) / 180. */
const at = (lat: number, lon: number) => ({ x: Math.round(((lon + 180) / 360) * 1000), y: Math.round(((90 - lat) / 180) * 500) });

export const mentors: Mentor[] = [
  { id: 'priya', name: 'Priya', city: 'London', ...at(51.5, -0.1), utcOffset: 1, rating: 4.9, mocks: 212, role: 'Staff engineer · payments', languages: ['English'] },
  { id: 'tomas', name: 'Tomas', city: 'Lisbon', ...at(38.7, -9.1), utcOffset: 1, rating: 4.8, mocks: 164, role: 'Principal engineer · infra', languages: ['English', 'Portuguese'] },
  { id: 'marcus', name: 'Marcus', city: 'New York', ...at(40.7, -74), utcOffset: -4, rating: 4.7, mocks: 98, role: 'Engineering manager', languages: ['English'] },
  { id: 'sam', name: 'Sam', city: 'San Francisco', ...at(37.8, -122.4), utcOffset: -7, rating: 4.8, mocks: 301, role: 'Staff engineer · search', languages: ['English'] },
  { id: 'diego', name: 'Diego', city: 'Mexico City', ...at(19.4, -99.1), utcOffset: -6, rating: 4.6, mocks: 57, role: 'Senior engineer · data', languages: ['English', 'Spanish'] },
  { id: 'lena', name: 'Lena', city: 'Berlin', ...at(52.5, 13.4), utcOffset: 2, rating: 4.8, mocks: 143, role: 'Staff engineer · platform', languages: ['English'] },
  { id: 'kofi', name: 'Kofi', city: 'Lagos', ...at(6.5, 3.4), utcOffset: 1, rating: 4.7, mocks: 76, role: 'Senior engineer · fintech', languages: ['English'] },
  { id: 'ana', name: 'Ana', city: 'Toronto', ...at(43.7, -79.4), utcOffset: -4, rating: 4.8, mocks: 120, role: 'Staff engineer · reliability', languages: ['English', 'Portuguese'] },
  { id: 'yuki', name: 'Yuki', city: 'Tokyo', ...at(35.7, 139.7), utcOffset: 9, rating: 4.9, mocks: 188, role: 'Principal engineer', languages: ['English'] },
  { id: 'mei', name: 'Mei', city: 'Singapore', ...at(1.35, 103.8), utcOffset: 8, rating: 4.8, mocks: 132, role: 'Staff engineer · ML', languages: ['English'] },
  { id: 'arjun', name: 'Arjun', city: 'Bangalore', ...at(12.97, 77.59), utcOffset: 5.5, rating: 4.7, mocks: 210, role: 'Staff engineer · scale', languages: ['English'] },
  { id: 'jack', name: 'Jack', city: 'Sydney', ...at(-33.9, 151.2), utcOffset: 10, rating: 4.6, mocks: 64, role: 'Senior engineer', languages: ['English'] }
];
export const member = { city: 'São Paulo', ...at(-23.5, -46.6) };

/** Mentors are online from 07:00 to 23:00 their local time on the world clock. */
export const isOnline = (mentor: Mentor, utcHour: number) => {
  const local = (utcHour + mentor.utcOffset + 24) % 24;
  return local >= 7 && local < 23;
};

/** Demand peaks while the US and Europe overlap (13:00–19:00 UTC): that's when the surge applies. */
export const surgeAt = (utcHour: number) => (utcHour >= 13 && utcHour < 19 ? 1.4 : utcHour >= 19 && utcHour < 22 ? 1.2 : 1);

/** Rough continent outlines in the same projection (drawn, not fetched). */
export const continents = [
  'M40 60 L180 40 L300 50 L360 90 L330 130 L300 170 L260 200 L230 215 L200 190 L150 160 L90 120 Z',
  'M280 220 L330 225 L400 270 L390 320 L350 370 L320 410 L300 380 L295 320 L275 260 Z',
  'M470 60 L560 50 L610 70 L600 110 L560 130 L520 150 L480 140 L465 110 Z',
  'M455 160 L520 150 L600 170 L640 210 L610 270 L580 330 L545 350 L520 320 L500 260 L460 210 Z',
  'M610 50 L760 40 L900 60 L930 110 L880 160 L820 200 L790 240 L740 230 L700 220 L650 180 L615 130 Z',
  'M815 290 L880 280 L925 310 L920 350 L870 360 L825 345 Z'
];
