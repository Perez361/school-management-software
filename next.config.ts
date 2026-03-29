import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // No "output: export" — we keep the Node.js server for API routes
}

export default nextConfig