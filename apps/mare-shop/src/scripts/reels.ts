// Shoppable reels: start at ?reel=, only the reel in view plays, double-tap hearts, pause, items sheet.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const start = new URLSearchParams(location.search).get('reel');

function burst(reel: HTMLElement, x: number, y: number) {
  const spot = reel.querySelector<HTMLElement>('.rl-burst')!;
  spot.style.setProperty('--bx', `${x}px`);
  spot.style.setProperty('--by', `${y}px`);
  spot.classList.remove('go');
  void spot.offsetWidth;
  spot.classList.add('go');
}

function like(reel: HTMLElement, on?: boolean) {
  const button = reel.querySelector<HTMLButtonElement>('[data-like]')!;
  const was = button.getAttribute('aria-pressed') === 'true';
  const next = on ?? !was;
  if (next === was) return;
  button.setAttribute('aria-pressed', String(next));
  const count = Number(button.dataset.count) + (next ? 1 : 0);
  button.querySelector('span')!.textContent = count.toLocaleString('en-US');
}

function openItems(reel: HTMLElement, open: boolean) {
  const sheet = reel.querySelector<HTMLElement>('[data-items]')!;
  sheet.hidden = !open;
  reel.querySelector('[data-shop]')!.setAttribute('aria-expanded', String(open));
  reel.classList.toggle('is-shopping', open);
}

document.querySelectorAll<HTMLElement>('[data-reel-feed]').forEach((feed) => {
  const all = [...feed.querySelectorAll<HTMLElement>('[data-reel]')];
  const first = all.find((reel) => reel.dataset.reel === start) ?? all[0]!;
  feed.scrollTo({ top: first.offsetTop, behavior: 'instant' });
  if (feed.dataset.sheetOpen === 'true') openItems(first, true);

  // Only the reel on screen plays; the others hold still (and cost nothing).
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => (entry.target as HTMLElement).classList.toggle('is-active', entry.isIntersecting)), { root: feed, threshold: 0.6 });
  all.forEach((reel) => observer.observe(reel));

  all.forEach((reel) => {
    const stage = reel.querySelector<HTMLElement>('[data-stage]')!;
    let lastTap = 0;
    stage.addEventListener('pointerup', (event) => {
      if ((event.target as HTMLElement).closest('a, button')) return;
      const now = performance.now();
      if (now - lastTap < 320) {
        const box = stage.getBoundingClientRect();
        like(reel, true);
        if (!reduce) burst(reel, event.clientX - box.left, event.clientY - box.top);
        lastTap = 0;
      } else lastTap = now;
    });
    reel.querySelector('[data-like]')!.addEventListener('click', () => like(reel));
    const pause = reel.querySelector<HTMLButtonElement>('[data-pause]')!;
    pause.addEventListener('click', () => {
      const paused = reel.classList.toggle('is-paused');
      pause.setAttribute('aria-pressed', String(paused));
      pause.textContent = paused ? 'Play' : 'Pause';
    });
    reel.querySelector('[data-shop]')!.addEventListener('click', () => openItems(reel, true));
    reel.querySelector('[data-close-items]')!.addEventListener('click', () => openItems(reel, false));
    const note = reel.querySelector<HTMLElement>('[data-note]')!;
    const creator = reel.getAttribute('aria-label')!.match(/@[\w.]+/)?.[0] ?? 'the creator';
    reel.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((add) => add.addEventListener('click', () => {
      const on = add.getAttribute('aria-pressed') !== 'true';
      add.setAttribute('aria-pressed', String(on));
      add.textContent = on ? 'Added' : 'Add';
    }));
    reel.querySelector('[data-add-all]')!.addEventListener('click', () => {
      reel.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((add) => { add.setAttribute('aria-pressed', 'true'); add.textContent = 'Added'; });
      note.textContent = `Added to your bag · ${creator} earns the commission through Circle`;
    });
  });
});

export {};
