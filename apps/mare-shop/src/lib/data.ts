import { brl as money, catalogBySku, catalogBySlug, type CatalogItem, type Garment } from '@portfolio/mocks';

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

/* Home: stories, rows ------------------------------------------------------------------------ */

export type StoryFrame = { caption: string; slug: string; tag: string };
export type Story = { id: string; label: string; kind: 'creator' | 'store'; initials: string; frames: StoryFrame[] };

/** Creator stories and the "store live" story: each frame tags one product you can open. */
export const stories: Story[] = [
  { id: 'vila-nova', label: 'Vila Nova · live', kind: 'store', initials: 'VN', frames: [
    { caption: 'Just in at Vila Nova: the Tide midi dress, 4 on the rail.', slug: 'linen-midi-dress', tag: 'Linen midi dress · 4 in store' },
    { caption: 'The natural linen shirt is almost gone here. 2 left in M.', slug: 'natural-linen-shirt', tag: 'Natural linen shirt · 2 left' }
  ] },
  { id: 'ninac', label: '@ninac', kind: 'creator', initials: 'NC', frames: [
    { caption: 'My humid-weekend uniform: the shirt, open, over the tank.', slug: 'natural-linen-shirt', tag: 'Natural linen shirt' },
    { caption: 'Then the wide-leg pants for dinner by the water.', slug: 'stone-wide-leg-pants', tag: 'Stone wide-leg pants' },
    { caption: 'Code NINA10 takes 10% off both this week.', slug: 'ribbed-tank-top', tag: 'Ribbed tank top' }
  ] },
  { id: 'mari-luz', label: '@mari.luz', kind: 'creator', initials: 'ML', frames: [
    { caption: 'Beach to bar in one bag. The tote fits a towel and a knit.', slug: 'canvas-tote', tag: 'Canvas tote bag' },
    { caption: 'The sea-salt knit for when the wind picks up.', slug: 'sea-salt-knit', tag: 'Sea-salt open knit' }
  ] },
  { id: 'joaomar', label: '@joaomar', kind: 'creator', initials: 'JM', frames: [
    { caption: 'Linen shorts, sunset color, zero ironing.', slug: 'linen-shorts', tag: 'Linen shorts' },
    { caption: 'Oxford shirt with the sleeves pushed up. Done.', slug: 'breeze-oxford-shirt', tag: 'Breeze oxford shirt' }
  ] },
  { id: 'duda-r', label: '@duda.r', kind: 'creator', initials: 'DR', frames: [
    { caption: 'Pleats that move when you do.', slug: 'pleated-midi-skirt', tag: 'Pleated midi skirt' },
    { caption: 'The straw hat is the whole outfit, honestly.', slug: 'straw-sun-hat', tag: 'Straw sun hat' }
  ] },
  { id: 'anakato', label: '@anakato', kind: 'creator', initials: 'AK', frames: [
    { caption: 'Silk scarf three ways: hair, bag, neck.', slug: 'silk-square-scarf', tag: 'Silk square scarf' },
    { caption: 'And the crossbody that goes with all three.', slug: 'faux-leather-crossbody', tag: 'Faux-leather crossbody bag' }
  ] },
  { id: 'theolima', label: '@theolima', kind: 'creator', initials: 'TL', frames: [
    { caption: 'Slides for the city, not just the beach.', slug: 'leather-slide-sandals', tag: 'Leather slide sandals' },
    { caption: 'Drawstring linen, the laziest good trousers.', slug: 'linen-drawstring-pants', tag: 'Linen drawstring pants' }
  ] }
];

export type RowItem = { product: CatalogItem; note: string; progress?: number };
export type Row = { id: string; title: string; kicker: string; anchor?: string; items: RowItem[] };

const item = (slug: string, note: string, progress?: number): RowItem => ({ product: catalogBySlug(slug)!, note, progress });

/** Three rows, fetched separately (skeleton → content, above-the-fold row first). */
export const rows: Row[] = [
  { id: 'continue', title: 'Continue shopping', kicker: 'Where you left off', anchor: 'cs-row-continue', items: [
    item('linen-midi-dress', 'Viewed yesterday · size M saved', 0.7),
    item('stone-wide-leg-pants', 'In your bag', 0.9),
    item('straw-sun-hat', 'Viewed 3 days ago', 0.3),
    item('leather-slide-sandals', 'Price dropped R$20', 0.5),
    item('silk-square-scarf', 'Viewed last week', 0.2)
  ] },
  { id: 'picked', title: 'Picked for you', kicker: 'Your size, your store', anchor: 'cs-picked', items: products.map((product) => ({ product, note: product.stock })) },
  { id: 'pickup', title: 'Pickup in 2 h near you', kicker: 'Shopping Vila Nova · 1.2 mi', anchor: 'cs-row-pickup', items: [
    item('natural-linen-shirt', '2 left · ready by 18:00'),
    item('linen-midi-dress', '4 in store · ready by 18:00'),
    item('canvas-tote', '6 in store · ready in 1 h'),
    item('ribbed-tank-top', '9 in store · ready in 1 h'),
    item('leather-everyday-sneakers', '3 in store · ready by 18:00'),
    item('linen-shorts', '5 in store · ready in 2 h')
  ] }
];
