/**
 * One motion engine, several personalities. Every design language maps the same tokens differently:
 * Counter snaps, Product Hub fades, Pay sweeps, Circle bounces, Mesh slides, Atlas springs gently and
 * Pulse pulses. Themes read their ease, duration and keyframes from here (a test keeps themes.json in sync).
 * Only transform and opacity are animated, and everything respects prefers-reduced-motion.
 */
export const durations = { instant: 90, quick: 160, base: 240, slow: 420, story: 6000 } as const;

export type Personality = 'rise' | 'snap' | 'fade' | 'sweep' | 'bounce' | 'slide' | 'spring' | 'pulse';

export const easings: Record<Personality, string> = {
  rise: 'cubic-bezier(.2,.8,.2,1)',
  snap: 'cubic-bezier(.34,1.56,.64,1)',
  fade: 'ease-out',
  sweep: 'cubic-bezier(.16,1,.3,1)',
  bounce: 'cubic-bezier(.34,1.8,.64,1)',
  slide: 'cubic-bezier(.25,.1,.25,1)',
  spring: 'cubic-bezier(.3,1.3,.5,1)',
  pulse: 'cubic-bezier(.2,.8,.2,1)'
};

export type ThemeMotion = { personality: Personality; ease: string; duration: string; 'overlay-in': string; 'drawer-in': string; enter: string };

const motion = (personality: Personality, ms: number, overlay: string, drawer: string): ThemeMotion => ({
  personality, ease: easings[personality], duration: `${ms}ms`, 'overlay-in': overlay, 'drawer-in': drawer, enter: `m-${personality}`
});

/** The mapping every theme follows (themes.json is checked against it). */
export const themeMotion: Record<string, ThemeMotion> = {
  portfolio: motion('rise', 280, 'ov-rise', 'ov-drawer-slide'),
  counter: motion('snap', 220, 'ov-pop', 'ov-drawer-pop'),
  'product-hub': motion('fade', 160, 'ov-fade', 'ov-drawer-fade'),
  pay: motion('sweep', 520, 'ov-sweep', 'ov-drawer-sweep'),
  circle: motion('bounce', 420, 'ov-bounce', 'ov-drawer-bounce'),
  mesh: motion('slide', 200, 'ov-slide', 'ov-drawer-slide'),
  consumer: motion('rise', 320, 'ov-rise', 'ov-drawer-slide'),
  atlas: motion('spring', 380, 'ov-spring', 'ov-drawer-spring'),
  pulse: motion('pulse', 300, 'ov-pulse', 'ov-drawer-slide'),
  tidewatch: motion('fade', 180, 'ov-fade', 'ov-drawer-fade')
};

export const prefersReducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Numbers tween: calls onFrame with eased values, or once with the end value under reduced motion. */
export function tween(from: number, to: number, ms: number, onFrame: (value: number) => void): () => void {
  if (prefersReducedMotion() || ms <= 0 || typeof requestAnimationFrame === 'undefined') {
    onFrame(to);
    return () => undefined;
  }
  const start = performance.now();
  let frame = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - (1 - t) ** 3;
    onFrame(from + (to - from) * eased);
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/**
 * FLIP: call `measure()` before a reorder and `play()` after it; rows glide from where they were.
 * Transform only, and a no-op under reduced motion.
 */
export function flip(container: HTMLElement, selector: string, key: (element: HTMLElement) => string, options: { duration?: number; easing?: string } = {}) {
  const before = new Map<string, DOMRect>();
  return {
    measure() {
      before.clear();
      container.querySelectorAll<HTMLElement>(selector).forEach((element) => before.set(key(element), element.getBoundingClientRect()));
    },
    play() {
      if (prefersReducedMotion()) return;
      container.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        const previous = before.get(key(element));
        if (!previous) return;
        const now = element.getBoundingClientRect();
        const dx = previous.left - now.left;
        const dy = previous.top - now.top;
        if (!dx && !dy) return;
        element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: options.duration ?? durations.slow, easing: options.easing ?? easings.spring });
      });
    }
  };
}

type Transitioning = Document & { startViewTransition?: (update: () => void | Promise<void>) => { finished: Promise<void> } };

/** Same-document view transition (shared elements via view-transition-name), falling back to an instant update. */
export function withViewTransition(update: () => void | Promise<void>) {
  const doc = typeof document === 'undefined' ? null : (document as Transitioning);
  if (!doc?.startViewTransition || prefersReducedMotion()) {
    void update();
    return;
  }
  doc.startViewTransition(update);
}
