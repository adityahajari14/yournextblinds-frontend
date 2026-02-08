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
    // Disable image optimization for development to avoid private IP issues
    // In production, consider using a CDN or image proxy service
    unoptimized: process.env.NODE_ENV === 'development',
    // Allow SVG images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Suppress Turbopack warning about webpack config
  turbopack: {},
};

export default nextConfig;
