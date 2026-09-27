// pnpm shots <path|route-id|system> [more…] [--no-build]
// Screenshots matching manifest routes (and, for a system or its home route, its variations)
// into docs/screenshots/<system>/. With no argument, every route is captured.
import { spawnSync } from 'node:child_process';
import { root } from './lib/servers.mjs';

const args = process.argv.slice(2);
const targets = args.filter((arg) => !arg.startsWith('--'));
const run = (command, commandArgs, env = {}) => spawnSync(command, commandArgs, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } }).status ?? 1;
if (!args.includes('--no-build') && !process.env.BASE_URL && run('corepack', ['pnpm', 'build', '--output-logs=errors-only'])) process.exit(1);
process.exit(run('corepack', ['pnpm', 'exec', 'playwright', 'test', '--project=screenshots', '--reporter=line'], targets.length ? { SHOT_ONLY: targets.join(',') } : {}));
