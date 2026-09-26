import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@portfolio/tokens', '@portfolio/ai-sim', '@portfolio/events'],
  async rewrites() {
    const mareOps = process.env.MARE_OPS_URL;
    const mareShop = process.env.MARE_SHOP_URL;
    const pulse = process.env.PULSE_URL;
    return [
      ...(mareOps ? [{ source: '/mare/ops/:path*', destination: `${mareOps}/mare/ops/:path*` }] : []),
      ...(mareShop ? [{ source: '/mare/shop/:path*', destination: `${mareShop}/mare/shop/:path*` }, { source: '/mare/apps/:path*', destination: `${mareShop}/mare/apps/:path*` }] : []),
      ...(pulse ? [{ source: '/pulse/:path*', destination: `${pulse}/pulse/:path*` }] : [])
    ];
  }
};

export default nextConfig;

