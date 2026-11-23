import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  webpack: (config) => {
    config.resolve.alias.canvas = false; // pdfjs optional node dep
    return config;
  },
};
export default nextConfig;
