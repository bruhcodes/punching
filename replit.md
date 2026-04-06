# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Punch Card PWA App

A digital punch card loyalty system for coffee/boba shops.

### Artifact: `punch-card` (previewPath: `/`)
React + Vite PWA frontend. Located in `artifacts/punch-card/`.

### Features
- **PWA**: install prompt (manifest.json + service worker), offline support
- **User flow**: install prompt → onboarding (name/phone) → punch card with QR code → notifications
- **Admin dashboard**: stats overview, user management, punch controls (add/remove/reset), notifications panel, style settings
- **QR codes**: each user gets a UUID-based QR code for admin scanning

### Database Tables
- `users` — id (UUID text), name, phone, punch_count, total_punches, qr_code, created_at
- `notifications` — id (UUID text), user_id, message, read, created_at
- `settings` — id ("default"), stamp_type, background_style, progress_style, shop_name

### API Routes (`/api`)
- `GET/POST /users` — list/create users
- `GET /users/:id` — get user
- `POST /users/:id/punch` — add punch
- `POST /users/:id/remove-punch` — remove punch
- `POST /users/:id/reset` — reset punches
- `GET/POST /notifications` — list/send notifications
- `POST /notifications/:id/read` — mark read
- `GET/PATCH /settings` — get/update settings
- `GET /stats` — admin dashboard stats
