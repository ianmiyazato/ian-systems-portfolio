import type { NextConfig } from 'next';

/**
 * Multi-zone composition. Each zone URL comes from the environment:
 *   production → the zone's production domain (Vercel project env)
 *   preview    → the zone's matching preview URL (injected by CI with --build-env)
 *   local      → the zone's dev/preview server port
 */
const onVercel = Boolean(process.env.VERCEL);
const zone = (name: string, port: number) => process.env[name] || (onVercel ? undefined : `http://127.0.0.1:${port}`);

// rootSlash: zones whose framework serves the prefix root as a directory index (SvelteKit
// base path) are proxied straight to "<prefix>/" so their redirect never reaches the browser.
const zones = [
  { url: zone('MARE_OPS_URL', 3001), prefixes: ['/mare/ops'], rootSlash: false },
  { url: zone('MARE_SHOP_URL', 3002), prefixes: ['/mare/shop', '/mare/apps', '/mare/_astro'], rootSlash: false },
  { url: zone('PULSE_URL', 3003), prefixes: ['/pulse'], rootSlash: true }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@portfolio/tokens', '@portfolio/ai-sim', '@portfolio/events', '@portfolio/mocks', '@portfolio/overlays'],
  experimental: { optimizePackageImports: ['@xyflow/react'] },
  async rewrites() {
    // beforeFiles: zone prefixes must win over the shell's own dynamic routes.
    const beforeFiles = zones.flatMap(({ url, prefixes, rootSlash }) =>
      url
        ? prefixes.flatMap((prefix) => [
            { source: prefix, destination: `${url}${prefix}${rootSlash ? '/' : ''}` },
            { source: `${prefix}/:path+`, destination: `${url}${prefix}/:path+` }
          ])
        : []
    );
    return { beforeFiles, afterFiles: [], fallback: [] };
  }
};

export default nextConfig;
