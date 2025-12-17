import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Performance optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Ensure Turbopack treats this repo as the root (avoids parent lockfile confusion in monorepo-like paths).
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
