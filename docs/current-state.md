# Current State

## Repository Shape
- Root contains `backend`, `frontend`, `mobile`, `contracts`, and `ios`.
- This is a multi-app repo without a root workspace manager (`pnpm-workspace.yaml`, `turbo.json`, `nx.json` are absent).
- `README.md` exists but was intentionally ignored for discovery.

## Backend
- Stack: Node.js + TypeScript + Express 5 + Drizzle ORM + SQLite (`backend/package.json`, `backend/drizzle.config.ts`).
- Backend is now implemented as a working task lifecycle API.
- Implemented backend capabilities:
  - app bootstrap, env parsing, JSON API routing, CORS, and error handling
  - SQLite schema bootstrap for `users`, `tasks`, `task_submissions`, `validation_results`, and `payouts`
  - seeded demo data covering `open`, `accepted`, `pending_approval`, `paid`, and `rejected` task states
  - task creation, acceptance, proof submission, validation, and approval flows
  - payment and human-verification demo abstractions
- Implemented API routes:
  - `GET /api/users`
  - `GET /api/tasks`
  - `GET /api/tasks/:taskId`
  - `POST /api/tasks`
  - `POST /api/tasks/:taskId/accept`
  - `POST /api/tasks/:taskId/submissions`
  - `POST /api/tasks/:taskId/approve`
  - `GET /api/owners/:ownerId/tasks`
- Environment hints suggest planned integrations:
  - SQLite/Postgres-compatible DB URL
  - contract address / RPC URL
  - 0G storage
  - World ID app ID

## Frontend
- Stack: Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui-style component set.
- Current product surface now includes:
  - `frontend/app/page.tsx`
  - `frontend/app/app/page.tsx`
  - `frontend/components/navigation.tsx`
  - `frontend/components/hero.tsx`
  - `frontend/components/owner-dashboard.tsx`
- Implemented web features:
  - owner selector
  - task creation form
  - approval queue
  - task inventory and detail panel
  - direct backend API integration
- Landing page remains in place and now routes CTAs into `/app`.
- Strong reusable asset: extensive ready-made UI primitives under `frontend/components/ui/**`.

## Mobile
- Stack: Vite + React 19 + TypeScript PWA-style app.
- Most advanced product surface in the repo today.
- Existing screens:
  - `Login` with mock credentials
  - `RequestList` for browsing open requests
  - `CreateRequest` for owner-side local task creation
  - `History` for local submission history
  - camera/GPS capture + proof submission flow inside `mobile/src/App.tsx`
- Existing mobile behavior:
  - fetches `GET /api/requests`
  - submits `POST /api/verify`
  - falls back to mock requests if backend is unavailable
  - stores proof history in localStorage
- Current mobile domain is request/proof oriented, which is close to the planned microtask flow.
- Auth is mock-only and local.
- Mobile was intentionally left unchanged in this implementation pass.

## Contracts / iOS
- `contracts` contains only `.gitkeep`.
- `ios` contains only `.gitkeep`.
- No active smart contract or native iOS implementation exists in the repo yet.

## Reusable Domain Concepts Already Present
- `request` as the current task-like unit.
- geolocation-bound proof capture.
- photo proof submission.
- deadline and amount concepts.
- worker-facing browsing and submission UI.
- owner-side create-request UI.
- proof history as a seed for worker memory/history.

## Missing Pieces
- Shared types between apps.
- Real auth/session model.
- Real worker client integration against the new backend task APIs.
- Real storage/payment/human-verification integrations.
- Automated tests beyond build verification.

## Current Recommendation
- Reuse the mobile request/proof flow as the worker experience foundation when mobile integration resumes.
- Keep the current backend contracts stable so mobile can adopt them without web-specific branching.
- Preserve the web dashboard as the owner/admin control plane for demos.
