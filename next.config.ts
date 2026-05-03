import type { NextConfig } from "next";
import nextBundleAnalyzer from "@next/bundle-analyzer";

const isDev = process.env.NODE_ENV !== "production";

// Permissive CSP because rosbridge / video URLs are user-supplied at runtime
// (any LAN address). Tightening connect-src/media-src would force a rebuild
// every time an operator points at a different robot. We still gain real
// hardening from the rest: frame-ancestors, base-uri, form-action, etc.
const csp = [
  "default-src 'self'",
  // Next inlines hydration scripts and Tailwind 4 inlines styles. Dev needs eval for HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: http:",
  "media-src 'self' blob: http: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' ws: wss: http: https: data: blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: ["camera=()", "microphone=()", "geolocation=()", "payment=()"].join(", "),
  },
  // The dashboard is shipped over HTTPS in production via dashboard.openkinematics.com.
  // HSTS only takes effect on https responses, so it's safe to send unconditionally.
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const withBundleAnalyzer = nextBundleAnalyzer({ enabled: process.env.ANALYZE === "1" });

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Slim Docker images (~600 MB → ~150 MB) by emitting a self-contained server.
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // Project pins `next dev/build --webpack`; this hook only runs under webpack.
  // roslib pulls in `ws` and other Node-only deps that we don't want in the
  // browser bundle — stubbing them to `false` keeps the client build clean.
  // (When migrating to Turbopack, recreate this with `turbopack.resolveAlias`.)
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

export default withBundleAnalyzer(config);
