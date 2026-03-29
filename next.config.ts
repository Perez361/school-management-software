import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export — Tauri loads /out as a local filesystem bundle.
  // No Node.js server runs at any point. All data access goes through
  // Tauri invoke() → Rust commands → rusqlite.
  output: 'export',

  // Required for static export with Tauri on Windows:
  // Without this, navigating to /dashboard loads dashboard (no .html extension)
  // which the Tauri webview can't resolve from the filesystem.
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimisation requires a server — disable it for static export.
  images: {
    unoptimized: true,
  },
}

export default nextConfig