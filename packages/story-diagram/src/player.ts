/**
 * The story player: a few hundred lines of DOM glue, no framework. It walks steps across the
 * page's screens ([data-screen] with data-steps), toggles focus classes, runs at most three
 * packets on focused edges, and hands each step to optional page effects. Everything it starts
 * is a Web Animation it can pause: off-screen, in a hidden tab, or on P.
 */
import { commandFor, flatten, locate, parseStep, type Command } from './keys';

export type EffectContext = { screen: HTMLElement; step: number; reduced: boolean };
/** A page effect returns the animations it started for this step (finite ones; the player finishes them under reduced motion). */
export type Effect = (context: EffectContext) => Animation[] | void;

export type DeckOptions = {
  /** Effects by screen id, run each time a step on that screen becomes current. */
  effects?: Record<string, Effect>;
  /** The presentation run: pages in order with their step counts (or data-sequence JSON on the root). Arrow keys cross pages in presentation mode. */
  sequence?: Array<{ href: string; steps: number }>;
};

export type Deck = { go(step: number): void; readonly step: number; destroy(): void };

const STAGE = { w: 1600, h: 900 };
const PACKET_SPEED = 240; // viewBox units per second
const IDLE_MS = 1800;

const supportsOffsetPath = () => typeof CSS !== 'undefined' && CSS.supports('offset-path', 'path("M0,0 L10,10")');

function typing(event: KeyboardEvent) {
  const target = event.composedPath()[0] as HTMLElement | undefined;
  if (!target || !(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

/** Chrome (palette, lens, shortcuts) lives in custom elements; their keys are theirs. */
function fromChrome(event: KeyboardEvent) {
  return event.composedPath().some((node) => node instanceof HTMLElement && node.tagName.startsWith('IM-'));
}

function setParam(key: string, value: string | null) {
  const url = new URL(location.href);
  if (value === null) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export function mountDeck(root: HTMLElement, options: DeckOptions = {}): Deck {
  const html = document.documentElement;
  const screens = [...root.querySelectorAll<HTMLElement>('[data-screen]')];
  const counts = screens.map((screen) => Math.max(1, Number(screen.dataset.steps) || 1));
  const total = counts.reduce((sum, count) => sum + count, 0);
  const local = counts.map(() => 1);
  const animations = new Map<HTMLElement, Animation[]>();
  const coverage = new Map<HTMLElement, number>();
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const offsetPath = supportsOffsetPath();
  const params = new URLSearchParams(location.search);
  let active = 0;
  let userPaused = false;
  let hidden = document.visibilityState === 'hidden';
  let quietUntil = 0;
  let idleTimer = 0;

  const reduced = () => reducedQuery.matches;
  const current = () => flatten(counts, active, local[active]!);

  // ---- rendering a step -------------------------------------------------------------------
  function paint(index: number) {
    const screen = screens[index]!;
    const step = local[index]!;
    screen.dataset.step = String(step);
    const focusable = [...screen.querySelectorAll<HTMLElement | SVGElement>('[data-focus-steps]')];
    const anyFocus = focusable.some((element) => element.dataset.focusSteps!.split(' ').includes(String(step)));
    for (const element of focusable) {
      const on = element.dataset.focusSteps!.split(' ').includes(String(step));
      element.classList.toggle('is-focus', on);
      element.classList.toggle('is-dim', anyFocus && !on);
    }
    for (const block of screen.querySelectorAll<HTMLElement>('[data-step-only]')) {
      const on = block.dataset.stepOnly!.split(' ').includes(String(step));
      block.classList.toggle('is-off', !on);
      if (on) block.removeAttribute('aria-hidden');
      else block.setAttribute('aria-hidden', 'true');
    }
    for (const note of screen.querySelectorAll<HTMLElement>('[data-note]')) note.classList.toggle('is-on', note.dataset.note === String(step));
    // Presentation mode shows one part of a long screen per step; reading mode shows it all.
    for (const part of screen.querySelectorAll<HTMLElement>('[data-present-steps]')) part.classList.toggle('is-present-off', !part.dataset.presentSteps!.split(' ').includes(String(step)));
    for (const button of screen.querySelectorAll<HTMLElement>('[data-go]')) {
      if (button.dataset.go === String(step)) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    }
  }

  function stop(screen: HTMLElement) {
    for (const animation of animations.get(screen) ?? []) animation.cancel();
    animations.delete(screen);
    for (const packet of screen.querySelectorAll<SVGElement>('.sd-packet')) {
      packet.classList.remove('is-static');
      packet.style.removeProperty('offset-path');
      packet.style.removeProperty('offset-distance');
      packet.style.removeProperty('transform');
    }
  }

  function packets(screen: HTMLElement): Animation[] {
    const lines = [...screen.querySelectorAll<SVGPathElement>('.sd-edge.is-focus path.sd-edge-line')];
    const dots = [...screen.querySelectorAll<SVGCircleElement>('.sd-packet')];
    if (!lines.length || !dots.length) return [];
    // At most three: two on a lone edge (half a lap apart), otherwise one per edge.
    const plan = lines.length === 1 ? [[lines[0]!, 0], [lines[0]!, 0.5]] as const : lines.slice(0, 3).map((line) => [line, 0] as const);
    const started: Animation[] = [];
    plan.forEach(([line, phase], index) => {
      const dot = dots[index];
      if (!dot) return;
      const d = line.getAttribute('d')!;
      const length = line.getTotalLength();
      if (reduced()) {
        // Direction without motion: park the packet at 55% of its edge.
        const point = line.getPointAtLength(length * 0.55);
        if (offsetPath) { dot.style.setProperty('offset-path', `path("${d}")`); dot.style.setProperty('offset-distance', '55%'); }
        else dot.style.transform = `translate(${point.x}px, ${point.y}px)`;
        dot.classList.add('is-static');
        return;
      }
      const duration = Math.min(2600, Math.max(1300, (length / PACKET_SPEED) * 1000));
      const timing: KeyframeAnimationOptions = { duration, iterations: Infinity, easing: 'linear', delay: phase * duration };
      let frames: Keyframe[];
      if (offsetPath) {
        dot.style.setProperty('offset-path', `path("${d}")`);
        frames = [
          { offsetDistance: '0%', opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { opacity: 1, offset: 0.86 },
          { offsetDistance: '100%', opacity: 0 }
        ];
      } else {
        // Fallback: precomputed transform keyframes along the same path.
        frames = Array.from({ length: 25 }, (_, i) => {
          const at = i / 24;
          const point = line.getPointAtLength(length * at);
          return { transform: `translate(${point.x}px, ${point.y}px)`, opacity: at < 0.1 || at > 0.9 ? 0 : 1, offset: at };
        });
      }
      started.push(dot.animate(frames, timing));
    });
    return started;
  }

  function animate(index: number) {
    const screen = screens[index]!;
    stop(screen);
    const started = [...packets(screen)];
    const effect = options.effects?.[screen.dataset.screen!];
    const produced = effect?.({ screen, step: local[index]!, reduced: reduced() }) ?? [];
    for (const animation of produced) {
      if (reduced()) {
        try { animation.finish(); } catch { animation.cancel(); }
      } else started.push(animation);
    }
    animations.set(screen, started);
    sync();
  }

  /** Motion runs only on the active screen, while it is on screen, the tab is visible and nobody pressed P. */
  function sync() {
    screens.forEach((screen, index) => {
      const visible = html.hasAttribute('data-present') ? index === active : (coverage.get(screen) ?? 0) > 0;
      const run = !userPaused && !hidden && visible && index === active;
      // Only what the player started: short CSS transitions always finish where they should.
      for (const animation of animations.get(screen) ?? []) {
        if (!run && animation.playState === 'running') animation.pause();
        else if (run && animation.playState === 'paused') animation.play();
      }
    });
    root.toggleAttribute('data-paused', userPaused);
    for (const button of root.querySelectorAll('[data-cmd="pause"]')) button.setAttribute('aria-pressed', String(userPaused));
  }

  function progress() {
    const text = `Step ${current()} of ${total}`;
    for (const element of root.querySelectorAll<HTMLElement>('[data-progress]')) element.textContent = text;
  }

  function activate(index: number) {
    if (index === active && screens[index]!.hasAttribute('data-active')) return;
    const previous = screens[active];
    if (previous) { previous.removeAttribute('data-active'); stop(previous); }
    active = index;
    screens[active]!.setAttribute('data-active', '');
    animate(active);
    progress();
  }

  function go(step: number, { scroll = true, writeUrl = true } = {}) {
    root.setAttribute('data-engaged', '');
    const target = locate(counts, Math.min(Math.max(step, 1), total));
    const changedScreen = target.screen !== active;
    local[target.screen] = target.step;
    paint(target.screen);
    if (changedScreen) activate(target.screen);
    else animate(active);
    progress();
    if (writeUrl) setParam('step', String(current()));
    if (scroll && changedScreen && !html.hasAttribute('data-present')) {
      quietUntil = performance.now() + 900;
      screens[active]!.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
    }
  }

  // ---- presentation -------------------------------------------------------------------------
  const sequence: Array<{ href: string; steps: number }> = options.sequence ?? (root.dataset.sequence ? JSON.parse(root.dataset.sequence) : []);
  const here = sequence.findIndex((page) => page.href.replace(/\/$/, '') === location.pathname.replace(/\/$/, ''));

  function carry(href: string, step: string) {
    const url = new URL(href, location.origin);
    url.searchParams.set('present', '1');
    url.searchParams.set('step', step);
    if (html.dataset.layer === 'engineering') url.searchParams.set('layer', 'engineering');
    if (html.hasAttribute('data-notes')) url.searchParams.set('notes', '1');
    location.assign(`${url.pathname}${url.search}`);
  }

  function scale() {
    html.style.setProperty('--sd-scale', String(Math.min(innerWidth / STAGE.w, innerHeight / STAGE.h)));
  }

  function setPresent(on: boolean) {
    html.toggleAttribute('data-present', on);
    setParam('present', on ? '1' : null);
    for (const button of root.querySelectorAll('[data-cmd="present"]')) button.setAttribute('aria-pressed', String(on));
    if (on) { scale(); wake(); } else { html.removeAttribute('data-idle'); clearTimeout(idleTimer); }
    sync();
  }

  function wake() {
    html.removeAttribute('data-idle');
    clearTimeout(idleTimer);
    if (html.hasAttribute('data-present')) idleTimer = window.setTimeout(() => html.setAttribute('data-idle', ''), IDLE_MS);
  }

  function setLayer(engineering: boolean) {
    if (engineering) html.dataset.layer = 'engineering';
    else delete html.dataset.layer;
    setParam('layer', engineering ? 'engineering' : null);
    for (const button of root.querySelectorAll('[data-cmd="layer"]')) button.setAttribute('aria-pressed', String(engineering));
  }

  function setNotes(on: boolean) {
    html.toggleAttribute('data-notes', on);
    setParam('notes', on ? '1' : null);
    for (const button of root.querySelectorAll('[data-cmd="notes"]')) button.setAttribute('aria-pressed', String(on));
  }

  function run(command: Command) {
    const present = html.hasAttribute('data-present');
    switch (command) {
      case 'next':
        if (current() < total) go(current() + 1);
        else if (present && here >= 0 && sequence[here + 1]) carry(sequence[here + 1]!.href, '1');
        break;
      case 'prev':
        if (current() > 1) go(current() - 1);
        else if (present && here > 0) carry(sequence[here - 1]!.href, 'last');
        break;
      case 'first': go(1); break;
      case 'last': go(total); break;
      case 'pause': userPaused = !userPaused; sync(); break;
      case 'layer': setLayer(html.dataset.layer !== 'engineering'); break;
      case 'notes': setNotes(!html.hasAttribute('data-notes')); break;
      case 'present':
        setPresent(!present);
        if (!present) void document.documentElement.requestFullscreen?.().catch(() => undefined);
        else if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
        break;
      case 'exit':
        if (present) setPresent(false);
        break;
    }
  }

  // ---- events -------------------------------------------------------------------------------
  const onKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented || typing(event) || fromChrome(event)) return;
    const command = commandFor(event);
    if (!command) return;
    // Space and Enter on a focused control keep their native meaning.
    const target = event.composedPath()[0];
    if (event.key === ' ' && target instanceof HTMLElement && target.closest('button, a, summary, [role="button"]')) return;
    if (command === 'exit' && !html.hasAttribute('data-present')) return;
    event.preventDefault();
    run(command);
  };

  const onClick = (event: MouseEvent) => {
    const target = (event.target as Element).closest<HTMLElement>('[data-cmd], [data-go]');
    if (!target || !root.contains(target)) return;
    if (target.dataset.go) {
      const screen = target.closest<HTMLElement>('[data-screen]');
      const index = screen ? screens.indexOf(screen) : active;
      go(flatten(counts, index, Number(target.dataset.go)), { scroll: false });
      return;
    }
    const command = target.dataset.cmd as Command;
    // A stepper inside a screen moves that screen.
    const screen = target.closest<HTMLElement>('[data-screen]');
    if (screen && screens.indexOf(screen) !== active && (command === 'next' || command === 'prev')) {
      const index = screens.indexOf(screen);
      const next = Math.min(Math.max(local[index]! + (command === 'next' ? 1 : -1), 1), counts[index]!);
      go(flatten(counts, index, next), { scroll: false });
      return;
    }
    run(command);
  };

  // Reading mode: clicking or focusing something dimmed jumps to the step that is about it.
  const onReach = (event: Event) => {
    if (html.hasAttribute('data-present')) return;
    const target = event.target as Element | null;
    if (!target || target.closest('[data-cmd], [data-go], .sd-controls')) return;
    const dimmed = target.closest<HTMLElement>('[data-focus-steps].is-dim');
    const screen = dimmed?.closest<HTMLElement>('[data-screen]');
    if (!dimmed || !screen || !root.contains(screen)) return;
    const index = screens.indexOf(screen);
    const step = Number(dimmed.dataset.focusSteps!.split(' ')[0]);
    if (index >= 0 && step > 0) go(flatten(counts, index, step), { scroll: false });
  };

  const onVisibility = () => { hidden = document.visibilityState === 'hidden'; sync(); };
  const onMotionChange = () => animate(active);
  const onResize = () => { if (html.hasAttribute('data-present')) scale(); };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) coverage.set(entry.target as HTMLElement, entry.isIntersecting ? entry.intersectionRect.height / Math.max(1, entry.rootBounds?.height ?? innerHeight) : 0);
    // While reading, the screen that fills most of the viewport becomes the active one.
    if (!html.hasAttribute('data-present') && performance.now() > quietUntil) {
      let best = active;
      let bestCover = coverage.get(screens[active]!) ?? 0;
      screens.forEach((screen, index) => {
        const cover = coverage.get(screen) ?? 0;
        if (cover > bestCover + 0.15 && cover >= 0.4) { best = index; bestCover = cover; }
      });
      if (best !== active) { activate(best); setParam('step', String(current())); }
    }
    sync();
  }, { threshold: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1] });

  // ---- start --------------------------------------------------------------------------------
  const start = parseStep(location.search, total);
  // ?step=last (from a previous page in the presentation run) or an out-of-range step becomes a real number.
  if (params.has('step') && params.get('step') !== String(start)) setParam('step', String(start));
  const startAt = locate(counts, start);
  screens.forEach((_, index) => paint(index));
  local[startAt.screen] = startAt.step;
  paint(startAt.screen);
  active = startAt.screen;
  screens[active]!.setAttribute('data-active', '');
  if (params.get('layer') === 'engineering') setLayer(true);
  if (params.get('notes') === '1') setNotes(true);
  if (params.get('present') === '1') setPresent(true);
  if (params.has('step')) root.setAttribute('data-engaged', '');
  progress();
  animate(active);
  if (start > 1 && startAt.screen > 0 && !html.hasAttribute('data-present')) {
    quietUntil = performance.now() + 900;
    screens[active]!.scrollIntoView({ block: 'start' });
  }
  for (const screen of screens) observer.observe(screen);
  window.addEventListener('keydown', onKey);
  root.addEventListener('click', onClick);
  root.addEventListener('pointerdown', onReach);
  root.addEventListener('focusin', onReach);
  document.addEventListener('visibilitychange', onVisibility);
  reducedQuery.addEventListener('change', onMotionChange);
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', wake, { passive: true });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('sd-ready')));

  return {
    go: (step: number) => go(step),
    get step() { return current(); },
    destroy() {
      observer.disconnect();
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('click', onClick);
      root.removeEventListener('pointerdown', onReach);
      root.removeEventListener('focusin', onReach);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedQuery.removeEventListener('change', onMotionChange);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', wake);
      screens.forEach(stop);
    }
  };
}
