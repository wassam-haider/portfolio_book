import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The whole site is database-driven and rendered per-request.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
