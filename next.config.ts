import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to allow Turbopack (Next.js 16 default)
  turbopack: {},
  // Webpack fallback for exceljs when building with webpack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
      };
    }
    return config;
  },
};

export default nextConfig;
