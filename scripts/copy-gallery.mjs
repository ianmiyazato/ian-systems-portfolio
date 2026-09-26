// Copy the committed screenshots into the shell's public folder so case studies can show them.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'docs/screenshots');
const target = resolve(root, 'apps/shell/public/gallery');
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
if (existsSync(source)) cpSync(source, target, { recursive: true });
console.log(`gallery → ${target}`);
