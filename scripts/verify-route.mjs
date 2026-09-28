// pnpm verify:route <path> [path…] [--no-build]
// Builds (Turbo makes unchanged packages instant), starts or reuses the four production
// previews, opens each route in Chromium and asserts the manifest heading, zero console errors
// and zero error boundaries. Set BASE_URL to check a deployment instead.
import { spawnSync } from 'node:child_process';
import { root } from './lib/servers.mjs';

const args = process.argv.slice(2);
const paths = args.filter((arg) => !arg.startsWith('--'));
if (!paths.length) {
  console.error('usage: pnpm verify:route <path> [path…] [--no-build]');
  process.exit(2);
}
const run = (command, commandArgs, env = {}) => spawnSync(command, commandArgs, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } }).status ?? 1;
if (!args.includes('--no-build') && !process.env.BASE_URL && run('corepack', ['pnpm', 'build', '--output-logs=errors-only'])) process.exit(1);
process.exit(run('corepack', ['pnpm', 'exec', 'playwright', 'test', '--project=verify', '--reporter=line'], { VERIFY_ROUTES: paths.join(',') }));
