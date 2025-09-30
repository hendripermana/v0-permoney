const path = require('path')
const { loadEnvConfig } = require('@next/env')

// Ensure Next loads env from the monorepo root (single source of truth)
// Preserve the NODE_ENV that Next sets (production during build, development during dev)
const originalNodeEnv = process.env.NODE_ENV
loadEnvConfig(path.resolve(__dirname, '..'), originalNodeEnv !== 'production')
if (originalNodeEnv) {
  process.env.NODE_ENV = originalNodeEnv
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false,
    domains: ['localhost', 'vercel.app', 'flagcdn.com'],
  },
  compress: true,
  experimental: {
    // keep placeholder for other experimental toggles if needed
  },
  serverExternalPackages: ['@prisma/client'],
  async rewrites() {
    const backendBase = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/?$/,'')
      : 'http://localhost:3001/api';
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/sign-in',
        permanent: false,
      },
      {
        source: '/register',
        destination: '/sign-up',
        permanent: false,
      },
    ];
  },
  output: 'standalone',
}

module.exports = nextConfig
