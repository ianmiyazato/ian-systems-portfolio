// Product page islands: gallery tabs + zoom, delivery cutoff on the world clock, fit hint, bundle math.
import { brl } from '@portfolio/mocks';
import { getWorld, localHour } from '@portfolio/world';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Gallery: thumbnails are tabs (arrow keys move between them). */
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.pdp-thumbs [role="tab"]')];
function select(tab: HTMLButtonElement) {
  tabs.forEach((item) => {
    const on = item === tab;
    item.setAttribute('aria-selected', String(on));
    item.tabIndex = on ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')!)!.hidden = !on;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', (event) => {
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length]!;
    select(next);
    next.focus();
  });
});

/* Zoom: hover (or the Zoom button) magnifies 2.2× around the pointer. */
const stage = document.querySelector<HTMLElement>('[data-stage]');
const zoomButton = document.querySelector<HTMLButtonElement>('[data-zoom]');
if (stage && zoomButton) {
  const setOrigin = (event: PointerEvent) => {
    const box = stage.getBoundingClientRect();
    stage.style.setProperty('--zx', `${((event.clientX - box.left) / box.width) * 100}%`);
    stage.style.setProperty('--zy', `${((event.clientY - box.top) / box.height) * 100}%`);
  };
  const setZoom = (on: boolean) => {
    stage.classList.toggle('zooming', on);
    zoomButton.setAttribute('aria-pressed', String(on));
    zoomButton.textContent = on ? 'Zoom out' : 'Zoom';
  };
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stage.addEventListener('pointerenter', (event) => { if (event.target === stage) { setOrigin(event); setZoom(true); } });
    stage.addEventListener('pointerleave', () => setZoom(false));
  }
  stage.addEventListener('pointermove', setOrigin);
  zoomButton.addEventListener('click', (event) => {
    event.stopPropagation();
    stage.style.setProperty('--zx', '50%');
    stage.style.setProperty('--zy', '40%');
    setZoom(zoomButton.getAttribute('aria-pressed') !== 'true');
  });
}

/* Delivery promise: the 18:30 cutoff counts down on the shared world clock (the same one Counter uses). */
const CUTOFF_HOUR = 18.5;
const cutoff = document.querySelector<HTMLElement>('[data-cutoff]');
function tick() {
  if (!cutoff) return;
  // Round up: at 16:18:00 there are 132 whole minutes left, never "2 h 11 min" from float noise.
  const minutes = Math.ceil((CUTOFF_HOUR - localHour(getWorld().now())) * 60 - 1e-6);
  if (minutes <= 0) {
    cutoff.closest('p')!.innerHTML = '<b>Order now</b> for delivery in <b>2 days</b>. Today’s 18:30 cutoff has passed.';
    return;
  }
  const h = Math.floor(minutes / 60);
  cutoff.textContent = `Order within ${h ? `${h} h ` : ''}${minutes % 60} min`;
  cutoff.classList.toggle('urgent', minutes < 30);
}
tick();
window.setInterval(tick, reduce ? 60_000 : 15_000);

/* Fit hint follows the chosen size. */
const fit = document.querySelector<HTMLElement>('[data-fit-text]');
const runsLarge = document.querySelector<HTMLElement>('[data-runs-large]')?.dataset.runsLarge === 'true';
document.querySelectorAll<HTMLInputElement>('input[name="size"]').forEach((input) => input.addEventListener('change', () => {
  if (!fit || !runsLarge) return;
  const order = ['XS', 'S', 'M', 'L', 'XL'];
  const delta = order.indexOf(input.value) - order.indexOf('M');
  fit.textContent = delta < 0
    ? `Good call · ${input.value} is what most people who usually wear M kept.`
    : delta === 0
      ? 'Runs large · most people who usually wear M kept an S. M will feel roomy.'
      : `Runs large · ${input.value} will be noticeably loose. Most people sized down.`;
}));

/* Frequently bought together: unticking an item updates the total and the button. */
const boxes = [...document.querySelectorAll<HTMLInputElement>('[data-bundle-price]')];
const total = document.querySelector('[data-bundle-total]');
const inst = document.querySelector('[data-bundle-inst]');
const count = document.querySelector('[data-bundle-count]');
const add = document.querySelector('[data-bundle-add]');
boxes.forEach((box) => box.addEventListener('change', () => {
  const chosen = boxes.filter((item) => item.checked || item.dataset.bundleFixed !== undefined);
  const sum = chosen.reduce((value, item) => value + Number(item.dataset.bundlePrice), 0);
  if (total) total.textContent = brl(sum);
  if (inst) inst.textContent = `3× ${brl(Math.round((sum / 3) * 100) / 100, { cents: true })} interest-free`;
  if (count) count.textContent = `${chosen.length} item${chosen.length === 1 ? '' : 's'}`;
  if (add) add.textContent = chosen.length === boxes.length ? `Add all ${chosen.length}` : `Add ${chosen.length} to bag`;
}));

/* Save and "How this summary was made". */
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const save = target.closest<HTMLElement>('[data-save]');
  if (save) {
    const on = save.getAttribute('aria-pressed') !== 'true';
    save.setAttribute('aria-pressed', String(on));
    save.textContent = on ? 'Saved' : 'Save';
  }
  const how = target.closest<HTMLElement>('[data-how]');
  if (how) {
    const text = document.querySelector<HTMLElement>('[data-how-text]')!;
    text.hidden = !text.hidden;
    how.setAttribute('aria-expanded', String(!text.hidden));
  }
});
