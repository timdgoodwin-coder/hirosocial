import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['linkedom', 'cheerio', '@mozilla/readability'],
};

export default nextConfig;
