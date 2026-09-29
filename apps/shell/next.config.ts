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
  { url: zone('MARE_OPS_URL', 3001), prefixes: ['/mare/ops'], rootSlash: true },
  { url: zone('MARE_SHOP_URL', 3002), prefixes: ['/mare/shop', '/mare/apps', '/mare/_astro'], rootSlash: false },
  { url: zone('PULSE_URL', 3003), prefixes: ['/pulse'], rootSlash: true }
];

// Story pages owned by the Astro zone. The older /system-design/<project> pages stay in the shell until M5.
const storyPaths = ['/system-design/metrics-to-decisions', '/system-design/personal-and-instant'];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@portfolio/tokens', '@portfolio/ai-sim', '@portfolio/events', '@portfolio/mocks', '@portfolio/overlays', '@portfolio/world', '@portfolio/routes'],
  experimental: { optimizePackageImports: ['@xyflow/react'] },
  // v0.2 renamed Balcão to Counter; old links keep working (308, query string preserved).
  async redirects() {
    return [
      { source: '/mare/ops/balcao', destination: '/mare/ops/counter', permanent: true },
      { source: '/mare/ops/balcao/:path*', destination: '/mare/ops/counter/:path*', permanent: true },
      { source: '/mare/shop/p/:slug', destination: '/mare/shop/products/:slug', permanent: true }
    ];
  },
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
    // The system design story is static Astro in the shop zone (<= 60 kB of JS per page); its
    // output lives under /mare/system-design, so these paths map rather than pass through.
    const shop = zone('MARE_SHOP_URL', 3002);
    const story = shop
      ? storyPaths.flatMap((path) => [
          { source: path, destination: `${shop}/mare${path}` },
          { source: `${path}/:path+`, destination: `${shop}/mare${path}/:path+` }
        ])
      : [];
    return { beforeFiles: [...story, ...beforeFiles], afterFiles: [], fallback: [] };
  }
};

export default nextConfig;
