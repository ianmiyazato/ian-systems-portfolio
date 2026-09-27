import { brl as money, catalogBySku, type CatalogItem, type Garment } from '@portfolio/mocks';

export type { Garment };
export type Product = CatalogItem & { badges: string[]; stock: string; creator?: string; soldOut?: string[]; why?: string };

/** The shop's merchandising layer over the shared catalog: badges, stock copy, creator picks, fit notes. */
const merch: Array<[string, Omit<Product, keyof CatalogItem>]> = [
  ['MR-18401', { badges: ['Pickup today'], stock: '2 left at Vila Nova Mall', soldOut: ['XS'], why: 'Loose linen layer, breathes in humidity, 2 left near you' }],
  ['MR-18372', { badges: ['Creator pick'], stock: 'In stock', creator: '@ninac', why: 'Relaxed leg in a linen blend; Nina styles it with the shirt' }],
  ['MR-18190', { badges: ['New'], stock: 'Low stock', soldOut: ['XL'], why: 'Open knit for cool evenings by the water' }],
  ['MR-18511', { badges: ['Pickup today'], stock: 'In stock', soldOut: ['M'], why: 'Midi length, light drape, pairs with the canvas tote' }],
  ['MR-17921', { badges: ['Creator pick'], stock: 'In stock', creator: '@joaomar' }],
  ['MR-18430', { badges: ['2 left'], stock: '2 left online' }]
];

export const products: Product[] = merch.map(([sku, extra]) => ({ ...catalogBySku(sku)!, ...extra }));

export const brl = (value: number) => money(value);
export const installments = (value: number) => `3× ${money(Math.round((value / 3) * 100) / 100, { cents: true })} interest-free`;
export const productBySlug = (slug: string) => products.find((product) => product.slug === slug)!;
