import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ==========================================
  // 1. CORE BUILD & DEPLOYMENT
  // ==========================================
  reactStrictMode: true,
  poweredByHeader: false, // Prevents framework targeting attacks
  compress: true, // Enables gzip/brotli compression
  output: 'standalone', // The enterprise standard for Dockerized and isolated deployments

  // ==========================================
  // 2. ENTERPRISE IMAGE OPTIMIZATION
  // ==========================================
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // Aggressive 1-year caching to minimize egress costs
    // Explicit sizing matrices to prevent CPU-exhaustion attacks from dynamic resizing
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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

  // ==========================================
  // 3. SERVER TELEMETRY & LOGGING
  // ==========================================
  logging: {
    fetches: {
      fullUrl: true, // Exposes deep backend query parameters for easier debugging
    },
  },

  // ==========================================
  // 4. STRICT HTTP SECURITY HEADERS
  // ==========================================
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
            value: 'DENY' // Prevents clickjacking by blocking iframe embedding
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block' // Protects against legacy XSS attacks
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            // geolocation=(self) allows safe access for address delivery mapping
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' 
          }
        ]
      }
    ];
  },

  // ==========================================
  // 5. COMPILER & EXPERIMENTAL OPTIMIZATIONS
  // ==========================================
  experimental: {
    // Prevents barrel-file bloat by transforming named imports at compile time
    optimizePackageImports: ['lucide-react', 'framer-motion'], 
    
    // Protects the server from memory-overflow attacks via massive payload injections
    serverActions: {
      bodySizeLimit: '3mb', 
    },
  }
};

export default nextConfig;