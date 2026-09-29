// Maré · storefront: the story player, plus the live demo of one deal on Black Friday night.
import { mountDeck } from '@portfolio/story-diagram/player';

mountDeck(document.querySelector<HTMLElement>('[data-deck]')!);

const demo = document.querySelector<HTMLElement>('[data-live-demo]');
if (demo) {
  const STOCK = Number(demo.dataset.stock);
  const RESERVE_MS = 450;
  const $ = <T extends HTMLElement>(selector: string) => demo.querySelector<T>(selector)!;
  const band = $('[data-lv-band]');
  const add = $<HTMLButtonElement>('[data-lv-add]');
  const status = $('[data-lv-status]');
  const bagCount = $('[data-lv-bag]');
  const stockReadout = $('[data-readout="stock"]');
  const video = $('[data-lv-video]');
  const banner = $('[data-lv-banner]');
  const levelName = $('[data-lv-level-name]');
  let stock = STOCK;
  let bag = 0;
  let level = 0;
  let pending = false;
  let timer = 0;

  const bandOf = (units: number) => (units > 20 ? 'in' : units > 0 ? 'few' : 'out');
  const bandText = { in: 'In stock', few: 'Few left', out: 'Sold out' } as const;
  const say = (text: string) => { status.textContent = text || ' '; };
  const twin = (name: string, on: boolean) => {
    const element = $(`[data-lv-twin="${name}"]`);
    element.classList.toggle('is-off', !on);
    if (on) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', 'true');
  };

  function render() {
    const current = bandOf(stock);
    band.dataset.lvBand = current;
    band.textContent = bandText[current];
    stockReadout.textContent = String(stock);
    add.textContent = pending ? 'Reserving…' : current === 'out' ? 'Notify me' : 'Add to bag';
    add.setAttribute('aria-busy', String(pending));
    bagCount.textContent = String(bag);
    demo!.dataset.level = String(level);
    for (const button of demo!.querySelectorAll<HTMLButtonElement>('[data-lv-level]')) {
      const on = Number(button.dataset.lvLevel) === level;
      button.setAttribute('aria-pressed', String(on));
      if (on) levelName.textContent = `L${level} · ${button.dataset.name}`;
    }
    // Each extra has a simpler twin already in the page; the busy level only chooses which one shows.
    twin('personal', level === 0);
    twin('best', level >= 1);
    twin('filters-all', level < 2);
    twin('filters-few', level >= 2);
    video.textContent = level === 0 ? '▶ Video playing' : 'Photo only · video off';
    banner.classList.toggle('is-on', level === 4);
  }

  $('[data-lv-others]').addEventListener('click', () => {
    stock = Math.max(0, stock - 10);
    render();
  });

  add.addEventListener('click', () => {
    if (pending) return;
    const current = bandOf(stock);
    if (current === 'out') { say("We'll tell you when it's back in your size."); return; }
    if (current === 'in') {
      // Plenty left: update at once; the reservation confirms in the background.
      stock -= 1;
      bag += 1;
      say('Added to bag ✓');
      render();
      return;
    }
    // A few left: never promise what might be gone. Reserve first, then confirm.
    pending = true;
    say('Checking the last units…');
    render();
    timer = window.setTimeout(() => {
      pending = false;
      if (stock > 0) {
        stock -= 1;
        bag += 1;
        say('Reserved for 20 min ✓');
      } else say("Just sold out. We'll tell you if it's back.");
      render();
    }, RESERVE_MS);
  });

  $('[data-lv-checkout]').addEventListener('click', () => {
    if (!bag) say('Your bag is empty.');
    else if (level === 3) say("You're in line · about 2 min · your bag stays reserved.");
    else say(level === 4 ? 'Checkout open, in busy mode ✓' : 'Checkout open ✓ (simulated)');
  });

  for (const button of demo.querySelectorAll<HTMLButtonElement>('[data-lv-level]')) {
    button.addEventListener('click', () => { level = Number(button.dataset.lvLevel); render(); });
  }

  $('[data-lv-reset]').addEventListener('click', () => {
    clearTimeout(timer);
    stock = STOCK;
    bag = 0;
    level = 0;
    pending = false;
    say('');
    render();
  });

  render();

  // An honest readout: every layout shift inside the demo after the page settles counts, even the
  // ones right after a click. Page setup is not the demo: wait for load, fonts and (when presenting)
  // the 16:9 stage, as the v0.3 demo does, then two frames.
  const readout = $('[data-readout="cls"]');
  const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  async function settled() {
    if (document.readyState !== 'complete') await new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
    await document.fonts.ready;
    const screen = demo!.closest<HTMLElement>('[data-screen]');
    if (screen && new URLSearchParams(location.search).get('present') === '1') {
      for (let tries = 0; tries < 120; tries += 1) {
        const scale = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sd-scale')) || 1;
        if (getComputedStyle(screen).position === 'fixed' && Math.abs(screen.getBoundingClientRect().width - 1600 * scale) < 1) break;
        await frame();
      }
    }
    await frame();
    await frame();
  }
  void settled().then(() => {
    const start = performance.now();
    let total = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; sources?: Array<{ node?: Node | null }> }>) {
        if (entry.startTime < start) continue;
        if (!entry.sources?.some((source) => source.node && demo.contains(source.node))) continue;
        total += entry.value;
        readout.textContent = total.toFixed(3);
      }
    }).observe({ type: 'layout-shift' });
  });
}
