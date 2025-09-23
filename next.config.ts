import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "*.ngrok-free.app",
        pathname: "/**",
      },
    ],
  },
  // Note: allowedDevOrigins was removed, using remotePatterns for ngrok support
};

export default nextConfig;
