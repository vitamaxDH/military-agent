import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // To allow ngrok tunneling during development
  // Reference: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  },
};

export default nextConfig;

