import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['jsdom', 'cheerio', '@mozilla/readability'],
};

export default nextConfig;
