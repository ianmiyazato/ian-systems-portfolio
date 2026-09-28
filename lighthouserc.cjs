// Lighthouse CI against production. `pnpm lighthouse` (CHROME_PATH may point at Playwright's Chromium).
const base = process.env.LHCI_BASE ?? 'https://ian-portfolio-shell.vercel.app';
module.exports = {
  ci: {
    collect: {
      url: ['/', '/mare/shop', '/mare/ops/counter', '/observability', '/pulse'].map((path) => `${base}${path}`),
      numberOfRuns: 3,
      settings: { chromeFlags: '--headless=new --no-sandbox' }
    },
    assert: { assertions: {
      'categories:performance': ['error', { minScore: 0.9 }],
      'categories:accessibility': ['error', { minScore: 0.95 }],
      'categories:best-practices': ['error', { minScore: 0.95 }]
    } },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' }
  }
};
