import { defineConfig, devices } from '@playwright/test';

// Every zone runs locally; the shell on :3000 proxies to them exactly as production does.
const server = (filter: string, url: string) => ({ command: `corepack pnpm --filter ${filter} dev`, url, reuseExistingServer: true, timeout: 180_000 });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  webServer: process.env.BASE_URL
    ? undefined
    : [
        server('@portfolio/mare-ops', 'http://127.0.0.1:3001/mare/ops/'),
        server('@portfolio/mare-shop', 'http://127.0.0.1:3002/mare/shop'),
        server('@portfolio/pulse', 'http://127.0.0.1:3003/pulse'),
        server('@portfolio/shell', 'http://127.0.0.1:3000')
      ],
  projects: [
    { name: 'chromium', testIgnore: /screenshots\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'screenshots', testMatch: /screenshots\.spec\.ts/, use: { viewport: { width: 1440, height: 900 } } }
  ]
});
