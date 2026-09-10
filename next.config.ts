import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com', '*.ngrok-free.app'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    root: path.join(process.cwd(), '..'),
  },
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/api/pdf': [
      './node_modules/@sparticuz/chromium/bin/**/*',
      '../node_modules/@sparticuz/chromium/bin/**/*',
    ],
  },
};

export default nextConfig;
