const path = require('path')
const { loadEnvConfig } = require('@next/env')

// Preload env from the monorepo root so it becomes the single source of truth.
// This runs before Next.js CLI initializes, preventing .env.local from overriding.
loadEnvConfig(path.resolve(__dirname, '..', '..'), process.env.NODE_ENV !== 'production')

// No exports needed; this file is used via NODE_OPTIONS -r