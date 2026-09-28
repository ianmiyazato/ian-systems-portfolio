/** Roster home: artists in rows (Seoul, moments, Tokyo, LA), each with live momentum and brand fit. */
export type Genre = 'K-pop' | 'J-pop' | 'Indie' | 'Hip-hop' | 'Electronic';
export type Artist = { id: string; name: string; local: string; market: 'Seoul' | 'Tokyo' | 'LA'; genre: Genre; momentum: number; fit: number; hue: 'accent' | 'ai' | 'warn' | 'success'; moment?: string };
export type Brand = { id: string; name: string; audience: string };

export const brands: Brand[] = [
  { id: 'mare-summer', name: 'Maré · Summer 27', audience: '18–34 · Brazil and Japan · linen, beach, city' },
  { id: 'mare-pay', name: 'Maré Pay · card launch', audience: '20–30 · first credit card · mobile-first' },
  { id: 'atlas-pro', name: 'Atlas · Pro campaign', audience: '24–35 · engineers · career moves' }
];

export const artists: Artist[] = [
  { id: 'hana-rae', name: 'Hana Rae', local: '하나 레 · ハナ・レイ', market: 'Seoul', genre: 'K-pop', momentum: 212, fit: 91, hue: 'accent', moment: 'Afterglow · 0:24 fan edit' },
  { id: 'aera', name: 'AERA', local: '에아라 · エアラ', market: 'Seoul', genre: 'K-pop', momentum: 24, fit: 84, hue: 'ai', moment: 'Tidal · chorus 0:42' },
  { id: 'juno-park', name: 'Juno Park', local: '박준호 · パク・ジュノ', market: 'Seoul', genre: 'Indie', momentum: 61, fit: 77, hue: 'success' },
  { id: 'nami', name: 'NAMI', local: '나미 · ナミ', market: 'Tokyo', genre: 'J-pop', momentum: 11, fit: 72, hue: 'warn', moment: 'Koi · bridge 1:18' },
  { id: 'mika-sol', name: 'Mika Sol', local: '미카 솔 · ミカ・ソル', market: 'Tokyo', genre: 'J-pop', momentum: 48, fit: 88, hue: 'accent' },
  { id: 'sora-9', name: 'SORA-9', local: '소라9 · ソラ9', market: 'Tokyo', genre: 'Electronic', momentum: 5, fit: 63, hue: 'ai' },
  { id: 'lumen', name: 'Lumen', local: '루멘 · ルーメン', market: 'LA', genre: 'Indie', momentum: 8, fit: 69, hue: 'success' },
  { id: 'ray-vega', name: 'Ray Vega', local: '레이 베가 · レイ・ベガ', market: 'LA', genre: 'Hip-hop', momentum: 73, fit: 58, hue: 'warn', moment: 'Night Bus · verse 2' },
  { id: 'velvet-coast', name: 'Velvet Coast', local: '벨벳 코스트 · ベルベット・コースト', market: 'LA', genre: 'Indie', momentum: 34, fit: 81, hue: 'accent' }
];

export type Row = { id: string; title: string; pick: (artist: Artist) => boolean };
export const rows: Row[] = [
  { id: 'seoul', title: 'Rising in Seoul', pick: (artist) => artist.market === 'Seoul' },
  { id: 'moments', title: 'Moments this week', pick: (artist) => Boolean(artist.moment) },
  { id: 'tokyo', title: 'Tokyo crossover', pick: (artist) => artist.market === 'Tokyo' },
  { id: 'la', title: 'LA breakouts', pick: (artist) => artist.market === 'LA' }
];
export const genres: Array<Genre | 'All'> = ['All', 'K-pop', 'J-pop', 'Indie', 'Hip-hop', 'Electronic'];

/** Brand fit, broken down the way a partnerships lead would argue it. */
export function fitBreakdown(artist: Artist, brand: Brand) {
  const shift = { 'mare-summer': 0, 'mare-pay': -6, 'atlas-pro': -14 }[brand.id] ?? 0;
  const score = Math.max(35, Math.min(97, artist.fit + shift));
  return {
    score,
    parts: [
      ['Audience overlap', Math.min(99, score + 4)],
      ['Market match', artist.market === 'Tokyo' || artist.market === 'Seoul' ? Math.min(99, score + 7) : score - 9],
      ['Tone and aesthetic', score - 3],
      ['Brand safety', 96]
    ] as Array<[string, number]>
  };
}

/** Momentum drifts with the world clock: a slow sine around the weekly number, never below zero. */
export const liveMomentum = (artist: Artist, elapsed: number) => Math.max(0, Math.round(artist.momentum + Math.sin(elapsed / 90 + artist.fit) * Math.max(2, artist.momentum * 0.04)));
export const billboardArtist = artists[0]!;
