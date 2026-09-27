// Regenerate the README gallery from docs/screenshots/<area>/*.png (between the gallery markers).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shots = resolve(root, 'docs/screenshots');
const order = ['overview', 'mare', 'counter', 'product-hub', 'pay', 'circle', 'mesh', 'consumer', 'atlas', 'pulse', 'mobile'];
const titles = { overview: 'Overview', mare: 'Maré', counter: 'Counter', 'product-hub': 'Product Hub', pay: 'Pay', circle: 'Circle', mesh: 'Integration Mesh', consumer: 'Maré consumer', atlas: 'Atlas', pulse: 'Pulse', mobile: 'Mobile (390 px)' };
const label = (file) => file.replace(/\.png$/, '').replace(/--/, ' · state: ').replace(/-/g, ' ');

const sections = order
  .filter((area) => readdirSync(shots).includes(area))
  .map((area) => {
    const files = readdirSync(resolve(shots, area)).filter((file) => file.endsWith('.png')).sort((a, b) => Number(a.includes('--')) - Number(b.includes('--')) || a.localeCompare(b));
    const main = files.filter((file) => !file.includes('--'));
    const variations = files.filter((file) => file.includes('--'));
    const cells = main.map((file) => `<a href="docs/screenshots/${area}/${file}"><img src="docs/screenshots/${area}/${file}" width="${area === 'mobile' ? 180 : 280}" alt="${label(file)}"></a>`).join('\n');
    const states = variations.length ? `\n\n<details><summary>${variations.length} designed variations</summary>\n\n${variations.map((file) => `<a href="docs/screenshots/${area}/${file}"><img src="docs/screenshots/${area}/${file}" width="220" alt="${label(file)}"></a>`).join('\n')}\n\n</details>` : '';
    return `### ${titles[area] ?? area}\n\n${cells}${states}`;
  })
  .join('\n\n');

const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
const start = '<!-- gallery:start -->';
const end = '<!-- gallery:end -->';
const next = readme.replace(new RegExp(`${start}[\\s\\S]*${end}`), `${start}\n\n${sections}\n\n${end}`);
writeFileSync(resolve(root, 'README.md'), next);
console.log(`gallery: ${sections.split('<img').length - 1} images`);
