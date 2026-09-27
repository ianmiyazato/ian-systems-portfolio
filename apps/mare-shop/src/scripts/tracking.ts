// Live tracking: courier position and ETA from the world clock; bottom sheet with drag + keyboard snap points.
import { MINUTE, clock, getWorld, parseLocalTime } from '@portfolio/world';

type Snap = 'peek' | 'half' | 'full';
const snaps: Snap[] = ['peek', 'half', 'full'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function position(root: HTMLElement) {
  const now = getWorld().now();
  const dispatch = parseLocalTime('16:05', now)!;
  const eta = parseLocalTime('16:42', now)!;
  const progress = Math.min(1, Math.max(0, (now - dispatch) / (eta - dispatch)));
  const left = Math.max(0, Math.ceil((eta - now) / MINUTE - 1e-6));
  const route = root.querySelector<SVGPathElement>('[data-route]')!;
  const length = route.getTotalLength();
  route.style.strokeDasharray = `${length}`;
  route.style.strokeDashoffset = `${length * (1 - progress)}`;
  const point = route.getPointAtLength(length * progress);
  root.querySelector<SVGGElement>('[data-courier]')!.style.transform = `translate(${point.x}px, ${point.y}px)`;
  const delivered = progress >= 1;
  root.querySelector('[data-eta-time]')!.textContent = clock(eta);
  root.querySelector('[data-eta-left]')!.textContent = delivered ? 'delivered' : `${left} min`;
  root.querySelector('[data-eta-headline]')!.textContent = delivered ? `Delivered at ${clock(eta)}` : left <= 2 ? 'Caio is outside' : `Arriving in ${left} min`;
  root.querySelector('[data-updated]')!.textContent = clock(now);
  root.querySelectorAll('.tr-steps li').forEach((step, index) => {
    step.classList.toggle('done', index < 3 || (delivered && index <= 4));
    step.classList.toggle('now', !delivered && index === 3);
    if (!delivered && index === 3) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
  });
  root.classList.toggle('is-delivered', delivered);
}

function sheet(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>('[data-sheet]')!;
  const handle = root.querySelector<HTMLButtonElement>('[data-handle]')!;
  const offsetFor = (snap: Snap) => {
    const height = panel.offsetHeight;
    return snap === 'full' ? 0 : snap === 'half' ? height * 0.42 : height - 170;
  };
  const setSnap = (snap: Snap) => {
    root.dataset.snap = snap;
    panel.style.transition = reduce ? 'none' : '';
    panel.style.transform = `translateY(${offsetFor(snap)}px)`;
    handle.setAttribute('aria-expanded', String(snap === 'full'));
  };
  setSnap(root.dataset.snap as Snap);

  let startY = 0;
  let startOffset = 0;
  let dragging = false;
  let moved = 0;
  const current = () => offsetFor(root.dataset.snap as Snap);
  panel.addEventListener('pointerdown', (event) => {
    if (!(event.target as HTMLElement).closest('[data-handle], .tr-sheet > header')) return;
    dragging = true;
    moved = 0;
    startY = event.clientY;
    startOffset = current();
    panel.setPointerCapture(event.pointerId);
    panel.style.transition = 'none';
  });
  panel.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    moved = event.clientY - startY;
    panel.style.transform = `translateY(${Math.max(0, Math.min(offsetFor('peek'), startOffset + moved))}px)`;
  });
  panel.addEventListener('pointerup', (event) => {
    if (!dragging) return;
    dragging = false;
    panel.releasePointerCapture(event.pointerId);
    if (Math.abs(moved) < 6) return;
    const at = startOffset + moved;
    // Snap to the nearest point, biased toward the direction of the flick.
    const nearest = snaps.reduce((best, snap) => (Math.abs(offsetFor(snap) - at) < Math.abs(offsetFor(best) - at) ? snap : best), 'peek' as Snap);
    setSnap(nearest);
  });
  handle.addEventListener('click', () => {
    if (Math.abs(moved) >= 6) { moved = 0; return; }
    const index = snaps.indexOf(root.dataset.snap as Snap);
    setSnap(snaps[(index + 1) % snaps.length]!);
  });
  handle.addEventListener('keydown', (event) => {
    const index = snaps.indexOf(root.dataset.snap as Snap);
    if (event.key === 'ArrowUp') { event.preventDefault(); setSnap(snaps[Math.min(snaps.length - 1, index + 1)]!); }
    if (event.key === 'ArrowDown') { event.preventDefault(); setSnap(snaps[Math.max(0, index - 1)]!); }
  });
}

function courierChat(root: HTMLElement) {
  const message = root.querySelector<HTMLButtonElement>('[data-message]')!;
  const replies = root.querySelector<HTMLElement>('[data-replies]')!;
  const sent = root.querySelector<HTMLElement>('[data-sent]')!;
  message.addEventListener('click', () => {
    replies.hidden = !replies.hidden;
    message.setAttribute('aria-expanded', String(!replies.hidden));
  });
  replies.querySelectorAll<HTMLButtonElement>('[data-reply]').forEach((reply) => reply.addEventListener('click', () => {
    sent.textContent = `Sent to Caio: “${reply.textContent}”`;
    replies.hidden = true;
    message.setAttribute('aria-expanded', 'false');
  }));
  root.querySelector('[data-share]')!.addEventListener('click', () => {
    sent.textContent = 'Live ETA link copied · it stops sharing when the order arrives';
  });
}

document.querySelectorAll<HTMLElement>('[data-tracking]').forEach((root) => {
  position(root);
  sheet(root);
  courierChat(root);
  window.setInterval(() => position(root), reduce ? 30_000 : 3_000);
});
