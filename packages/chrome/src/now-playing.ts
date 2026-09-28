import { nowPlaying, onNowPlaying, seek, step, stopPlaying, togglePlay, type NowPlaying } from './now-playing-store';

export * from './now-playing-store';

const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const escape = (value: string) => value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);

const styles = `
:host{position:fixed;left:0;right:0;bottom:0;z-index:900;display:block;font-family:var(--font-ui,system-ui)}
:host([hidden]){display:none}
.bar{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) minmax(0,1fr);align-items:center;gap:16px;height:72px;padding:0 16px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--surface) 94%,transparent);color:var(--ink);backdrop-filter:blur(14px);animation:up .3s ease both}
@keyframes up{from{transform:translateY(100%)}}
.meta{display:flex;align-items:center;gap:12px;min-width:0}
.cover{display:grid;place-items:center;flex:none;width:48px;height:48px;border-radius:var(--radius-sm,8px);background:linear-gradient(135deg,var(--accent),var(--accent-2));color:var(--accent-ink);font:700 14px var(--font-display,inherit)}
.meta b,.meta small{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.meta b{font-size:14px}.meta small{color:var(--muted);font-size:12px}
.eq{display:inline-flex;align-items:end;gap:2px;height:12px;margin-right:6px}
.eq i{width:3px;height:100%;background:var(--accent);transform-origin:bottom;animation:eq .9s ease-in-out infinite}
.eq i:nth-child(2){animation-delay:-.3s}.eq i:nth-child(3){animation-delay:-.6s}
@keyframes eq{50%{transform:scaleY(.3)}}
.paused .eq i{animation:none;transform:scaleY(.4)}
.center{display:grid;gap:4px;justify-items:center}
.controls{display:flex;align-items:center;gap:8px}
button{display:grid;place-items:center;min-width:44px;min-height:44px;border:0;border-radius:50%;background:transparent;color:var(--ink);font:600 16px var(--font-ui,system-ui);cursor:pointer}
button:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.play{background:var(--ink);color:var(--surface)}
.scrub{display:grid;grid-template-columns:40px 1fr 40px;align-items:center;gap:8px;width:100%;font:500 11px var(--font-mono,monospace);color:var(--muted)}
.scrub span:last-child{text-align:right}
input{width:100%;accent-color:var(--accent)}
.end{display:flex;justify-content:flex-end;gap:8px;align-items:center}
a{display:inline-flex;align-items:center;min-height:44px;padding:0 12px;border-radius:999px;color:var(--ink);font-size:13px;font-weight:600;text-decoration:underline;text-underline-offset:3px}
.close{font-size:20px}
@media (max-width:760px){.bar{grid-template-columns:minmax(0,1fr) auto;height:auto;padding:8px 12px}.center{grid-column:2;grid-row:1}.scrub,.end a{display:none}.end{grid-column:1/-1;display:none}}
@media (prefers-reduced-motion:reduce){.bar{animation:none}.eq i{animation:none}}
`;

export class NowPlayingBar extends HTMLElement {
  private root = this.attachShadow({ mode: 'open' });
  private stop: (() => void) | null = null;
  private tick = 0;
  private dragging = false;

  connectedCallback() {
    this.stop = onNowPlaying(() => this.render());
    this.tick = window.setInterval(() => { if (!this.dragging && nowPlaying()?.playing) this.update(); }, 1000);
    this.root.addEventListener('click', (event) => {
      const action = (event.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (action === 'toggle') togglePlay();
      if (action === 'prev') step(-1);
      if (action === 'next') step(1);
      if (action === 'close') stopPlaying();
    });
    this.root.addEventListener('input', (event) => { this.dragging = true; this.label(Number((event.target as HTMLInputElement).value)); });
    this.root.addEventListener('change', (event) => { this.dragging = false; seek(Number((event.target as HTMLInputElement).value)); });
    this.render();
  }

  disconnectedCallback() {
    this.stop?.();
    window.clearInterval(this.tick);
    document.body.style.removeProperty('padding-bottom');
  }

  private visible(state: NowPlaying | null) {
    const source = this.getAttribute('source');
    return state && (!source || state.source === source) ? state : null;
  }

  /** Light update each second: position, label, and the current row the page can highlight. */
  private update() {
    const state = this.visible(nowPlaying());
    if (!state) return this.render();
    const input = this.root.querySelector<HTMLInputElement>('input');
    if (!input || this.root.querySelector('[data-track]')?.getAttribute('data-track') !== state.queue[state.index]!.id) return this.render();
    input.value = String(Math.floor(state.position));
    this.label(state.position);
  }

  private label(position: number) {
    const state = this.visible(nowPlaying());
    const at = this.root.querySelector('[data-at]');
    if (at) at.textContent = time(position);
    this.root.querySelector('input')?.setAttribute('aria-valuetext', `${time(position)} of ${time(state?.queue[state.index]?.seconds ?? 0)}`);
  }

  private render() {
    const state = this.visible(nowPlaying());
    this.hidden = !state;
    document.body.style.setProperty('padding-bottom', state ? '72px' : '');
    document.documentElement.dataset.nowPlaying = state ? `${state.queue[state.index]!.id}${state.playing ? '' : ':paused'}` : '';
    if (!state) { this.root.innerHTML = ''; return; }
    const track = state.queue[state.index]!;
    this.root.innerHTML = `<style>${styles}</style>
      <section class="bar ${state.playing ? '' : 'paused'}" role="region" aria-label="Now playing" data-track="${escape(track.id)}">
        <div class="meta"><span class="cover" aria-hidden="true">${escape(track.cover)}</span><div><b><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>${escape(track.title)}</b><small>${escape(track.subtitle)} · ${escape(state.label)}</small></div></div>
        <div class="center">
          <div class="controls">
            <button type="button" data-act="prev" aria-label="Previous">⏮</button>
            <button type="button" class="play" data-act="toggle" aria-label="${state.playing ? 'Pause' : 'Play'}" aria-pressed="${state.playing}">${state.playing ? '❚❚' : '▶'}</button>
            <button type="button" data-act="next" aria-label="Next" ${state.index >= state.queue.length - 1 ? 'disabled' : ''}>⏭</button>
          </div>
          <label class="scrub"><span data-at>${time(state.position)}</span><input type="range" min="0" max="${track.seconds}" step="1" value="${Math.floor(state.position)}" aria-label="Seek" aria-valuetext="${time(state.position)} of ${time(track.seconds)}" /><span>${time(track.seconds)}</span></label>
        </div>
        <div class="end"><a href="${escape(state.href)}">Open ${escape(state.label)}</a><button type="button" class="close" data-act="close" aria-label="Close player">×</button></div>
      </section>`;
  }
}
