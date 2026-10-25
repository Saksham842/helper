import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@ghostpilot/shared'],
  reactStrictMode: true,
  // Keep mammoth external so Next.js never bundles it through Webpack.
  // unpdf is NOT listed here — it resolves cleanly via dynamic import()
  // because it ships its own self-contained pdfjs bundle with no ESM/CJS shims.
  serverExternalPackages: ['mammoth'],
};

export default nextConfig;
