import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@parakeet/shared'],
  reactStrictMode: true,
};

export default nextConfig;
