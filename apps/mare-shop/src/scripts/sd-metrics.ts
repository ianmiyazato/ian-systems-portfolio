// Problem A: the story player, plus the report chart drawing itself and the human approval.
import { mountDeck } from '@portfolio/story-diagram/player';

const EASE = 'cubic-bezier(.2, .8, .2, 1)';

mountDeck(document.querySelector<HTMLElement>('[data-deck]')!, {
  effects: {
    'a-report': ({ screen, step }) => {
      if (step !== 1) return [];
      const wipe = screen.querySelector<SVGRectElement>('[data-chart-wipe]');
      const dot = screen.querySelector<SVGCircleElement>('.sdp-chart-dot');
      if (!wipe) return [];
      return [
        wipe.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 2400, easing: EASE, fill: 'both' }),
        ...(dot ? [dot.animate([{ opacity: 0 }, { opacity: 0, offset: 0.9 }, { opacity: 1 }], { duration: 2600, fill: 'both' })] : [])
      ];
    }
  }
});

document.querySelector('[data-approve]')?.addEventListener('click', (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  button.hidden = true;
  const done = document.querySelector<HTMLElement>('[data-approved]');
  if (done) done.hidden = false;
});
