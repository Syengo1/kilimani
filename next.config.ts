import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  allowedDevOrigins: [
    '192.168.100.22', 
    '192.168.100.22:3000'
  ],
  
  // 1. Core Build & Security Settings
  reactStrictMode: true,
  poweredByHeader: false, // Removes 'X-Powered-By: Next.js' to prevent framework targeting
  compress: true, // Enables gzip/brotli compression for better network transfer

  // 2. Enterprise Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'], // Forces browser to request modern, highly-compressed formats
    minimumCacheTTL: 31536000, // Caches images for 1 year to aggressively reduce storage egress bandwidth
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jnnaphuofzydrbqmvvgk.supabase.co", // Supabase Storage
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Unsplash Lookbook Images
        port: "",
        pathname: "/**",
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
            key: 'X-XSS-Protection',
            value: '1; mode=block' // Protects against legacy Cross-Site Scripting attacks
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            // THE FIX: geolocation=(self) allows the DeliveryAddressForm to access GPS securely
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' 
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