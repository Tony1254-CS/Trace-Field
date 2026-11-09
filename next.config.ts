import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qozrzpyftynaohuxaqbg.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_2C2uvlWLo-WAwkfNdEOaRQ_ke7c_BDr",
  },
  poweredByHeader: false,
  async rewrites() {
    const apiPort = process.env.API_PORT || 8000;
    return [
      {
        source: "/docs",
        destination: `http://127.0.0.1:${apiPort}/docs`,
      },
      {
        source: "/docs/:path*",
        destination: `http://127.0.0.1:${apiPort}/docs/:path*`,
      },
      {
        source: "/api-docs",
        destination: `http://127.0.0.1:${apiPort}/docs`,
      },
      {
        source: "/api/v1/:path*",
        destination: `http://127.0.0.1:${apiPort}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "geolocation=(self), camera=(self)" },
      ],
    }];
  },
};

export default nextConfig;
