import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
      { source: "/investors", destination: "/funds", permanent: false },
      { source: "/investors/:slug", destination: "/funds/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
