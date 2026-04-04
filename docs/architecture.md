# Architecture

## Visual Diagram
- Open `docs/architecture.html` in a browser for the repo-level graph view.

## Final Target Product Shape
- `frontend`: single Next.js app for:
  - public landing page
  - owner dashboard
  - shared server/API runtime
- `mobile`: worker app for:
  - browse tasks
  - accept task
  - capture proof
  - submit proof
  - view worker history and payout outcome
- standalone `backend`: removed and should not return.

## Current Delivery Boundary
- This implementation pass has collapsed `backend` into `frontend`.
- `frontend` currently carries the owner flow plus a temporary `/worker` fallback route.
- `mobile` remains out of scope for code changes in this pass.

## Why This Split
- Mobile already contains the worker-side capture flow with camera + GPS.
- The Next.js app is the best deployment target for Vercel.
- The standalone backend is now an architectural mismatch for the desired deploy model.
- Keeping a permanent worker web app plus a worker mobile app would make the repo harder to understand.

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

## Role Ownership
- `Owner`
  - human operator behind a human-backed AI agent
  - creates tasks
  - monitors execution state
  - approves only higher-risk payouts
- `Worker`
  - verified human who accepts and completes tasks
  - uses the worker client to submit proof
- `System`
  - validates proof
  - runs agent decisioning
  - routes payout toward auto-pay or approval

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

## Frontend/Mobile/Backend Integration
- Owner dashboard uses server actions and server-side data hydration.
- Next.js route handlers expose the shared lifecycle over JSON for mobile integration.
- The current `/worker` web route is a temporary fallback for internal testing, not the desired long-term worker surface.
- Mobile should become the primary worker client after contract alignment.
- Shared DTO shapes should move into a shared folder or package once mobile integration starts.

## Local Developer Workflow
- Root-level npm workspace commands now provide the single entry point for local usage:
  - `npm install`
  - `npm run dev`
  - `npm run build`
  - `npm test`
- `npm run dev` starts only the Next.js app.

## Shared API Shape
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks/:id/accept`
- `POST /api/tasks/:id/submissions`
- `POST /api/tasks/:id/approve`
- `GET /api/owners/:ownerId/tasks`
- Future decision-specific API can remain internal if the decision runs during submission handling.

## Current Next.js API Shape
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

## Architecture Direction
- Keep `frontend` as the only backend/runtime.
- Keep `mobile` as the long-term worker client.
- Remove the need for the temporary web worker route after mobile aligns to the shared task API.
- Add `World` first, `Hedera` second, and `Ledger` third.
- Keep `0G` off the critical path.
