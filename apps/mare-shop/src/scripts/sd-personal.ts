// Problem B: the story player, the speed race and the live pagination demo.
import { mountDeck } from '@portfolio/story-diagram/player';

type Item = { id?: string; name: string; price: string; tone: string; sizes?: string; store: string };
type PageFile = { next: string | null; items: Item[] };

const SECOND = 1000;

/** The race replays from zero on its first step; its resting markup is the finished race. */
function race(screen: HTMLElement): Animation[] {
  const root = screen.querySelector<SVGElement>('[data-anchor="sd-race"] svg');
  if (!root) return [];
  const animations: Animation[] = [];
  for (const segment of root.querySelectorAll<SVGRectElement>('[data-race-segment]')) {
    const from = Number(segment.dataset.from);
    const to = Number(segment.dataset.to);
    animations.push(segment.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: Math.max(80, (to - from) * SECOND), delay: from * SECOND, easing: 'linear', fill: 'backwards' }));
  }
  for (const element of root.querySelectorAll<SVGElement>('[data-race-label], [data-race-reveal]')) {
    const at = Number(element.dataset.raceLabel ?? element.dataset.raceReveal);
    animations.push(element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: at * SECOND, fill: 'backwards' }));
  }
  for (const mark of root.querySelectorAll<SVGElement>('.sd-race-mark, .sd-race-result')) {
    const lane = mark.classList.contains('sd-race-good') || mark.classList.contains('sd-race-good-line') ? 0.6 : 4.8;
    animations.push(mark.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: lane * SECOND, fill: 'backwards' }));
  }
  const head = root.querySelector<SVGLineElement>('[data-race-head]');
  if (head) {
    const travel = Number(head.ownerSVGElement?.viewBox.baseVal.width ?? 1200) - 236 - 30;
    const total = 5 * SECOND + 400;
    animations.push(head.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${travel}px)`, opacity: 1, offset: (5 * SECOND) / total }, { transform: `translateX(${travel}px)`, opacity: 0 }], { duration: total, easing: 'linear', fill: 'forwards' }));
  }
  return animations;
}

mountDeck(document.querySelector<HTMLElement>('[data-deck]')!, {
  effects: {
    'b-speed': ({ screen, step }) => (step === 1 ? race(screen) : [])
  }
});

// ---- the live demo --------------------------------------------------------------------------
const demo = document.querySelector<HTMLElement>('[data-anchor="sd-demo"]');
if (demo) {
  const ROW = 64;
  const OVERSCAN = 6;
  const TIMEOUT = 800;
  const list = demo.querySelector<HTMLElement>('[data-demo-list]')!;
  const spacer = demo.querySelector<HTMLElement>('[data-demo-spacer]')!;
  const readout = (key: string, text: string) => { const node = demo.querySelector(`[data-readout="${key}"]`); if (node) node.textContent = text; };
  const picks = JSON.parse(demo.dataset.picksJson ?? '[]') as Item[];
  const bestsellers = JSON.parse(demo.dataset.bestJson ?? '[]') as Item[];
  const base = demo.dataset.base!;
  const forced = Number(new URLSearchParams(location.search).get('ai'));

  let cls = 0;
  try {
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) cls += entry.value;
      readout('cls', cls.toFixed(3));
    }).observe({ type: 'layout-shift', buffered: true });
  } catch { /* layout-shift is Chromium-only; the readout stays at its measured default */ }

  let run = 0;
  let items: Item[] = [];
  let next: string | null = 'first';
  let loading = false;
  const prefetched = new Map<string, Promise<PageFile>>();
  let pool: HTMLElement[] = [];

  const load = (cursor: string) => {
    if (!prefetched.has(cursor)) prefetched.set(cursor, fetch(`${base}${cursor}.json`).then((response) => response.json() as Promise<PageFile>));
    return prefetched.get(cursor)!;
  };
  const idle = (callback: () => void) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(callback, { timeout: 600 }) : setTimeout(callback, 200));

  function card(item: Item) {
    const li = document.createElement('li');
    li.className = 'demo-card';
    li.innerHTML = '<span class="demo-swatch"></span><span class="demo-card-name"></span><span class="demo-card-meta"></span>';
    (li.children[0] as HTMLElement).style.background = item.tone;
    li.children[1]!.textContent = item.name;
    li.children[2]!.textContent = `${item.price} · ${item.store}`;
    return li;
  }

  function fill(title: string, cards: Item[]) {
    demo!.querySelector('[data-picks-title]')!.textContent = title;
    demo!.querySelector('[data-picks-row]')!.replaceChildren(...cards.map(card));
    demo!.querySelector<HTMLElement>('[data-picks-why]')!.textContent = title.startsWith('Picked')
      ? 'Why these: you saved linen dresses, you wear M, Vila Nova is nearby.'
      : 'The AI was slow, so we showed the cached answer: this week\'s bestsellers in size M.';
  }

  /** Recycle a fixed pool of rows: only what is on screen (plus overscan) exists in the page. */
  function draw() {
    const visible = Math.ceil(list.clientHeight / ROW);
    const size = Math.min(items.length, visible + OVERSCAN * 2);
    while (pool.length < size) {
      const row = document.createElement('div');
      row.className = 'demo-row';
      row.dataset.demoRow = '';
      row.setAttribute('role', 'listitem');
      row.innerHTML = '<span class="demo-swatch"></span><span class="demo-row-name"></span><span class="demo-row-meta"></span><span class="demo-row-price"></span>';
      spacer.append(row);
      pool.push(row);
    }
    const first = Math.max(0, Math.min(Math.floor(list.scrollTop / ROW) - OVERSCAN, items.length - size));
    pool.forEach((row, offset) => {
      const index = first + offset;
      const item = items[index];
      if (!item) return;
      if (row.dataset.index !== String(index)) {
        row.dataset.index = String(index);
        row.style.transform = `translateY(${index * ROW}px)`;
        (row.children[0] as HTMLElement).style.background = item.tone;
        row.children[1]!.textContent = item.name;
        row.children[2]!.textContent = `${item.sizes ?? ''} · ${item.store}`;
        row.children[3]!.textContent = item.price;
      }
    });
    readout('rows', String(pool.length));
    // Near the end of what is loaded: append the next page (usually already prefetched).
    const lastVisible = Math.floor((list.scrollTop + list.clientHeight) / ROW);
    if (next && !loading && lastVisible > items.length - 8) void more();
  }

  async function more() {
    if (!next) return;
    loading = true;
    const current = run;
    const page = await load(next);
    if (current !== run) return;
    items = items.concat(page.items);
    next = page.next;
    spacer.style.height = `${items.length * ROW}px`;
    readout('memory', String(items.length));
    loading = false;
    draw();
    // Prepare the following page while the shopper is still reading this one.
    if (next) { const upcoming = next; idle(() => { void load(upcoming); }); }
  }

  async function start() {
    run += 1;
    const current = run;
    const began = performance.now();
    items = [];
    next = 'first';
    loading = false;
    prefetched.clear();
    pool.forEach((row) => row.remove());
    pool = [];
    list.scrollTop = 0;
    spacer.style.height = '0px';
    readout('memory', '0');
    readout('rows', '0');
    readout('first', '–');
    readout('ai', 'waiting…');
    demo!.querySelector('[data-picks-title]')!.textContent = 'Finding picks for you…';
    demo!.querySelector('[data-picks-row]')!.querySelectorAll('.demo-card').forEach((node) => node.classList.add('is-skeleton'));

    // The page never waits for the AI: products load on their own.
    await more();
    if (current !== run) return;
    requestAnimationFrame(() => readout('first', `${Math.round(performance.now() - began)} ms`));

    const latency = forced > 0 ? forced : Math.round(200 + Math.random() * 1300);
    let settled = false;
    const fallback = window.setTimeout(() => {
      if (current !== run || settled) return;
      settled = true;
      fill('Bestsellers in your size', bestsellers);
      readout('ai', `still thinking at ${TIMEOUT} ms · fallback shown`);
    }, TIMEOUT);
    window.setTimeout(() => {
      if (current !== run) return;
      if (!settled) {
        settled = true;
        window.clearTimeout(fallback);
        fill('Picked for you', picks);
        readout('ai', `answered in ${latency} ms · picks shown`);
      } else {
        readout('ai', `answered in ${latency.toLocaleString('en-US')} ms, too late · fallback kept`);
      }
    }, latency);
  }

  let frame = 0;
  list.addEventListener('scroll', () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; draw(); });
  }, { passive: true });
  demo.querySelector('[data-demo-restart]')?.addEventListener('click', () => { void start(); });

  // Start the first time the demo is on screen (in presentation mode, on its step).
  const seen = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      seen.disconnect();
      void start();
    }
  }, { threshold: 0.25 });
  seen.observe(demo);
}
