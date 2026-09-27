import { defineConfig, devices } from '@playwright/test';

// Production builds of every zone; the shell on :3000 proxies to them exactly as it does on Vercel.
// Run `pnpm build` first. Set BASE_URL to test a deployment instead (no local servers are started).
const pm = process.env.CI ? 'pnpm' : 'corepack pnpm';
const server = (filter: string, command: string, url: string) => ({ command: `${pm} --filter ${filter} exec ${command}`, url, reuseExistingServer: !process.env.CI, timeout: 120_000 });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  webServer: process.env.BASE_URL
    ? undefined
    : [
        server('@portfolio/mare-ops', 'vite preview', 'http://127.0.0.1:3001/mare/ops/'),
        server('@portfolio/mare-shop', 'astro preview --port 3002 --host 127.0.0.1', 'http://127.0.0.1:3002/mare/shop'),
        server('@portfolio/pulse', 'vite preview', 'http://127.0.0.1:3003/pulse/'),
        server('@portfolio/shell', 'next start -p 3000 -H 127.0.0.1', 'http://127.0.0.1:3000')
      ],
  projects: [
    { name: 'chromium', testDir: './tests/e2e', testIgnore: /screenshots\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'screenshots', testDir: './tests/e2e', testMatch: /screenshots\.spec\.ts/, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'verify', testDir: './tests/tools', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }
  ]
});
