import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@pulse/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'cdn.dribbble.com' },
    ],
  },
};

export default nextConfig;
