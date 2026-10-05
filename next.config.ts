import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ['*.trycloudflare.com', '*.ngrok-free.app'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    root: path.join(process.cwd(), '..'),
  },
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
};

export default nextConfig;
