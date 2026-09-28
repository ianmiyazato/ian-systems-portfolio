/**
 * Every AI card in every stack gets "How this was made": the one AI trust surface is a CSS contract,
 * so chrome can read any `.ai-surface` (title, sources) and add the disclosure after hydration.
 * The disclosure is tiny on first load; its evidence and simulated run details load only when opened.
 * Cards that already explain themselves (a [data-how] button or an .ai-provenance panel) are left alone.
 */
function enhance(card: HTMLElement) {
  card.dataset.provenance = 'on';
  if (card.querySelector('.ai-provenance, [data-how], .ai-how')) return;
  const details = document.createElement('details');
  details.className = 'ai-how';
  details.innerHTML = '<summary>How this was made</summary>';
  details.addEventListener('toggle', () => {
    if (!details.open || details.dataset.loaded) return;
    details.dataset.loaded = 'loading';
    void import('./provenance-details').then(({ renderProvenance }) => {
      renderProvenance(details, card);
      details.dataset.loaded = 'on';
    });
  });
  card.append(details);
}

let scheduled = false;
function scan() {
  scheduled = false;
  document.querySelectorAll<HTMLElement>('.ai-surface:not([data-provenance])').forEach(enhance);
}

export function enhanceAiSurfaces() {
  scan();
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  }).observe(document.body, { childList: true, subtree: true });
}
