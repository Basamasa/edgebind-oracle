# Architecture

## Proposed Product Shape
- `mobile`: worker experience for browsing, accepting, proving, and tracking microtasks.
- `frontend`: single pure Next.js app for owner/operator UI and API/runtime.
- standalone `backend`: removed.

## Active Delivery Boundary
- This implementation pass has collapsed `backend` into `frontend`.
- `mobile` remains the intended worker client, but it is out of scope for code changes in this pass.

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
  - returns valid/invalid, reason, approval flag
- `Payout`
  - tracks whether payment is pending, released, rejected, or awaiting approval

## Implemented Next.js Server Modules
- `frontend/lib/server/task-service.ts`
  - list, create, accept, submit, approve, hydrate task views
- `frontend/lib/server/demo-store.ts`
  - demo users/tasks/submissions/validation/payouts
- `frontend/lib/server/schemas.ts`
  - request validation for route handlers and actions
- `frontend/lib/server/errors.ts`
  - API-friendly error handling

## Proposed Task Lifecycle
- `draft` (optional if we want web form save states; can be skipped in initial demo)
- `open`
- `accepted`
- `submitted`
- `validated`
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
- Approval policy:
  - low-value valid tasks auto-transition to `paid`
  - high-value valid tasks transition to `pending_approval`

## Payment Strategy
- Current implementation uses task-service payout transitions in an in-memory demo store.
- Keep interfaces ready for future contract integration once durable storage is added.

## Human Verification Strategy
- Current implementation trusts seeded demo users marked as verified humans.
- Keep the service boundary clean for future World/human-verification integration.

## Storage Strategy
- Current implementation uses an in-memory demo store.
- For demo speed, proof payloads remain inline values rather than durable media objects.
- Replace this with hosted persistence in a later pass.

## Frontend/Backend Integration
- Frontend calls its own Next.js route handlers.
- Mobile will call the same Next.js route handlers once integrated.
- Shared DTO shapes should eventually move into a shared package or shared folder once implementation begins.

## Local Developer Workflow
- Root-level scripts now provide a single entry point for local usage:
  - `npm run dev`
  - `npm run build`
- `npm run dev` starts only the Next.js app.

## Suggested Initial API
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks/:id/accept`
- `POST /api/tasks/:id/submissions`
- `POST /api/tasks/:id/approve`
- `GET /api/owners/:ownerId/tasks`

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
- The app exposes `/`, `/app`, and the task JSON routes under `/api/*`.
