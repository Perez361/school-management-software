import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  // output: 'export' is needed for `next build` (Rust binary embeds the static files).
  // In `next dev` we skip it so that rewrites work and the dev server proxies
  // /api/* to the Rust HTTP server on port 7770.
  output: isDev ? undefined : 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  ...(isDev
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: 'http://localhost:7770/api/:path*',
            },
          ]
        },
      }
    : {}),
}

export default nextConfig
