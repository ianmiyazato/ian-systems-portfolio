import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

export const prefersReducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/** Tween a number toward its target (count-ups, gauges). Instant under reduced motion. */
export function useTween(target: number, duration = 900) {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0);
  const from = useRef(value);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - (1 - progress) ** 3;
      const next = origin + (target - origin) * eased;
      from.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/** Reveal items one at a time (agent traces, tool calls). */
export function useSequence(length: number, delay = 450, run = true) {
  const [count, setCount] = useState(prefersReducedMotion() ? length : 0);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) {
      setCount(length);
      return;
    }
    setCount(0);
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= length) clearInterval(id);
    }, delay);
    return () => clearInterval(id);
  }, [length, delay, run]);
  return count;
}

/** Stream text token by token, like a model response. */
export function useStream(text: string, run = true, speed = 28) {
  const words = text.split(/(\s+)/);
  const count = useSequence(words.length, speed, run);
  return { text: words.slice(0, count).join(''), done: count >= words.length };
}

/**
 * FLIP reordering: children marked data-flip="<key>" glide from their old position to the new
 * one whenever `order` changes. Transform-only (Web Animations API); instant under reduced motion.
 */
export function useFlip<T extends HTMLElement>(order: string, duration = 520) {
  const container = useRef<T>(null);
  const previous = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>('[data-flip]')];
    const next = new Map(items.map((item) => [item.dataset.flip!, item.getBoundingClientRect()]));
    if (!prefersReducedMotion() && typeof root.animate === 'function') {
      for (const item of items) {
        const before = previous.current.get(item.dataset.flip!);
        const after = next.get(item.dataset.flip!)!;
        if (!before) continue;
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      }
    }
    previous.current = next;
  }, [order]);
  return container;
}
