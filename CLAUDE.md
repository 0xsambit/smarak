# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smarak** is a Heritage Site Management SaaS for government authorities. Monorepo with:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (`src/`)
- **Backend**: NestJS 10 + MongoDB + Mongoose (`backend/src/`)
- **Auth**: Clerk (JWT-based, with webhook-driven user provisioning)

## Commands

### Frontend (root directory)
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint
```

### Backend (`backend/` directory)
```bash
npm install
npm run start:dev  # hot reload, http://localhost:8080
npm run build
npm run lint       # ESLint + Prettier auto-fix
npm run format
npm run seed       # populate DB with test data (requires bootstrap admin env vars)
npm run test
npm run test:watch
```

> There is no automated test script in root or backend `package.json` that covers both apps. Run lint as the primary validation step after changes.

Swagger UI is available at `http://localhost:8080/docs` when the backend is running.

## Architecture

### Frontend

**Route/auth boundary**: `src/App.tsx` gates routes with Clerk's `SignedIn/SignedOut`; `src/main.tsx` strictly validates env vars at startup.

**API boundary**: `src/services/api.ts` is the single axios client. It injects Clerk JWTs via request interceptor and handles 401/403 globally. All API calls go through named exports here (`dashboardAPI`, `sitesAPI`, etc.) — do not add ad-hoc fetch/axios in components.

**Feature UI**: Dashboard widgets under `src/components/dashboard/`; route-level orchestration under `src/pages/`.

**Types**: Shared domain types in `src/types/` — reuse rather than redeclare.

### Backend

**Module pattern**: Each domain has its own module under `backend/src/modules/<domain>/` with `controller`, `service`, and `dto/` sub-structure.

**Auth flow**: `ClerkAuthGuard` (`backend/src/common/guards/clerk-auth.guard.ts`) verifies the Clerk JWT on every request and auto-provisions users into MongoDB on first sign-in. `RolesGuard` + `@Roles(...)` decorator enforces RBAC after authentication.

**Roles**: `NATIONAL_ADMIN` > `STATE_ADMIN` > `SITE_OFFICER` — most write endpoints require elevated roles.

**Cross-cutting concerns**:
- Global `ValidationPipe` (whitelist + forbid non-whitelisted) in `main.ts`
- Global `HttpExceptionFilter` for consistent error shape
- `TransformInterceptor` for response envelope
- Helmet, CORS, rate limiting (100 req / 15 min) configured in `app.module.ts`

**Dashboard analytics**: `dashboard.service.ts` uses MongoDB aggregation pipelines. Supports `scope=national|state|site` query param.

**Geospatial**: `Site` schema has a `2dsphere` index on `coordinates`; use `GET /api/sites/nearby?latitude=&longitude=&maxDistance=` for geo queries.

**Uploads**: `uploads` module uses GridFS for image storage.

### Key Schema Enums
- `protectionStatus`: `PROTECTED | RESTRICTED | OPEN`
- `riskLevel`: `LOW | MEDIUM | HIGH`
- `incident.type`: `STRUCTURAL | VANDALISM | OVERCROWDING | ENVIRONMENTAL | SECURITY`
- `incident/conservation status`: `OPEN | IN_PROGRESS | RESOLVED`

## Environment Variables

**Frontend (`.env`)** — see `.env.example`:
- `VITE_CLERK_PUBLISHABLE_KEY` (required at runtime)
- `VITE_API_BASE_URL` (e.g. `http://localhost:8080/api`)

**Backend (`backend/.env`)** — see `backend/.env.example`:
- `MONGODB_URI` — set explicitly; do not rely on the fallback in `database.config.ts`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET` (required in production)
- `BOOTSTRAP_ADMIN_CLERK_ID` + `BOOTSTRAP_ADMIN_EMAIL` (required for seed script)
- `CORS_ORIGIN` (must match frontend URL)

## Conventions

- Do not weaken TypeScript strictness in either `tsconfig.app.json` or `backend/tsconfig.json`.
- Backend path aliases: `@config/*`, `@common/*`, `@modules/*`, `@schemas/*` — use them instead of relative paths.
- All protected backend endpoints follow the `ClerkAuthGuard` → `RolesGuard` → handler pattern; mirror this when adding new endpoints.
- Keep DTO validation aligned with existing `class-validator` + `class-transformer` patterns.
