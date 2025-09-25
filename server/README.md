# server/ (Express + Drizzle) - Legacy

This directory contains a legacy Express server using Drizzle ORM. It is not suitable for production and is not deployed to Vercel.

Important
- The storage implementation (`server/storage.ts`) mixes Drizzle constructs with Prisma (`this.prisma.*`) and will fail in production.
- Use the NestJS backend in `backend/` with Prisma as the source of truth for production.

Status
- Legacy/dev only. Do not enable in production pipelines.
- For production: `/api/*` is handled by NestJS serverless function.

Migration
- Data model should align with Prisma (`prisma/schema.prisma`).
- If you need local experiments, avoid `this.prisma` usage or limit to Drizzle-only paths, but prefer NestJS modules.