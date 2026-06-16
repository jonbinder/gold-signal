import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "api.massive.com", pathname: "/**" },
      { protocol: "https", hostname: "api.polygon.io", pathname: "/**" },
    ],
  },
  typedRoutes: true,
  async redirects() {
    return [
      { source: "/gold-silver-stocks", destination: "/stocks", permanent: true },
      { source: "/leaderboard", destination: "/stocks", permanent: true },
      { source: "/funds", destination: "/investors", permanent: false },
      { source: "/funds/:slug", destination: "/investors/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
