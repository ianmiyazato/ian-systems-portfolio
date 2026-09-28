/** Talent wallet: balances in USD with KRW/JPY equivalents from a static FX fixture (no rates API). */
export const fx = { KRW: 1382.4, JPY: 147.9, asOf: 'Sep 26 close', spread: 0.004 };
export const artist = { name: 'Hana Rae', bank: 'Seoul bank · •••• 2210' };

/** Available balance grows with streams while you watch (sim seconds since 16:18). */
export const available = (elapsed: number) => 18_420.55 + elapsed * 0.018;

export const sources = [
  { id: 'streams', label: 'Streaming', amount: 11_240.3, share: 0.61 },
  { id: 'shorts', label: 'Short-form royalties', amount: 3_980.1, share: 0.22 },
  { id: 'sync', label: 'Sync · Maré Summer 27', amount: 2_400, share: 0.13 },
  { id: 'live', label: 'Live · Hongdae pop-up', amount: 800.15, share: 0.04 }
];

export const split = [
  { party: 'Hana Rae', role: 'Artist', share: 45, signed: true, hue: 'accent' },
  { party: 'Haneul Records', role: 'Label', share: 25, signed: true, hue: 'ai' },
  { party: 'Kenji M. & Seo-yeon', role: 'Producers', share: 20, signed: true, hue: 'warn' },
  { party: 'Park Min', role: 'Songwriter', share: 10, signed: true, hue: 'success' }
];
export const splitLock = 'Locked Sep 12 · all four parties signed';

export const usd = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const krw = (value: number) => `₩${Math.round(value).toLocaleString('en-US')}`;
export const jpy = (value: number) => `¥${Math.round(value).toLocaleString('en-US')}`;
