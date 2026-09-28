export type Mentor = { id: string; name: string; city: string; x: number; y: number; utcOffset: number; rating: number; mocks: number; role: string; languages: string[] };

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
export const isOnline = (mentor: Mentor, utcHour: number) => {
  const local = (utcHour + mentor.utcOffset + 24) % 24;
  return local >= 7 && local < 23;
};
export const surgeAt = (utcHour: number) => (utcHour >= 13 && utcHour < 19 ? 1.4 : utcHour >= 19 && utcHour < 22 ? 1.2 : 1);
export const continents = [
  'M40 60 L180 40 L300 50 L360 90 L330 130 L300 170 L260 200 L230 215 L200 190 L150 160 L90 120 Z',
  'M280 220 L330 225 L400 270 L390 320 L350 370 L320 410 L300 380 L295 320 L275 260 Z',
  'M470 60 L560 50 L610 70 L600 110 L560 130 L520 150 L480 140 L465 110 Z',
  'M455 160 L520 150 L600 170 L640 210 L610 270 L580 330 L545 350 L520 320 L500 260 L460 210 Z',
  'M610 50 L760 40 L900 60 L930 110 L880 160 L820 200 L790 240 L740 230 L700 220 L650 180 L615 130 Z',
  'M815 290 L880 280 L925 310 L920 350 L870 360 L825 345 Z'
];
