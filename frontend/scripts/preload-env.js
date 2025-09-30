const path = require('path')
const { loadEnvConfig } = require('@next/env')

// Preload env from the monorepo root so it becomes the single source of truth.
// IMPORTANT: Do not override NODE_ENV that Next.js sets during build (production) or dev.
const originalNodeEnv = process.env.NODE_ENV
const lifecycle = process.env.npm_lifecycle_event
// Decide target NODE_ENV: force production for build, otherwise keep original (dev/start/test)
const targetNodeEnv = lifecycle === 'build' ? 'production' : (originalNodeEnv || undefined)

loadEnvConfig(path.resolve(__dirname, '..', '..'), (targetNodeEnv ?? '') !== 'production')

// Restore/force NODE_ENV per target
if (targetNodeEnv) {
  process.env.NODE_ENV = targetNodeEnv
}

// No exports needed; this file is used via NODE_OPTIONS -r