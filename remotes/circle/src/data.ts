import { series } from '@portfolio/mocks';

export type Creator = { name: string; handle: string; code: string; initials: string; sales: number; commission: number; trend: number; spark: number[]; hue: number; leak?: boolean };

export const creators: Creator[] = [
  { name: 'Nina Costa', handle: '@ninac', code: 'NINA10', initials: 'NC', sales: 84, commission: 8.4, trend: 18, spark: series(31, 14, 30, 5, 1), hue: 0 },
  { name: 'João M.', handle: '@joaomar', code: 'JOAO12', initials: 'JM', sales: 67, commission: 6.7, trend: 9, spark: series(32, 14, 30, 4, 0.6), hue: 1 },
  { name: 'Mariana Luz', handle: '@mari.luz', code: 'MARI15', initials: 'ML', sales: 58, commission: 5.8, trend: 212, spark: [12, 13, 11, 14, 12, 15, 13, 14, 16, 22, 38, 51, 64, 76], hue: 2, leak: true },
  { name: 'Tomás R.', handle: '@tomas.r', code: 'TOMAS8', initials: 'TR', sales: 41, commission: 4.1, trend: -4, spark: series(34, 14, 30, 4, -0.3), hue: 3 }
];

export const week = [
  { day: 'Mon', date: 22, items: [] as string[] },
  { day: 'Tue', date: 23, items: ['Swim drop · Nina + João'] },
  { day: 'Wed', date: 24, items: ['Swim drop · Nina + João'] },
  { day: 'Thu', date: 25, items: ['Swim drop · Nina + João', 'Brief: Linen live'] },
  { day: 'Fri', date: 26, items: ['Linen live · Mariana'] },
  { day: 'Sat', date: 27, items: ['Weekend picks · 12 creators'] },
  { day: 'Sun', date: 28, items: ['Weekend picks · 12 creators'] }
];

/** Daily MARI15 uses for the last 14 days: a stable baseline, then the leak. */
export const leakUsage = [19, 21, 18, 22, 20, 19, 23, 21, 20, 24, 41, 58, 69, 76];
export const LEAK_BASELINE = 20;

export const brlk = (value: number) => `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
export const brl = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
