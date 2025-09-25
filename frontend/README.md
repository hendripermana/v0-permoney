# Frontend (Nx) - Legacy

This `frontend/` directory contains an Nx-based Next.js application that was used historically during development. The production deployment on Vercel now points to the root Next.js App Router in `app/`.

Status
- Legacy/dev only. Not deployed to production.
- New features should target `app/` (Next.js 15 App Router) using components/hooks/lib at repository root.

Migration Notes
- API calls should use the unified client at `lib/api-client.ts` with base URL `/api`.
- Paths and components have equivalents in `components/` and `hooks/` at the root.
- If you still run this app locally, ensure NEXT_PUBLIC_API_URL is `/api` and backend is running.

Why kept
- Reference implementation for certain UI flows.
- Can be used to compare designs or extract parts that have not yet been migrated to `app/`.