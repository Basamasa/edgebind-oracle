# Current State

## Repository Shape
- Root contains `frontend`, `mobile`, `contracts`, and `ios`.
- This is a multi-app repo without a root workspace manager (`pnpm-workspace.yaml`, `turbo.json`, `nx.json` are absent).
- `README.md` exists but was intentionally ignored for discovery.
- Root `package.json` is now the primary npm workspace entrypoint for the Next.js app.

## Frontend
- Stack: Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui-style component set.
- This is now the only web/backend surface in the repo.
- Current product surface includes:
  - `frontend/app/page.tsx`
  - `frontend/app/owner/page.tsx`
  - `frontend/app/worker/page.tsx`
  - `frontend/app/app/page.tsx` (legacy redirect)
  - `frontend/app/work/page.tsx` (legacy redirect)
  - `frontend/app/api/**`
  - `frontend/app/auth/actions.ts`
  - `frontend/lib/server/db.ts`
  - `frontend/lib/server/session.ts`
  - `frontend/lib/server/task-service.ts`
  - `frontend/tests/lifecycle.test.ts`
- Implemented app capabilities:
  - simple landing page that routes users into the correct role
  - owner dashboard under `/owner`
  - temporary worker web flow under `/worker`
  - cookie-bound demo auth for owner and worker sessions
  - Next.js route handlers for users, tasks, task detail, accept, submit, approve, and owner task list
  - database-backed task lifecycle logic inside the Next.js app
  - explicit post-validation agent decision (`auto_pay` vs `requires_approval`)
  - server actions for owner task creation/approval and worker accept/submit flows
  - proof-aware owner approval detail with latest submission data
  - lifecycle verification tests using `pg-mem`
- The active persistence path now requires `DATABASE_URL` and creates/uses real Postgres tables.
- Demo users are seeded into the database during bootstrap; task state is no longer stored in memory.
- Audit result: the core execution loop is now deployment-shaped, but `World`/`Hedera`/`Ledger` are still not implemented.
- Architecture note:
  - `/owner` is intended to stay
  - `/worker` is temporary and should not become a permanent second worker product surface

## Mobile
- Stack: Vite + React 19 + TypeScript PWA-style app.
- This should become the primary worker product surface once contract alignment happens.
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
- Current mobile domain is request/proof oriented and does not match the new shared task API contract.
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
- Real `World`/`Hedera`/`Ledger` integrations.
- Real worker client integration against the new Next.js API routes.
- Hosted production database wiring and env setup on the actual deployment target.
- Stronger auth than demo cookie sessions.
- Media storage for proof assets beyond inline demo strings.
- Broader automated test coverage beyond lifecycle service tests.

## Current Recommendation
- Keep API and UI together inside the Next.js app.
- Use the web app for the owner surface and shared backend runtime.
- Treat mobile as the real worker client long-term.
- Treat the current `/worker` web route as a temporary fallback only.
- Use the DB-backed core as the baseline for all future work.
- Run local workflow from the repo root with `npm install`, `npm run dev`, `npm run build`, and `npm test`.
- Model `World` as the identity layer for both workers and human-backed agents, not just workers.
- Defer `0G` entirely until the core product loop is complete and stable.
- Keep mobile untouched during the rewrite.
- Align mobile to the shared task lifecycle before calling the repo architecture complete.
- Treat the current state as a production-shaped core loop that still needs external integrations before final demo claims.
