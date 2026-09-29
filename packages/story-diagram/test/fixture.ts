// A self-contained page for the engine's browser tests: the sample diagram, a second screen
// with two steps, the deck controls and a spacer tall enough to scroll the diagram away.
// The player is bundled with esbuild, so the tests need no app build or server.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { parseDiagram } from '../src/model';
import { renderControls, renderStory } from '../src/render';
import sample from './fixtures/sample.json';

const here = dirname(fileURLToPath(import.meta.url));

export async function fixtureHtml() {
  const bundle = await build({ entryPoints: [join(here, 'fixture-entry.ts')], bundle: true, write: false, format: 'esm', target: 'es2022' });
  const css = readFileSync(join(here, '../src/story.css'), 'utf8');
  const script = bundle.outputFiles[0]!.text;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Story fixture</title><style>${css}
body { margin: 0; font-family: system-ui, sans-serif; background: #fff; } main { max-width: 1200px; margin: 0 auto; padding: 24px; }
.card { padding: 24px; border: 1px solid #ccd; border-radius: 16px; margin: 12px 0; }</style></head>
<body><main data-deck data-accent="a">
<h1>Fixture</h1>
${renderControls()}
${renderStory(parseDiagram(sample), { screen: 'flow' })}
<section data-screen="cards" data-steps="2" class="sd-screen" aria-label="Cards">
  <div class="card" data-focus-steps="1">First idea</div>
  <div class="card" data-focus-steps="2">Second idea</div>
  <div class="sd-notes"><p data-note="1">Say the first thing.</p><p data-note="2">Say the second thing.</p></div>
</section>
<div style="height: 2400px" aria-hidden="true"></div>
</main><script type="module">${script}</script></body></html>`;
}
