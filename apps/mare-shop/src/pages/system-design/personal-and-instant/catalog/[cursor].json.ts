// One static JSON file per cursor page of the 2,000-product demo catalog (84 files, ~3 kB each).
import type { APIRoute, GetStaticPaths } from 'astro';
import { cursorFiles, formatBRL, type Page } from '@portfolio/system-design';

export const getStaticPaths = (() => cursorFiles().map(({ cursor, page }) => ({ params: { cursor }, props: { page } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const page = props.page as Page;
  const body = { next: page.next, items: page.items.map((item) => ({ id: item.id, name: item.name, price: formatBRL(item.price), tone: item.tone, sizes: item.sizes.join(' '), store: item.store })) };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};
