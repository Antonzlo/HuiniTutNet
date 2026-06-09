import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    devtoolSegmentExplorer: false,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "src")],
  },
  webpack(config, { dev }) {
    config.module.rules.push({
      test: /\.svg$/i,
      resourceQuery: /raw/,
      type: "asset/source",
    });
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 300,
        poll: 1000,
      };
    }
    return config;
  },
};

export default nextConfig;
