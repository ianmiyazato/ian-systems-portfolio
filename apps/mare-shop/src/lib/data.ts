export type Garment = 'shirt' | 'trousers' | 'knit' | 'dress' | 'bag' | 'sneaker' | 'shorts' | 'hat';
export type Product = {
  slug: string; name: string; price: number; garment: Garment; swatch: string; colorName: string;
  badges: string[]; stock: string; creator?: string; sizes: string[]; soldOut?: string[]; fabric: string; why?: string;
};

export const products: Product[] = [
  { slug: 'camisa-linho-natural', name: 'Camisa linho natural', price: 249, garment: 'shirt', swatch: 'linen', colorName: 'Natural', badges: ['Pickup today'], stock: '2 left at Vila Nova', sizes: ['PP', 'P', 'M', 'G', 'GG'], soldOut: ['PP'], fabric: '100% linen · breathable weave', why: 'Loose linen layer, breathes in humidity, 2 left near you' },
  { slug: 'calca-costa-pedra', name: 'Calça costa pedra', price: 289, garment: 'trousers', swatch: 'sand', colorName: 'Stone', badges: ['Creator pick'], stock: 'In stock', creator: '@ninac', sizes: ['36', '38', '40', '42', '44'], fabric: 'Linen-cotton · relaxed leg', why: 'Relaxed leg in a linen blend; Nina styles it with the shirt' },
  { slug: 'trico-sal', name: 'Tricô sal', price: 199, garment: 'knit', swatch: 'sea', colorName: 'Sea salt', badges: ['New'], stock: 'Low stock', sizes: ['P', 'M', 'G'], fabric: 'Open-knit cotton', why: 'Open knit for cool evenings by the water' },
  { slug: 'vestido-mare', name: 'Vestido maré', price: 319, garment: 'dress', swatch: 'slate', colorName: 'Tide', badges: ['Pickup today'], stock: 'In stock', sizes: ['PP', 'P', 'M', 'G'], fabric: 'Viscose-linen · midi', why: 'Midi length, light drape, pairs with the canvas tote' },
  { slug: 'bolsa-lona', name: 'Bolsa lona', price: 129, garment: 'bag', swatch: 'clay', colorName: 'Clay', badges: ['Creator pick'], stock: 'In stock', creator: '@joaomar', sizes: ['U'], fabric: 'Heavy canvas · leather straps' },
  { slug: 'bermuda-linho', name: 'Bermuda linho', price: 179, garment: 'shorts', swatch: 'rose', colorName: 'Sunset', badges: ['2 left'], stock: '2 left online', sizes: ['38', '40', '42'], fabric: '100% linen' }
];

export const brl = (value: number) => `R$ ${value.toLocaleString('pt-BR')}`;
export const installments = (value: number) => `3× ${brl(Math.round(value / 3))} sem juros`;
export const productBySlug = (slug: string) => products.find((product) => product.slug === slug)!;
