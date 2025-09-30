const path = require('path')
const { loadEnvConfig } = require('@next/env')

// Preload env from the monorepo root so it becomes the single source of truth.
// IMPORTANT: Do not override NODE_ENV that Next.js sets during build (production) or dev.
const originalNodeEnv = process.env.NODE_ENV
loadEnvConfig(path.resolve(__dirname, '..', '..'), originalNodeEnv !== 'production')
if (originalNodeEnv) {
  process.env.NODE_ENV = originalNodeEnv
}

// No exports needed; this file is used via NODE_OPTIONS -r