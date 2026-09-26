// adapter-vercel writes prerendered overrides without paths.base ("distribution.html" instead of
// "pulse/distribution.html"), so Vercel can't map /pulse/distribution to its HTML. Re-key them to
// the files that actually exist under static/.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const configPath = '.vercel/output/config.json';
if (!existsSync(configPath)) process.exit(0);
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const base = 'pulse';
const overrides = {};
for (const [file, value] of Object.entries(config.overrides ?? {})) {
  const prefixed = file.startsWith(`${base}/`) ? file : `${base}/${file}`;
  overrides[existsSync(`.vercel/output/static/${prefixed}`) ? prefixed : file] = value;
}
config.overrides = overrides;
writeFileSync(configPath, JSON.stringify(config, null, '\t'));
console.log('overrides:', Object.keys(overrides).join(', '));
