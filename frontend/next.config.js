const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

// Load root-level .env so Next (running inside frontend/) picks up shared env
const rootEnvPath = path.resolve(__dirname, '..', '.env')
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath })
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
  output: 'standalone',
}

module.exports = nextConfig
