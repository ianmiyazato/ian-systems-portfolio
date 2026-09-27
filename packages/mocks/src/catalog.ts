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

export type CreatorProfile = { name: string; handle: string; code: string; initials: string; level: 'Rising' | 'Core' | 'Star'; category: 'Swim' | 'Linen' | 'Street' | 'Accessories'; city: 'Sao Paulo' | 'Rio' | 'Recife' | 'Curitiba' | 'Salvador'; hue: number };

export const creatorRoster: CreatorProfile[] = [
  { name: 'Nina Costa', handle: '@ninac', code: 'NINA10', initials: 'NC', level: 'Star', category: 'Linen', city: 'Sao Paulo', hue: 0 },
  { name: 'Joao Martins', handle: '@joaomar', code: 'JOAO12', initials: 'JM', level: 'Core', category: 'Street', city: 'Rio', hue: 1 },
  { name: 'Mariana Luz', handle: '@mari.luz', code: 'MARI15', initials: 'ML', level: 'Star', category: 'Swim', city: 'Recife', hue: 2 },
  { name: 'Tomas Reis', handle: '@tomas.r', code: 'TOMAS8', initials: 'TR', level: 'Core', category: 'Street', city: 'Sao Paulo', hue: 3 },
  { name: 'Ana Kato', handle: '@anakato', code: 'ANAK10', initials: 'AK', level: 'Rising', category: 'Accessories', city: 'Curitiba', hue: 4 },
  { name: 'Bia Santos', handle: '@bia.s', code: 'BIA10', initials: 'BS', level: 'Core', category: 'Swim', city: 'Salvador', hue: 5 },
  { name: 'Leo Prado', handle: '@leoprado', code: 'LEO12', initials: 'LP', level: 'Rising', category: 'Linen', city: 'Sao Paulo', hue: 0 },
  { name: 'Duda Rocha', handle: '@duda.r', code: 'DUDA10', initials: 'DR', level: 'Star', category: 'Linen', city: 'Rio', hue: 1 },
  { name: 'Iris Moura', handle: '@irism', code: 'IRIS8', initials: 'IM', level: 'Rising', category: 'Swim', city: 'Recife', hue: 2 },
  { name: 'Theo Lima', handle: '@theolima', code: 'THEO10', initials: 'TL', level: 'Core', category: 'Accessories', city: 'Curitiba', hue: 3 },
  { name: 'Clara Nunes', handle: '@claran', code: 'CLARA12', initials: 'CN', level: 'Core', category: 'Street', city: 'Salvador', hue: 4 },
  { name: 'Rafa Dias', handle: '@rafadias', code: 'RAFA8', initials: 'RD', level: 'Rising', category: 'Street', city: 'Sao Paulo', hue: 5 }
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
