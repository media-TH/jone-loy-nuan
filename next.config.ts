import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Hide admin routes behind a random string path
      {
        source: '/x9k2m7n4p8q1/:path*',
        destination: '/admin/:path*',
      },
    ];
  },
  async redirects() {
    return [
      // Redirect direct admin access to home
      {
        source: '/admin/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/x9k2m7n4p8q1/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);