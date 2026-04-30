// @ts-nocheck
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/icons/:path*',
        destination: '/new_ui/public/icons/:path*',
      },
    ];
  },
};

export default nextConfig;
