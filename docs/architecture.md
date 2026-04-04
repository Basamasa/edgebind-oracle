# Architecture

## Proposed Product Shape
- `mobile`: parallel worker client, intentionally untouched in this pass.
- `frontend`: single pure Next.js app for owner UI, worker UI, and API/runtime.
- standalone `backend`: removed.

## Active Delivery Boundary
- This implementation pass has collapsed `backend` into `frontend`.
- `frontend` now carries the full hackathon demo flow under `/owner` and `/worker`.
- `mobile` remains out of scope for code changes in this pass.

## Why This Split
- Mobile already contains the worker-side capture flow with camera + GPS.
- The Next.js app is the best deployment target for Vercel.
- The standalone backend is now an architectural mismatch for the desired deploy model.

## Proposed Core Domain
- `Task`
  - created by owner/agent
  - available until accepted or expired
  - contains reward, deadline, proof requirements, optional location, request code
- `TaskSubmission`
  - created by worker after acceptance
  - contains proof payload and metadata
- `ValidationResult`
  - computed by backend validator
  - returns valid/invalid, reason, and decision inputs
- `AgentDecision`
  - simple post-validation decision made by the human-backed agent layer
  - outputs `auto_pay` or `requires_approval`
- `Payout`
  - tracks whether payment is pending, released, rejected, or awaiting approval

## Implemented Next.js Server Modules
- `frontend/lib/server/db.ts`
  - Postgres bootstrap, seeded users, transactions, and health checks
- `frontend/lib/server/session.ts`
  - signed cookie sessions for owner and worker actions
- `frontend/lib/server/task-service.ts`
  - list, create, accept, submit, approve, hydrate task views
- `frontend/lib/server/schemas.ts`
  - request validation for route handlers and actions
- `frontend/lib/server/errors.ts`
  - API-friendly error handling

## Proposed Task Lifecycle
- `draft` (optional if we want web form save states; can be skipped in initial demo)
- `open`
- `accepted`
- `submitted`
- `pending_approval`
- `paid`
- `rejected`
- `expired`

## Validation Strategy
- Keep validation deterministic and demo-safe.
- Initial validation inputs:
  - request code matches task nonce
  - submission happens before deadline
  - task is assigned to the submitting worker
  - location exists when required
  - location falls within task radius when required
  - image is present when proof type requires it

## Agent Decision Strategy
- After proof validates, run a simple agent decision step.
- Initial decision inputs:
  - proof validity
  - reward amount
  - approval threshold
  - optional future worker/task memory
- Initial outputs:
  - `auto_pay`
  - `requires_approval`

## Payment Strategy
- Current implementation uses task-service payout transitions persisted in Postgres.
- Keep interfaces ready for future contract integration once the real payout rail is added.
- Target hackathon execution rail: `Hedera`.

## Human Verification Strategy
- Current implementation uses signed demo sessions plus seeded verified workers in Postgres.
- Target hackathon identity layer: `World`.
- `World` should support both:
  - verified human workers
  - human-backed agents making payout decisions

## Storage Strategy
- Current implementation uses Postgres as the source of truth for users, tasks, submissions, validations, and payouts.
- For demo speed, proof payloads remain inline values rather than durable media objects.
- Proof media storage still needs a dedicated production path.
- `0G` is deferred for now and should not be part of the active implementation path.

## Manual Approval Strategy
- Current implementation uses an in-app approval action.
- Target hackathon approval layer: `Ledger` for higher-risk payments only.

## Frontend/Backend Integration
- Owner dashboard uses server actions and server-side data hydration.
- Worker console uses server actions and server-side data hydration.
- Next.js route handlers expose the same lifecycle over JSON for future mobile integration.
- Mobile will call the same Next.js route handlers once integrated.
- Shared DTO shapes should eventually move into a shared package or shared folder once implementation begins.

## Local Developer Workflow
- Root-level npm workspace commands now provide the single entry point for local usage:
  - `npm install`
  - `npm run dev`
  - `npm run build`
  - `npm test`
- `npm run dev` starts only the Next.js app.

## Suggested Initial API
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks/:id/accept`
- `POST /api/tasks/:id/submissions`
- `POST /api/tasks/:id/approve`
- `GET /api/owners/:ownerId/tasks`
- Future decision-specific API can remain internal if the decision runs during submission handling.

## Target Next.js API Shape
- `app/api/users/route.ts`
- `app/api/tasks/route.ts`
- `app/api/tasks/[taskId]/route.ts`
- `app/api/tasks/[taskId]/accept/route.ts`
- `app/api/tasks/[taskId]/submissions/route.ts`
- `app/api/tasks/[taskId]/approve/route.ts`
- `app/api/owners/[ownerId]/tasks/route.ts`

## Suggested Demo Users
- Owner demo user
- Worker demo user(s)
- Optional admin/approver view using owner identity

## Verification Notes
- Root `npm run build` passes and builds the Next.js app with Webpack in this environment.
- `npm --prefix frontend run test` passes against the lifecycle suite using `pg-mem`.
- The app exposes `/`, `/owner`, `/worker`, legacy redirects at `/app` and `/work`, and the task JSON routes under `/api/*`.
