import { describe, expect, it } from 'vitest';
import { CATALOG_SIZE, PAGE_SIZE, catalog, catalogPage, cursorFiles, formatBRL } from '../src/catalog';

describe('synthetic catalog for the pagination demo', () => {
  it('has 2,000 deterministic products', () => {
    expect(CATALOG_SIZE).toBe(2000);
    expect(catalog()).toHaveLength(2000);
    expect(catalog()).toEqual(catalog());
    expect(new Set(catalog().map((item) => item.id)).size).toBe(2000);
  });

  it('uses a stable sort key: popularity, then id', () => {
    const items = catalog();
    for (let index = 1; index < items.length; index += 1) {
      const a = items[index - 1]!;
      const b = items[index]!;
      expect(a.popularity > b.popularity || (a.popularity === b.popularity && a.id < b.id)).toBe(true);
    }
  });

  it('serves 24 items per page with an opaque cursor to the next page', () => {
    const first = catalogPage(null);
    expect(PAGE_SIZE).toBe(24);
    expect(first.items).toHaveLength(24);
    expect(first.next).toMatch(/^[a-z0-9]+$/);
    const second = catalogPage(first.next);
    expect(second.items[0]!.id).toBe(catalog()[24]!.id);
    expect(second.items.some((item) => first.items.includes(item))).toBe(false);
  });

  it('walks every product exactly once and ends with no cursor', () => {
    let cursor: string | null = null;
    const seen: string[] = [];
    let pages = 0;
    do {
      const page = catalogPage(cursor);
      seen.push(...page.items.map((item) => item.id));
      cursor = page.next;
      pages += 1;
    } while (cursor);
    expect(seen).toEqual(catalog().map((item) => item.id));
    expect(pages).toBe(Math.ceil(2000 / 24));
  });

  it('writes one static file per cursor, first page included', () => {
    const files = cursorFiles();
    expect(files).toHaveLength(Math.ceil(2000 / 24));
    expect(files[0]!.cursor).toBe('first');
  });

  it('formats money as BRL with en-US grouping', () => {
    expect(formatBRL(124990)).toBe('R$1,249.90');
    expect(formatBRL(14990)).toBe('R$149.90');
  });
});
