import type { Motif } from './atlas';

export type Episode = { n: number; title: string; minutes: number; progress: number; motif: Motif; synopsis: string; asked: string[]; pass: string; drill: string; assembling?: boolean };
export const loopSeason = {
  company: 'Parallax Pay', slug: 'parallax-pay', season: 2026, match: 94, reports: 14, passed: 6, medianOffer: '$182k',
  episodes: [
    { n: 1, title: 'Recruiter screen', minutes: 30, progress: 1, motif: 'feed', synopsis: 'Level calibration, remote setup and notice period. They want a clear story of your last two systems.', asked: ['Walk me through the last system you owned end to end.', 'Why payments, and why now?'], pass: '92% pass', drill: 'conflict' },
    { n: 2, title: 'Take-home', minutes: 180, progress: 1, motif: 'retry', synopsis: 'Reconcile two CSV exports of card settlements. Idempotency and tests are graded above speed.', asked: ['How does your job behave if it runs twice?', 'What happens with a partial file?'], pass: '71% pass', drill: 'queue-backpressure' },
    { n: 3, title: 'System design', minutes: 60, progress: 0, motif: 'ledger', synopsis: 'Design a ledger for card payments. Expect reversals, idempotency keys and a 10× Black Friday follow-up.', asked: ['Where does the balance live, and who can write it?', 'A reversal arrives before the capture. Now what?'], pass: '48% pass', drill: 'payments-ledger' },
    { n: 4, title: 'Coding', minutes: 45, progress: 0, motif: 'limit', synopsis: 'A sliding-window rate limiter. They ask for complexity, tests and what breaks across two regions.', asked: ['Make it work per merchant and per card.', 'How do you test the window edge?'], pass: '55% pass', drill: 'rate-limiter' },
    { n: 5, title: 'Bar raiser', minutes: 45, progress: 0, motif: 'queue', synopsis: 'Behavioral depth with a senior leader: a decision you got wrong, and what you changed after.', asked: ['Tell me about a disagreement you lost.', 'What would your last manager push you on?'], pass: '37% pass', drill: 'conflict' }
  ] as Episode[]
};
