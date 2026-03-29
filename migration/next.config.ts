import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export — required for Tauri. No Node.js server, no API routes.
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tauri handles routing natively; disable Next.js image optimisation
  // (it requires a server).
  images: {
    unoptimized: true,
  },
}

export default nextConfig
