import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export — required for Tauri. No Node.js server, no API routes.
  output: 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tauri handles routing; disable Next.js image optimisation (requires a server).
  images: {
    unoptimized: true,
  },
}

export default nextConfig