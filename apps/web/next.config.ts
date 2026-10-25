import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@ghostpilot/shared'],
  reactStrictMode: true,
  // Prevent Webpack from bundling these Node-native / ESM-problematic packages.
  // Next.js 15 will require() them directly from node_modules at runtime.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'mammoth'],
};

export default nextConfig;
