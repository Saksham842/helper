import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@ghostpilot/shared'],
  reactStrictMode: true,
};

export default nextConfig;
