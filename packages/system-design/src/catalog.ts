/**
 * 2,000 synthetic products for the pagination demo, sorted by a stable key (popularity, then
 * id) and cut into 24-item pages. Each page names the cursor of the next, and the site
 * publishes one static JSON file per cursor, so paging costs nothing to serve.
 */
export const CATALOG_SIZE = 2000;
export const PAGE_SIZE = 24;

export type Product = { id: string; name: string; price: number; tone: string; toneName: string; sizes: string[]; store: string; popularity: number };
export type Page = { items: Product[]; next: string | null };

const materials = ['Linen', 'Cotton', 'Silk', 'Knit', 'Denim', 'Poplin', 'Seersucker', 'Crochet', 'Gauze', 'Twill'];
const types = ['midi dress', 'shirt', 'wide-leg pants', 'blazer', 'tank', 'skirt', 'shorts', 'cardigan', 'jumpsuit', 'tote', 'wrap top', 'maxi dress'];
const tones: Array<[string, string]> = [['sand', '#D8C3A5'], ['olive', '#8A8B5B'], ['ivory', '#EFE8DA'], ['terracotta', '#C0714F'], ['navy', '#2E3A59'], ['sage', '#A7B59E'], ['clay', '#B98B73'], ['stone', '#A39E93']];
const stores = ['Vila Nova', 'Jardins', 'Pinheiros', 'Moema', 'Online only'];
const sizes = ['XS', 'S', 'M', 'L', 'XL'];

/** mulberry32: small, fast and deterministic. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cache: Product[] | null = null;

export function catalog(): Product[] {
  if (cache) return cache;
  const next = random(2026);
  const pick = <T>(list: T[]) => list[Math.floor(next() * list.length)]!;
  const items: Product[] = Array.from({ length: CATALOG_SIZE }, (_, index) => {
    const [toneName, tone] = pick(tones);
    const available = sizes.filter(() => next() > 0.3);
    return {
      id: `p${String(index + 1).padStart(4, '0')}`,
      name: `${pick(materials)} ${pick(types)}`,
      price: (149 + Math.floor(next() * 75) * 10) * 100 + 90,
      tone,
      toneName,
      sizes: available.length ? available : ['M'],
      store: pick(stores),
      popularity: Math.floor(next() * 1000)
    };
  });
  cache = items.sort((a, b) => b.popularity - a.popularity || (a.id < b.id ? -1 : 1));
  return cache;
}

/** Opaque cursor: the sort key of the last item on the previous page, in base 36. */
const encode = (item: Product) => `${item.popularity.toString(36)}${Number(item.id.slice(1)).toString(36).padStart(3, '0')}`;

export function catalogPage(cursor: string | null): Page {
  const items = catalog();
  const start = cursor ? items.findIndex((item) => encode(item) === cursor) + 1 : 0;
  if (cursor && start === 0) throw new Error(`unknown cursor ${cursor}`);
  const slice = items.slice(start, start + PAGE_SIZE);
  const last = slice.at(-1);
  return { items: slice, next: last && start + PAGE_SIZE < items.length ? encode(last) : null };
}

/** Every static page file: the first page is "first", the rest are named by their cursor. */
export function cursorFiles(): Array<{ cursor: string; page: Page }> {
  const files: Array<{ cursor: string; page: Page }> = [];
  let cursor: string | null = null;
  do {
    const page = catalogPage(cursor);
    files.push({ cursor: cursor ?? 'first', page });
    cursor = page.next;
  } while (cursor);
  return files;
}

export const formatBRL = (cents: number) => `R$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
