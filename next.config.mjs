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
  },
  serverExternalPackages: ['@prisma/client'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? '/api/:path*' 
          : 'http://localhost:3001/api/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/app/dashboard',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/app/accounts',
        destination: '/accounts',
        permanent: true,
      },
      {
        source: '/app/transactions',
        destination: '/transactions',
        permanent: true,
      },
      {
        source: '/app/settings',
        destination: '/settings',
        permanent: true,
      },
      {
        source: '/app/budgets',
        destination: '/budgets',
        permanent: true,
      },
      {
        source: '/app/profile',
        destination: '/profile',
        permanent: true,
      },
    ];
  },
}

export default nextConfig
