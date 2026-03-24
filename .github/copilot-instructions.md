# Copilot Instructions for This Workspace

## Repo Shape

- Monorepo-style workspace with two apps:
     - Frontend: React + Vite + TypeScript in `src/`
     - Backend: NestJS + MongoDB in `backend/src/`
- Primary docs to consult first:
     - `GETTING_STARTED.md`
     - `backend/README.md`
     - `.env.example`
     - `backend/.env.example`

## Fast Start Commands

- Install frontend deps: `npm install`
- Start frontend: `npm run dev`
- Build frontend: `npm run build`
- Lint frontend: `npm run lint`

- Install backend deps: `cd backend && npm install`
- Start backend (watch): `cd backend && npm run start:dev`
- Build backend: `cd backend && npm run build`
- Lint backend: `cd backend && npm run lint`
- Seed backend data: `cd backend && npm run seed`

## Validation Expectations

- If you change frontend code, run: `npm run lint`
- If you change backend code, run: `cd backend && npm run lint`
- If you change runtime behavior, also run the affected app locally.
- Note: there is no automated test script currently in either root `package.json` or `backend/package.json`.

## Architecture Boundaries

- Frontend routing/auth boundary:
     - `src/App.tsx` for route gating with Clerk
     - `src/main.tsx` for strict env validation and Clerk provider bootstrap
- Frontend API boundary:
     - `src/services/api.ts` is the single axios client and feature API surface
     - Prefer adding endpoints there instead of ad-hoc fetch/axios calls in components
- Frontend feature UI:
     - Dashboard widgets live under `src/components/dashboard/`
     - Route-level orchestration lives in `src/pages/`

- Backend composition:
     - Root module and global config in `backend/src/app.module.ts`
     - Bootstrap/middleware/pipes/docs in `backend/src/main.ts`
     - Domain modules under `backend/src/modules/*` with `controller/service/dto` pattern
- Backend cross-cutting concerns:
     - Guards/decorators in `backend/src/common/guards` and `backend/src/common/decorators`
     - Global exception filter in `backend/src/common/filters/http-exception.filter.ts`

## Project Conventions

- Keep TypeScript strictness intact; do not weaken compiler settings.
- Reuse shared domain types from `src/types/` on frontend.
- Preserve module-per-domain pattern on backend.
- For protected backend endpoints, follow existing auth + RBAC approach:
     - `ClerkAuthGuard` for authentication
     - `RolesGuard` + `@Roles(...)` for authorization
- Keep API payload and DTO validation aligned with existing class-validator patterns.

## Environment and Pitfalls

- Frontend requires at runtime:
     - `VITE_CLERK_PUBLISHABLE_KEY`
     - `VITE_API_BASE_URL`
     - See `.env.example`
- Backend requires at runtime:
     - `MONGODB_URI`
     - `CLERK_SECRET_KEY`
     - plus `CLERK_WEBHOOK_SECRET` in production
     - See `backend/.env.example`
- Seed script requires bootstrap admin env vars (`BOOTSTRAP_ADMIN_CLERK_ID`, `BOOTSTRAP_ADMIN_EMAIL`).
- Do not rely on fallback DB URI in `backend/src/config/database.config.ts`; set `MONGODB_URI` explicitly.

## Link, Do Not Duplicate

- For setup and API usage details, reference existing docs instead of rewriting them:
     - `GETTING_STARTED.md`
     - `backend/README.md`

## High-Value Reference Files

- Frontend:
     - `src/main.tsx`
     - `src/App.tsx`
     - `src/pages/Dashboard.tsx`
     - `src/services/api.ts`
- Backend:
     - `backend/src/main.ts`
     - `backend/src/app.module.ts`
     - `backend/src/common/guards/clerk-auth.guard.ts`
     - `backend/src/common/guards/roles.guard.ts`
     - `backend/src/modules/dashboard/dashboard.service.ts`
