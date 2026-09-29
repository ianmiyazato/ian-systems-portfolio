// A system design page with no page-specific motion: just the story player.
import { mountDeck } from '@portfolio/story-diagram/player';

mountDeck(document.querySelector<HTMLElement>('[data-deck]')!);
