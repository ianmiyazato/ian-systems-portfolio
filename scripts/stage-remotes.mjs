// Copy each independently built remote into the Maré Ops output as a separate static bundle.
// On Hobby the five remotes ship inside the mare-ops project instead of five more projects.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, process.argv[2] ?? 'apps/mare-ops/dist/mare/ops/remotes');
const remotes = ['balcao', 'product-hub', 'pay', 'circle', 'mesh'];

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const remote of remotes) {
  const source = resolve(root, `remotes/${remote}/dist`);
  if (!existsSync(resolve(source, 'mf-manifest.json'))) throw new Error(`Build @portfolio/remote-${remote} before staging Maré Ops.`);
  cpSync(source, resolve(target, remote), { recursive: true });
}
console.log(`staged ${remotes.length} remotes → ${target}`);
