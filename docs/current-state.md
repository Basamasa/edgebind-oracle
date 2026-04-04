# Current State

## Repository Shape
- Root contains `frontend`, `mobile`, `contracts`, and `ios`.
- This is a multi-app repo without a root workspace manager (`pnpm-workspace.yaml`, `turbo.json`, `nx.json` are absent).
- `README.md` exists but was intentionally ignored for discovery.
- Root `package.json` now points only to the Next.js app for local dev and builds.

## Frontend
- Stack: Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui-style component set.
- This is now the only web/backend surface in the repo.
- Current product surface includes:
  - `frontend/app/page.tsx`
  - `frontend/app/app/page.tsx`
  - `frontend/app/work/page.tsx`
  - `frontend/app/api/**`
  - `frontend/lib/server/demo-store.ts`
  - `frontend/lib/server/task-service.ts`
- Implemented app capabilities:
  - landing page plus owner dashboard under `/app`
  - worker console under `/work`
  - Next.js route handlers for users, tasks, task detail, accept, submit, approve, and owner task list
  - server-side task lifecycle logic inside the Next.js app
  - explicit post-validation agent decision (`auto_pay` vs `requires_approval`)
  - server actions for owner task creation/approval and worker accept/submit flows
  - seeded demo store with open, accepted, pending approval, paid, and rejected tasks
- The current demo store is in-memory and suited for demo flow, not durable production persistence.

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
- Durable hosted persistence for Vercel deployment.
- Real `World`/`Hedera`/`Ledger` integrations.
- Real worker client integration against the new Next.js API routes.
- Automated tests beyond build verification.

## Current Recommendation
- Keep API and UI together inside the Next.js app.
- Use the web app as the end-to-end hackathon demo surface while mobile is developed separately.
- Replace the demo in-memory store with a hosted database in a later pass.
- Model `World` as the identity layer for both workers and human-backed agents, not just workers.
- Defer `0G` entirely until the core product loop is complete and stable.
- Keep mobile untouched during the rewrite.
