/**
 * Street team dispatch for last night's Hongdae pop-up, replayed on the world clock: one second of
 * sim time is one second of the replay, so Pause, 10× and 60× work here too. Map is drawn SVG (no tiles).
 */
export type Point = [number, number];
export type Creator = { id: string; name: string; local: string; from: string; start: number; minutes: number; route: Point[]; followers: string };

export const REPLAY_START = 18 * 60 + 20; // 18:20 KST, minutes after midnight
export const EVENT_AT = 19 * 60; // 19:00 KST
export const REPLAY_MINUTES = 50;
export const NEEDED = 6;

export const venue: Point = [150, 205];
export const backupVenue: Point = [600, 222];
export const districts: Array<{ name: string; at: Point }> = [
  { name: 'Hongdae', at: [150, 205] }, { name: 'Sinchon', at: [240, 215] }, { name: 'Myeongdong', at: [400, 180] },
  { name: 'Itaewon', at: [420, 300] }, { name: 'Seongsu', at: [600, 222] }, { name: 'Gangnam', at: [560, 410] }
];
export const heat: Array<{ at: Point; r: number; level: number }> = [
  { at: [150, 205], r: 90, level: 1 }, { at: [600, 222], r: 60, level: 0.55 }, { at: [560, 410], r: 50, level: 0.35 }, { at: [400, 180], r: 45, level: 0.3 }
];
export const river = 'M0 330 C 120 300, 220 360, 330 340 S 520 280, 640 330 S 760 360, 800 340 L 800 372 C 740 392, 660 360, 560 364 S 360 380, 300 372 S 100 336, 0 362 Z';
export const roads = ['M20 205 L780 222', 'M150 40 L150 500', 'M400 40 L420 500', 'M600 40 L560 500', 'M20 120 L780 140', 'M20 440 L780 430'];

/** start = minutes after 18:20 the creator leaves; minutes = trip length. */
export const creators: Creator[] = [
  { id: 'jiwoo', name: 'Jiwoo', local: '지우', from: 'Seongsu', start: 0, minutes: 34, route: [[600, 222], [400, 214], [240, 215], [150, 205]], followers: '182k' },
  { id: 'minseo', name: 'Minseo', local: '민서', from: 'Sinchon', start: 2, minutes: 12, route: [[240, 215], [190, 210], [150, 205]], followers: '96k' },
  { id: 'taeyang', name: 'Taeyang', local: '태양', from: 'Itaewon', start: 0, minutes: 18, route: [[420, 300], [520, 262], [600, 222]], followers: '240k' },
  { id: 'yuna', name: 'Yuna', local: '유나', from: 'Hongdae', start: 0, minutes: 4, route: [[170, 150], [150, 205]], followers: '58k' },
  { id: 'haru', name: 'Haru', local: '하루', from: 'Myeongdong', start: 5, minutes: 22, route: [[400, 180], [400, 214], [240, 215], [150, 205]], followers: '131k' }
];
export const reserve: Creator = { id: 'doyun', name: 'Doyun', local: '도윤', from: 'Sinchon', start: 0, minutes: 11, route: [[240, 215], [200, 212], [150, 205]], followers: '74k' };

/** Taeyang starts toward the quiet Seongsu backup; the AI re-route sends him to Hongdae exit 9 instead. */
export const REROUTE_ID = 'taeyang';
export const toHongdae: Point[] = [[410, 214], [240, 215], [150, 205]];
/** Map pixels a creator covers per minute on the subway and on foot (used for rerouted trips). */
export const SPEED = 13;

export function along(route: Point[], fraction: number): Point {
  const lengths = route.slice(1).map((point, index) => Math.hypot(point[0] - route[index]![0], point[1] - route[index]![1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let left = Math.max(0, Math.min(1, fraction)) * total;
  for (let index = 0; index < lengths.length; index += 1) {
    if (left <= lengths[index]!) {
      const t = lengths[index] ? left / lengths[index]! : 0;
      const a = route[index]!;
      const b = route[index + 1]!;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    left -= lengths[index]!;
  }
  return route.at(-1)!;
}

export const lengthOf = (route: Point[]) => route.slice(1).reduce((sum, point, index) => sum + Math.hypot(point[0] - route[index]![0], point[1] - route[index]![1]), 0);
export const pathOf = (route: Point[]) => `M${route.map(([x, y]) => `${x} ${y}`).join(' L')}`;
export const kst = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(Math.floor(minutes % 60)).padStart(2, '0')}`;
