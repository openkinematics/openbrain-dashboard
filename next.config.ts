import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  // Next.js 16 defaults to Turbopack for `next build`; `resolve.fallback` is webpack-specific.
  // Keep webpack until we migrate roslib stubs to `turbopack.resolveAlias` (see package.json scripts).
  // roslib pulls in `ws` and other Node-only deps that we don't want in the
  // browser bundle. Stubbing them to `false` here keeps the client build clean.
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ws: false,
      bufferutil: false,
      "utf-8-validate": false,
    };
    return config;
  },
};

export default config;
