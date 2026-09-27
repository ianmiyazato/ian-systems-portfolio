// Shop home islands: progressive rows (skeleton → content), hover-intent expansion, row arrows, save.

const INTENT_MS = 300;
const state = () => new URLSearchParams(location.search).get('state') ?? 'live';

/* Skeleton → content: each row "arrives" on its own, above-the-fold first (?state=loading holds the skeletons). */
const rowDelays = [180, 420, 680];
function reveal() {
  document.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => {
    if (state() === 'loading') return row.classList.remove('is-ready');
    const order = Number(row.dataset.row);
    row.setAttribute('aria-busy', 'true');
    window.setTimeout(() => {
      row.classList.add('is-ready');
      row.removeAttribute('aria-busy');
    }, rowDelays[order] ?? 800);
  });
}

/* Hover intent: a card grows only after the pointer rests for 300 ms, so sweeping across a row doesn't pop every card. */
let intent = 0;
let expanded: HTMLElement | null = null;
const collapse = () => {
  expanded?.classList.remove('is-expanded');
  expanded = null;
};
function expand(tile: HTMLElement) {
  if (expanded === tile) return;
  collapse();
  const track = tile.parentElement!.getBoundingClientRect();
  const box = tile.getBoundingClientRect();
  // Cards at the edges grow inward so they never clip against the track.
  tile.dataset.origin = box.left - track.left < 40 ? 'left' : track.right - box.right < 40 ? 'right' : 'center';
  tile.classList.add('is-expanded');
  expanded = tile;
}

const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
if (canHover) {
  document.addEventListener('pointerover', (event) => {
    const tile = (event.target as HTMLElement).closest<HTMLElement>('.cs-row.is-ready .cs-tile');
    if (!tile || tile === expanded) return;
    window.clearTimeout(intent);
    intent = window.setTimeout(() => expand(tile), INTENT_MS);
  });
  document.addEventListener('pointerout', (event) => {
    const tile = (event.target as HTMLElement).closest<HTMLElement>('.cs-tile');
    const to = (event.relatedTarget as HTMLElement | null)?.closest('.cs-tile');
    if (!tile || to === tile) return;
    window.clearTimeout(intent);
    if (tile === expanded) collapse();
  });
}
// Keyboard users get the same card immediately: focus has no "sweep" to filter out.
document.addEventListener('focusin', (event) => {
  const tile = (event.target as HTMLElement).closest<HTMLElement>('.cs-tile');
  if (tile) expand(tile);
  else collapse();
});

/* Row arrows scroll by one viewport of cards. */
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const arrow = target.closest<HTMLElement>('[data-row-scroll]');
  if (arrow) {
    const track = arrow.closest('.cs-row')!.querySelector<HTMLElement>('.cs-track')!;
    track.scrollBy({ left: Number(arrow.dataset.rowScroll) * track.clientWidth * 0.85, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  const save = target.closest<HTMLElement>('[data-save]');
  if (save) {
    const on = save.getAttribute('aria-pressed') !== 'true';
    save.setAttribute('aria-pressed', String(on));
    save.textContent = on ? 'Saved' : 'Save';
  }
});

reveal();

export {};
