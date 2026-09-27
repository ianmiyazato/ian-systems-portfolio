import type { Swatch } from './mare';

/**
 * The one Maré catalog (US English), shared by the world simulation, every ops remote and the
 * consumer zone. Prices are BRL; sizes use US letters and US shoe sizes.
 */
export type Garment = 'shirt' | 'trousers' | 'knit' | 'dress' | 'bag' | 'sneaker' | 'shorts' | 'hat' | 'skirt' | 'tank' | 'sandal' | 'scarf';
export type CatalogItem = { sku: string; slug: string; name: string; garment: Garment; swatch: Swatch; colorName: string; department: 'Women' | 'Men' | 'Accessories' | 'Shoes'; price: number; sizes: string[]; fabric: string };

const apparel = ['XS', 'S', 'M', 'L', 'XL'];
const shoes = ['6', '7', '8', '9', '10'];

export const catalog: CatalogItem[] = [
  { sku: 'MR-18401', slug: 'natural-linen-shirt', name: 'Natural linen shirt', garment: 'shirt', swatch: 'linen', colorName: 'Natural', department: 'Women', price: 249, sizes: apparel, fabric: '100% linen · breathable weave' },
  { sku: 'MR-18372', slug: 'stone-wide-leg-pants', name: 'Stone wide-leg pants', garment: 'trousers', swatch: 'sand', colorName: 'Stone', department: 'Women', price: 289, sizes: apparel, fabric: 'Linen-cotton · relaxed leg' },
  { sku: 'MR-18190', slug: 'sea-salt-knit', name: 'Sea-salt open knit', garment: 'knit', swatch: 'sea', colorName: 'Sea salt', department: 'Women', price: 199, sizes: apparel, fabric: 'Open-knit cotton' },
  { sku: 'MR-18511', slug: 'linen-midi-dress', name: 'Linen midi dress', garment: 'dress', swatch: 'slate', colorName: 'Tide', department: 'Women', price: 319, sizes: apparel, fabric: 'Viscose-linen · midi length' },
  { sku: 'MR-17921', slug: 'canvas-tote', name: 'Canvas tote bag', garment: 'bag', swatch: 'clay', colorName: 'Clay', department: 'Accessories', price: 129, sizes: ['One size'], fabric: 'Heavy canvas · leather straps' },
  { sku: 'MR-18455', slug: 'leather-everyday-sneakers', name: 'Leather everyday sneakers', garment: 'sneaker', swatch: 'ink', colorName: 'Ink', department: 'Shoes', price: 359, sizes: shoes, fabric: 'Full-grain leather · rubber sole' },
  { sku: 'MR-18430', slug: 'linen-shorts', name: 'Linen shorts', garment: 'shorts', swatch: 'rose', colorName: 'Sunset', department: 'Men', price: 179, sizes: apparel, fabric: '100% linen' },
  { sku: 'MR-18314', slug: 'breeze-oxford-shirt', name: 'Breeze oxford shirt', garment: 'shirt', swatch: 'mist', colorName: 'Mist', department: 'Men', price: 229, sizes: apparel, fabric: 'Cotton oxford' },
  { sku: 'MR-18285', slug: 'pleated-midi-skirt', name: 'Pleated midi skirt', garment: 'skirt', swatch: 'sand', colorName: 'Sand', department: 'Women', price: 239, sizes: apparel, fabric: 'Recycled satin · knife pleats' },
  { sku: 'MR-18256', slug: 'straw-sun-hat', name: 'Straw sun hat', garment: 'hat', swatch: 'clay', colorName: 'Straw', department: 'Accessories', price: 149, sizes: ['One size'], fabric: 'Hand-woven paper straw' },
  { sku: 'MR-18227', slug: 'ribbed-tank-top', name: 'Ribbed tank top', garment: 'tank', swatch: 'rose', colorName: 'Blush', department: 'Women', price: 99, sizes: apparel, fabric: 'Organic cotton rib' },
  { sku: 'MR-18198', slug: 'leather-slide-sandals', name: 'Leather slide sandals', garment: 'sandal', swatch: 'ink', colorName: 'Ink', department: 'Shoes', price: 219, sizes: shoes, fabric: 'Vegetable-tanned leather' },
  { sku: 'MR-18169', slug: 'linen-drawstring-pants', name: 'Linen drawstring pants', garment: 'trousers', swatch: 'sea', colorName: 'Sea', department: 'Men', price: 259, sizes: apparel, fabric: '100% linen · drawstring waist' },
  { sku: 'MR-18140', slug: 'silk-square-scarf', name: 'Silk square scarf', garment: 'scarf', swatch: 'rose', colorName: 'Coral print', department: 'Accessories', price: 169, sizes: ['One size'], fabric: 'Mulberry silk twill' },
  { sku: 'MR-18111', slug: 'faux-leather-crossbody', name: 'Faux-leather crossbody bag', garment: 'bag', swatch: 'ink', colorName: 'Espresso', department: 'Accessories', price: 199, sizes: ['One size'], fabric: 'Plant-based faux leather' }
];

export const catalogBySku = (sku: string) => catalog.find((item) => item.sku === sku);
export const catalogBySlug = (slug: string) => catalog.find((item) => item.slug === slug);

export type Store = { code: string; name: string; km: number; courierMinutes: number };

/** The home store (Counter runs here) first, then nearby stores by distance. */
export const stores: Store[] = [
  { code: '#0412', name: 'Vila Nova Mall', km: 0, courierMinutes: 0 },
  { code: '#0405', name: 'Garden District', km: 2.4, courierMinutes: 28 },
  { code: '#0398', name: 'Downtown', km: 4.1, courierMinutes: 41 },
  { code: '#0431', name: 'South Beach', km: 7.8, courierMinutes: 64 },
  { code: '#0001', name: 'Online DC', km: 18.5, courierMinutes: 150 }
];

export const carrierNames = ['Rota Sul Express', 'Ligeiro Log', 'Via Norte', 'Correio Nacional'] as const;

/** Fictitious customers and staff (first names only in ops tools; last initial when needed). */
export const firstNames = ['Rafael', 'Luiza', 'Caio', 'Marina', 'Bruno', 'Taina', 'Nina', 'Joao', 'Lara', 'Rui', 'Beatriz', 'Otavio', 'Helena', 'Diego', 'Camila', 'Thiago', 'Yasmin', 'Pedro', 'Aline', 'Gustavo'] as const;

export type CreatorProfile = { name: string; handle: string; code: string; initials: string; level: 'Rising' | 'Core' | 'Star'; category: 'Swim' | 'Linen' | 'Street' | 'Accessories'; city: 'São Paulo' | 'Rio' | 'Recife' | 'Curitiba' | 'Salvador'; hue: number };

export const creatorRoster: CreatorProfile[] = [
  { name: 'Nina Costa', handle: '@ninac', code: 'NINA10', initials: 'NC', level: 'Star', category: 'Linen', city: 'São Paulo', hue: 0 },
  { name: 'Joao Martins', handle: '@joaomar', code: 'JOAO12', initials: 'JM', level: 'Core', category: 'Street', city: 'Rio', hue: 1 },
  { name: 'Mariana Luz', handle: '@mari.luz', code: 'MARI15', initials: 'ML', level: 'Star', category: 'Swim', city: 'Recife', hue: 2 },
  { name: 'Tomas Reis', handle: '@tomas.r', code: 'TOMAS8', initials: 'TR', level: 'Core', category: 'Street', city: 'São Paulo', hue: 3 },
  { name: 'Ana Kato', handle: '@anakato', code: 'ANAK10', initials: 'AK', level: 'Rising', category: 'Accessories', city: 'Curitiba', hue: 4 },
  { name: 'Bia Santos', handle: '@bia.s', code: 'BIA10', initials: 'BS', level: 'Core', category: 'Swim', city: 'Salvador', hue: 5 },
  { name: 'Leo Prado', handle: '@leoprado', code: 'LEO12', initials: 'LP', level: 'Rising', category: 'Linen', city: 'São Paulo', hue: 0 },
  { name: 'Duda Rocha', handle: '@duda.r', code: 'DUDA10', initials: 'DR', level: 'Star', category: 'Linen', city: 'Rio', hue: 1 },
  { name: 'Iris Moura', handle: '@irism', code: 'IRIS8', initials: 'IM', level: 'Rising', category: 'Swim', city: 'Recife', hue: 2 },
  { name: 'Theo Lima', handle: '@theolima', code: 'THEO10', initials: 'TL', level: 'Core', category: 'Accessories', city: 'Curitiba', hue: 3 },
  { name: 'Clara Nunes', handle: '@claran', code: 'CLARA12', initials: 'CN', level: 'Core', category: 'Street', city: 'Salvador', hue: 4 },
  { name: 'Rafa Dias', handle: '@rafadias', code: 'RAFA8', initials: 'RD', level: 'Rising', category: 'Street', city: 'São Paulo', hue: 5 }
];

/** en-US money: R$1,249.90 (BRL values, US formatting). */
export function brl(value: number, options: { cents?: boolean } = {}) {
  const fraction = options.cents ?? !Number.isInteger(value);
  return `R$${value.toLocaleString('en-US', { minimumFractionDigits: fraction ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export const brlCents = (cents: number) => brl(cents / 100, { cents: true });

/** Compact money for tiles: R$2.1M, R$84.2k. */
export function brlCompact(value: number) {
  if (Math.abs(value) >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 10_000) return `R$${(value / 1000).toFixed(1)}k`;
  return brl(Math.round(value));
}

export const count = (value: number) => Math.round(value).toLocaleString('en-US');

/** Editorial silhouettes (viewBox 0 0 240 230), filled with the product swatch in every zone. */
export const garmentPaths: Record<Garment, string> = {
  shirt: 'M70 40 L100 28 Q120 44 140 28 L170 40 L196 92 L170 104 L162 86 L162 200 L78 200 L78 86 L70 104 L44 92 Z M120 44 L120 200',
  trousers: 'M78 30 L162 30 L170 200 L130 200 L120 90 L110 200 L70 200 Z',
  knit: 'M66 46 Q120 20 174 46 L200 110 L176 118 L168 92 L168 196 L72 196 L72 92 L64 118 L40 110 Z',
  dress: 'M96 26 L144 26 L150 70 L184 200 L56 200 L90 70 Z',
  bag: 'M58 88 L182 88 L172 196 L68 196 Z M92 88 Q92 40 120 40 Q148 40 148 88',
  sneaker: 'M36 150 Q40 110 84 108 L120 96 Q150 120 196 128 Q214 132 212 156 L212 170 L36 170 Z',
  shorts: 'M70 50 L170 50 L182 150 L132 158 L120 100 L108 158 L58 150 Z',
  hat: 'M40 140 Q120 170 200 140 Q190 128 160 124 Q156 70 120 70 Q84 70 80 124 Q50 128 40 140 Z',
  skirt: 'M84 40 L156 40 L150 60 L190 196 L50 196 L90 60 Z M104 60 L96 196 M136 60 L144 196 M120 60 L120 196',
  tank: 'M92 30 Q120 60 148 30 L160 34 L158 80 L170 200 L70 200 L82 80 L80 34 Z',
  sandal: 'M50 160 Q60 130 110 128 L190 132 Q214 136 210 156 L208 168 L50 168 Z M96 128 Q120 104 150 130',
  scarf: 'M60 50 L180 50 L180 170 L60 170 Z M60 50 L180 170 M120 50 L180 110'
};
