import type { RubricArea } from './atlas';

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

export const mixTracks: MixTrack[] = [
  { id: 'estimate-storage', title: 'Estimate storage for a payments ledger', kind: 'Drill', why: 'Estimation is your lowest rubric line (62)', minutes: 20, area: 'Estimation', weakness: 0.9, href: '/atlas/arena?modal=setup&prompt=estimate-storage' },
  { id: 'designing-for-10x', title: 'Designing for 10×', kind: 'Lesson', why: 'Finishes the lesson you are 43% through', minutes: 14, area: 'Estimation', weakness: 0.7, href: '/atlas/academy/designing-for-10x' },
  { id: 'idempotency-keys', title: 'Idempotency keys under retries', kind: 'Drill', why: 'Parallax Pay asked it in 9 of 14 member reports', minutes: 15, area: 'Failure modes', weakness: 0.6, href: '/atlas/arena?modal=setup&prompt=payments-ledger' },
  { id: 'bar-raiser-ledger', title: 'Bar raiser mock: payments ledger', kind: 'Mock', why: 'Parallax Pay onsite is Thursday, Oct 1', minutes: 45, area: 'Trade-offs', weakness: 0.5, href: '/atlas/arena?modal=setup&prompt=payments-ledger' },
  { id: 'caching-correct', title: 'Caching that stays correct', kind: 'Lesson', why: 'You liked it on Sunday', minutes: 18, area: 'Failure modes', weakness: 0.3, href: '/atlas/academy/designing-for-10x' },
  { id: 'fanout-envelope', title: 'Back-of-envelope: notification fan-out', kind: 'Drill', why: 'Estimation again, shorter', minutes: 10, area: 'Estimation', weakness: 0.8, href: '/atlas/arena?modal=setup&prompt=queue-backpressure' },
  { id: 'tradeoffs-out-loud', title: 'Trade-offs, out loud', kind: 'Drill', why: 'Communication scored 71 in session 14', minutes: 12, area: 'Communication', weakness: 0.4, href: '/atlas/arena?modal=setup&prompt=rate-limiter' }
];

export const orbitalTrack: MixTrack = { id: 'orbital-screen', title: 'Recruiter screen prep: Orbital Freight', kind: 'Drill', why: 'Orbital Freight just booked a recruiter call for Thursday', minutes: 8, area: 'Communication', weakness: 0.65, href: '/atlas/companies/parallax-pay', fresh: true };
