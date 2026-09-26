import { themes } from '@portfolio/tokens';

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

const portfolio = themes.portfolio;

/**
 * Portfolio chrome (lens, palette) keeps one identity in every zone, so reviewers recognise it
 * even inside Mesh's dark console. Values come from the token package, never literals.
 */
export const chromeVars = `
  --lens-ink:${portfolio.color.ink};--lens-surface:${portfolio.color.surface};--lens-surface-2:${portfolio.color['surface-2']};
  --lens-line:${portfolio.color.line};--lens-muted:${portfolio.color.muted};--lens-accent:${portfolio.color.accent};
  --lens-accent-ink:${portfolio.color['accent-ink']};--lens-orange:${portfolio.color['accent-2']};--lens-ai:${portfolio.color.ai};
  --lens-success:${portfolio.color.success};--lens-font:${portfolio.font.ui};--lens-display:${portfolio.font.display};--lens-mono:${portfolio.font.mono};
`;

export const tagColor: Record<string, string> = {
  Frontend: 'var(--lens-accent)',
  Backend: 'var(--lens-orange)',
  Data: 'var(--lens-success)',
  AI: 'var(--lens-ai)'
};

export function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName);
}

/** Composed path aware: typing inside shadow-DOM inputs must not trigger shortcuts. */
export function eventIsTyping(event: Event) {
  return event.composedPath().some((node) => node instanceof HTMLElement && isTypingTarget(node));
}

export function emitUrlChange() {
  window.dispatchEvent(new CustomEvent('im:urlchange'));
}
