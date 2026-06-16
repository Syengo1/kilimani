import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Core Build & Security Settings
  reactStrictMode: true,
  poweredByHeader: false, // Removes 'X-Powered-By: Next.js' for security
  compress: true, // Enables gzip compression for better network transfer

  // Development network access
  allowedDevOrigins: ['192.168.100.22'],

  // 2. Enterprise Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'], // Forces browser to request modern, highly-compressed formats
    minimumCacheTTL: 31536000, // Caches images for 1 year to aggressively reduce storage egress bandwidth
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jnnaphuofzydrbqmvvgk.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // 3. Strict HTTP Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on' // Accelerates resolution of external domains
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload' // Forces HTTPS connections
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff' // Prevents MIME-type sniffing attacks
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY' // Prevents clickjacking by blocking iframe embedding of the site
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' // Locks down unused browser APIs
          }
        ]
      }
    ];
  },

  // 4. Compiler Optimizations
  experimental: {
    // Prevents barrel-file bloat by transforming named imports at compile time
    optimizePackageImports: ['lucide-react', 'framer-motion'], 
  }
};

export default nextConfig;