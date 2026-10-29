import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hide the floating Next.js dev-tools badge (dev only; build errors still show as an overlay).
  devIndicators: false,
  // Tailwind v4 runs as a Turbopack CSS loader (no PostCSS config).
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
