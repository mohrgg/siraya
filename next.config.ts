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
};

export default nextConfig;
