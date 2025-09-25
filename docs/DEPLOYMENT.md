# Permoney Deployment Guide (Vercel + NestJS)

This document lists production-ready settings and steps to deploy the consolidated Next.js frontend (app/) and NestJS backend (serverless) on Vercel.

## Overview

- Frontend: Next.js (app router) at repository root (app/, components/, lib/, hooks/).
- Backend: NestJS (serverless function) with Prisma as the single ORM for production.
- Deployment: `vercel.json` builds Next.js and deploys backend at `/api/(.*)`.

## Environment Variables

Configure these in Vercel (Project Settings → Environment Variables):

Core
- NODE_ENV=production
- API_PREFIX=api
- ENABLE_CSRF=false  # serverless-friendly (disables express-session)
- LOG_LEVEL=info

Security
- JWT_SECRET=<strong-random-secret>
- RATE_LIMIT_WINDOW=60000        # milliseconds
- RATE_LIMIT_MAX=100
- CORS_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com
  - Note: The backend also allows common Vercel subdomains via regex; set CORS_ORIGINS to your primary domains to be explicit.

Database (Prisma)
- DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public

External Services (optional, depending on features used)
- EXCHANGE_RATE_API_URL=...
- EXCHANGE_RATE_API_KEY=...
- OCR_SERVICE_URL=...
- OCR_SERVICE_API_KEY=...
- EMAIL_PROVIDER=sendgrid
- EMAIL_API_KEY=...
- FROM_EMAIL=noreply@permoney.com

Frontend (optional)
- NEXT_PUBLIC_API_URL=/api        # default; keep relative for Vercel

## Build & Migrate (CI/CD)

Recommended npm scripts (already added at root package.json):

- npm run db:generate    # prisma generate
- npm run db:migrate     # prisma migrate deploy
- npm run db:seed        # tsx prisma/seed.ts (optional)

Run these in CI before starting the app or as part of a scheduled job.

## Security Hardening

- Helmet CSP allows `https:` and `wss:` for connectSrc; images/fonts are configured.
- Global rate limiting is enabled via security middleware; adjust RATE_LIMIT_* envs as needed.
- CSRF disabled in serverless; rely on stateless JWT (guards already applied).
- CORS allows your configured origins and common Vercel subdomain patterns.

## Health Check

- Health module is available at `/{API_PREFIX}/health` (default: `/api/health`).
- Verify after deploy: `curl https://your-app.vercel.app/api/health`

## Notes

- If your Next.js app uses external images with next/image, configure `images.remotePatterns` in `next.config.mjs` to whitelist domains.
- Legacy servers (server/ with Drizzle) are not deployed to Vercel and should be kept for local dev only or removed after migration.
- Nx `frontend/` and Vite `client/` remain for reference; migrate their features into `app/` to reduce maintenance overhead.

## Troubleshooting

- 429 errors → increase RATE_LIMIT_MAX or optimize client request bursts.
- CORS issues → verify CORS_ORIGINS and that the incoming Origin matches exactly.
- Session errors in serverless → ensure ENABLE_CSRF=false; sessions are only used if CSRF is enabled.