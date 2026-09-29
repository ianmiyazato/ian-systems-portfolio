// The 80/20 map: dots pop in by problem, and hovering or focusing a dot shows its card.
import { mountDeck } from '@portfolio/story-diagram/player';

const pop = (screen: HTMLElement, problem: string) => [...screen.querySelectorAll<HTMLElement>(`[data-dot][data-problem="${problem}"] .sdp-dot-mark`)].map((mark, index) =>
  mark.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.18)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, delay: 160 + index * 140, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'backwards' }));

const empty = document.querySelector<HTMLElement>('[data-card-empty]');
const show = (id: string | null) => {
  document.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => { card.hidden = card.dataset.card !== id; });
  if (empty) empty.hidden = id !== null;
  document.querySelectorAll<HTMLElement>('[data-dot]').forEach((dot) => dot.toggleAttribute('data-current', dot.dataset.dot === id));
};
document.querySelectorAll<HTMLElement>('[data-dot]').forEach((dot) => {
  dot.addEventListener('mouseenter', () => show(dot.dataset.dot!));
  dot.addEventListener('focus', () => show(dot.dataset.dot!));
  dot.addEventListener('click', () => show(dot.dataset.dot!));
});

// While presenting there is no pointer to hover with, so steps 2 and 3 open the card the talk track names.
const spoken: Record<number, string> = { 2: 'metric-definitions', 3: 'suggestion-ranking' };

mountDeck(document.querySelector<HTMLElement>('[data-deck]')!, {
  effects: {
    map: ({ screen, step }) => {
      show(spoken[step] ?? null);
      return step === 2 ? pop(screen, 'a') : step === 3 ? pop(screen, 'b') : [];
    }
  }
});
