import type { NextConfig } from 'next'

const isDev    = process.env.NODE_ENV === 'development'
const isDemo   = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

const nextConfig: NextConfig = {
  // `output: 'export'` is needed when the Rust binary embeds the static files.
  // Skip it in dev (rewrites must work) and for Vercel demo deployments (static
  // export strips API routes and disables dynamic routing features we rely on).
  output: isDev || isDemo ? undefined : 'export',
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
