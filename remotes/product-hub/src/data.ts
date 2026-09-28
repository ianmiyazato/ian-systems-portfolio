import { catalog, rng, series, pick, int, type Swatch } from '@portfolio/mocks';

export type Status = 'Review price' | 'Low margin' | 'Missing offer' | 'Low stock' | 'Healthy' | 'Rejected';
export type Product = { id: string; sku: string; name: string; swatch: Swatch; owner: string; stock: number; price: number; margin: number; spark: number[]; status: Status; department: string; channel: string };

const statuses: Status[] = ['Review price', 'Healthy', 'Low stock', 'Missing offer', 'Healthy', 'Low margin', 'Healthy', 'Review price', 'Healthy', 'Low margin', 'Healthy', 'Missing offer', 'Low stock', 'Healthy'];

/** The catalog table is the shared Maré catalog; product 510233 is the Natural linen shirt. */
export const products: Product[] = catalog.slice(0, 14).map((item, index) => {
  const random = rng(510233 + index);
  return {
    id: String(510233 + index * 7),
    sku: item.sku,
    name: item.name,
    swatch: item.swatch,
    owner: pick(random, ['Lara', 'Nina', 'Rui', 'Otavio']),
    stock: index === 0 ? 184 : statuses[index] === 'Low stock' ? int(random, 4, 16) : int(random, 60, 420),
    price: item.price,
    margin: index === 0 ? 42 : statuses[index] === 'Low margin' ? int(random, 22, 29) : int(random, 36, 54),
    spark: series(700 + index, 28, 40, 7, statuses[index] === 'Review price' ? -0.5 : 0.3),
    status: statuses[index]!,
    department: item.department,
    channel: index % 3 === 0 ? 'Marketplace' : index % 3 === 1 ? 'Site' : 'App'
  };
});

export const facets = {
  views: [['Summer · needs action', 24], ['Low margin', 8], ['Missing offers', 5], ['My SKUs', 61]] as const,
  channel: [['Site', 1204], ['App', 1188], ['Marketplace', 642]] as const,
  department: [['Women', 612], ['Men', 388], ['Accessories', 204], ['Shoes', 116]] as const,
  status: [['Review price', 11], ['Low margin', 8], ['Missing offer', 5], ['Low stock', 9], ['Healthy', 1284]] as const
};

export const product = {
  id: '510233', sku: 'MR-18401', name: 'Natural linen shirt', tags: ['Summer 27', 'Linen', 'Best seller'], cost: 144.4, price: 249, competitorMedian: 231,
  priceHistory: [259, 259, 259, 249, 249, 249, 249, 249, 249, 249, 249, 249],
  sellThrough: [38, 41, 44, 47, 46, 49, 52, 51, 50, 48, 46, 44],
  forecast: [44, 49, 53, 56, 58],
  stores: ['Vila Nova Mall', 'Downtown', 'South Beach', 'Garden District', 'Online DC'],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  stock: [[4, 9, 14, 8, 2], [2, 6, 11, 7, 3], [0, 3, 5, 4, 1], [6, 10, 16, 9, 4], [18, 24, 31, 22, 9]],
  offers: [
    { seller: 'Maré', price: 249, rating: '4.8', ship: 'Tomorrow', buyBox: true },
    { seller: 'Linho & Co', price: 259, rating: '4.6', ship: '2 days', buyBox: false },
    { seller: 'Casa Ribeira', price: 265, rating: '4.4', ship: '3 days', buyBox: false }
  ],
  changes: [
    ['Sep 12', 'Lara', 'Price R$259 → R$249', 'Approved'],
    ['Sep 3', 'Pricing agent', 'Proposed R$239 · margin 39.6%', 'Rejected · parity'],
    ['Aug 28', 'Nina', 'Added marketplace offer', 'Approved']
  ] as Array<[string, string, string, string]>
};
