import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // To allow ngrok tunneling during development
  // Reference: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  /* @ts-expect-error Next.js 16 types might differ, but this key is valid in recent versions */
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  },
  // For general dev server origins
  // Note: 'allowedDevOrigins' might be the key the warning referred to, usually it's in next.config.js root or under experimental depending on version.
  // Given the warning "configure 'allowedDevOrigins' in next.config", let's try adding it at root if types allow, or ignore TS for now if it's new.
};

export default nextConfig;

