// Phone frames: start each track on its screen, sync the dots, typing search, card flip.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll<HTMLElement>('.phone-track').forEach((track) => {
  const dots = [...(track.nextElementSibling?.querySelectorAll<HTMLButtonElement>('[data-go]') ?? [])];
  const go = (index: number, smooth = true) => track.scrollTo({ left: index * track.clientWidth, behavior: smooth && !reduce ? 'smooth' : 'instant' });
  go(Number(track.dataset.start ?? 0), false);
  dots.forEach((dot) => dot.addEventListener('click', () => go(Number(dot.dataset.go))));
  track.addEventListener('scroll', () => {
    const index = Math.round(track.scrollLeft / track.clientWidth);
    dots.forEach((dot, position) => dot.setAttribute('aria-current', String(position === index)));
  }, { passive: true });
});

document.querySelectorAll<HTMLButtonElement>('.pa-flip').forEach((card) => card.addEventListener('click', () => card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'))));

document.querySelectorAll<HTMLElement>('[data-typing]').forEach((node) => {
  if (reduce) return;
  const phrases = node.dataset.typing!.split('|');
  let phrase = 0;
  let chars = phrases[0]!.length;
  let hold = 30;
  let direction: 1 | -1 = -1;
  window.setInterval(() => {
    const text = phrases[phrase]!;
    if (hold > 0) { hold -= 1; return; }
    chars += direction;
    if (chars <= 0) { direction = 1; phrase = (phrase + 1) % phrases.length; chars = 0; }
    else if (chars >= text.length) { direction = -1; hold = 30; }
    node.textContent = phrases[phrase]!.slice(0, chars);
  }, 60);
});

/* Pay: private by default. Amounts render masked; the eye reveals them for this screen only. */
document.querySelectorAll<HTMLElement>('[data-private]').forEach((screen) => {
  const eye = screen.querySelector<HTMLButtonElement>('[data-eye]');
  const masked = new Map<HTMLElement, string>();
  eye?.addEventListener('click', () => {
    const show = eye.getAttribute('aria-pressed') !== 'true';
    eye.setAttribute('aria-pressed', String(show));
    eye.setAttribute('aria-label', show ? 'Hide amounts' : 'Show amounts');
    screen.dataset.private = String(!show);
    screen.querySelectorAll<HTMLElement>('.pa-private').forEach((node) => {
      if (!masked.has(node)) masked.set(node, node.innerHTML);
      node.innerHTML = show ? node.dataset.value! : masked.get(node)!;
    });
  });
});

export {};
