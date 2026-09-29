// Maré · Black Friday: the story player, plus the "is it worth it?" math.
import { mountDeck } from '@portfolio/story-diagram/player';

mountDeck(document.querySelector<HTMLElement>('[data-deck]')!);

const form = document.querySelector<HTMLFormElement>('[data-worth]');
if (form) {
  const brl = (value: number) => `R$${Math.round(value).toLocaleString('en-US')}`;
  const show = (format: string, value: number) => (format === 'brl' ? brl(value) : format === 'min' ? `${value} min` : `${value}%`);
  const read = (name: string) => Number(form.querySelector<HTMLInputElement>(`input[name="${name}"]`)!.value);
  const out = (key: string) => form.querySelector<HTMLElement>(`[data-worth-out="${key}"]`)!;
  const withChance = Number(form.dataset.with);

  // Same formula as expectedLoss() in @portfolio/system-design (the page test checks they agree).
  const update = () => {
    for (const output of form.querySelectorAll<HTMLOutputElement>('[data-worth-show]')) output.textContent = show(output.dataset.format!, read(output.dataset.worthShow!));
    const perMinute = read('perMinute');
    const minutes = read('minutes');
    const without = read('without');
    const cost = read('cost');
    const loss = (chance: number) => Math.round((chance / 100) * minutes * perMinute);
    const lostWithout = loss(without);
    const lostWith = loss(Math.min(withChance, without));
    const avoided = lostWithout - lostWith;
    out('without').textContent = brl(lostWithout);
    out('with').textContent = brl(lostWith);
    out('cost').textContent = brl(cost);
    const worth = avoided > cost;
    out('verdict').textContent = worth ? `Worth it: avoids ${brl(avoided)} for ${brl(cost)}` : `Not at these numbers: avoids ${brl(avoided)} for ${brl(cost)}`;
    form.querySelector<HTMLElement>('[data-worth-verdict]')!.dataset.worthVerdict = worth ? 'yes' : 'no';
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', (event) => event.preventDefault());
}
