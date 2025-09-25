# Legacy Modules and Directories

This document lists parts of the repository that are kept for development reference but are not deployed in production.

## Frontend (Nx) - `frontend/`
- Status: Legacy/dev only.
- Production frontend is the Next.js App Router at repository root (`app/`).
- API calls should use unified client `lib/api-client.ts` (base `/api`).
- Tailwind and shared components/hooks reside at repository root.

## Client (Vite) - `client/`
- Status: Legacy/dev only.
- Originally deployed to Vercel as static build. Now superseded by `app/`.
- Re-exports unified API client and some utilities; useful as a reference.

## Express + Drizzle - `server/`
- Status: Legacy/dev only.
- Contains known bugs (e.g., `server/storage.ts` mixing Drizzle and Prisma).
- Production backend is NestJS in `backend/` using Prisma.

## ORM Redundancy
- Prisma is the production ORM.
- Drizzle is kept for reference. Other ORM dependencies (TypeORM, Sequelize, MikroORM, Mongoose, Kysely, Knex) should not be used in production paths.

## Deployment
- See `docs/DEPLOYMENT.md` for production configuration on Vercel.
- `vercel.json` routes `/api/*` to NestJS (serverless) and serves Next.js from root.