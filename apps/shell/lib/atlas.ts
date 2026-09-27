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
  { id: 'kite', company: 'Kite Robotics', role: 'Senior engineer', stage: 'offer', next: 'Offer · decide by Oct 3', salary: '$185k', location: 'Remote' }
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
