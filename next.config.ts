import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['recharts', 'mapbox-gl'],
}

export default nextConfig
