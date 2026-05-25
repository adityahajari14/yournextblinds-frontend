import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '1clickblinds.co.uk',
        pathname: '/**',
      },
      // Allow localhost for local development
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
    ],
    // Serve images directly from their source CDN (Shopify CDN handles optimization natively).
    // This avoids Next.js image proxy issues in various deployment environments.
    unoptimized: true,
    // Allow SVG images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Suppress Turbopack warning about webpack config
  turbopack: {},
};

export default nextConfig;
