import { catalog, catalogBySku, int, rng, seedOf, stores, type CatalogItem, type Swatch } from '@portfolio/mocks';

export type Variant = { colorName: string; swatch: Swatch; sku: string };

const palette: Array<[string, Swatch]> = [['Tide', 'slate'], ['Sand', 'sand'], ['Ink', 'ink'], ['Sea', 'sea'], ['Clay', 'clay'], ['Blush', 'rose'], ['Natural', 'linen'], ['Mist', 'mist']];

/** Three colors per style: the catalog color first, then two stable alternates. */
export function variantsOf(item: CatalogItem): Variant[] {
  const random = rng(seedOf(item.sku));
  const others = palette.filter(([, swatch]) => swatch !== item.swatch);
  const picks = [others[int(random, 0, others.length - 1)]!, others[(int(random, 0, others.length - 1) + 3) % others.length]!];
  return [{ colorName: item.colorName, swatch: item.swatch, sku: item.sku }, ...picks.map(([colorName, swatch], index) => ({ colorName, swatch, sku: `${item.sku}-${index + 2}` }))];
}

/**
 * Units per size at a store, from the stock projection. The Linen midi dress is out of M at
 * Vila Nova on purpose: it is the case the AI tip and the "Pull" action were designed for.
 */
export function unitsAt(sku: string, store: string, sizes: string[]): number[] {
  const random = rng(seedOf(`${sku}:${store}`));
  return sizes.map((size) => {
    if (sku === 'MR-18511' && store === '#0412' && size === 'M') return 0;
    if (sku === 'MR-18511' && store === '#0412' && size === 'L') return 3;
    const roll = random();
    return roll < 0.14 ? 0 : roll < 0.3 ? int(random, 1, 2) : int(random, 3, 11);
  });
}

export const nearby = stores.slice(1);

export function search(query: string): CatalogItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return catalog.slice(0, 6);
  return catalog.filter((item) => `${item.name} ${item.sku} ${item.colorName}`.toLowerCase().includes(needle)).slice(0, 6);
}

export const itemFor = (sku: string | null) => catalogBySku((sku ?? 'MR-18511').replace(/-\d$/, '')) ?? catalogBySku('MR-18511')!;

/** Next size up, for the "runs small" tip. */
export const sizeUp = (sizes: string[], size: string) => sizes[Math.min(sizes.indexOf(size) + 1, sizes.length - 1)] ?? size;
