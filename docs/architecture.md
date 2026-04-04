# Architecture

## Proposed Product Shape
- `mobile`: worker experience for browsing, accepting, proving, and tracking microtasks.
- `frontend`: owner/operator experience for creating tasks, monitoring progress, and approving high-value payouts.
- `backend`: source of truth for tasks, submissions, validation outcomes, and payout state.

## Active Delivery Boundary
- This implementation pass will change `backend` and `frontend`.
- `mobile` remains the intended worker client, but it is out of scope for code changes in this pass.

## Why This Split
- Mobile already contains the worker-side capture flow with camera + GPS.
- Frontend already has the richer UI toolkit suitable for owner dashboards.
- Backend filenames already suggest verification/payment integrations, even though implementation is missing.

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

## Implemented Backend Modules
- `task.service.ts`
  - list, create, accept, submit, approve, hydrate task views
- `verification.service.ts`
  - validate proof and drive lifecycle transitions
- `payment.service.ts`
  - threshold policy and payout state transitions
- `human-verification.service.ts`
  - demo human verification guard for workers
- `demo-data.service.ts`
  - seed users/tasks/submissions/validation/payouts

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
- Implement a `PaymentService` abstraction.
- Demo implementation updates payout state in DB instead of relying on real onchain transfer.
- Keep interfaces ready for future contract integration.

## Human Verification Strategy
- Implement a `HumanVerificationService` abstraction.
- Demo version can trust seeded demo users marked as verified humans.
- Keep the service boundary clean for future World/human-verification integration.

## Storage Strategy
- Start with SQLite via Drizzle because that is already configured.
- For demo speed, store proof image payloads directly as data URLs or simple local/demo-safe blobs if needed.
- Keep a `StorageService` boundary if image persistence needs to move later.

## Frontend/Backend Integration
- Frontend calls backend JSON routes directly.
- Mobile calls the same backend JSON routes.
- Shared DTO shapes should eventually move into a shared package or shared folder once implementation begins.

## Local Developer Workflow
- Root-level scripts now provide a single entry point for local usage:
  - `npm run setup`
  - `npm run dev`
  - `npm run build`
- `npm run dev` starts:
  - backend on `http://localhost:3001`
  - frontend on `http://localhost:3000`

## Suggested Initial API
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks/:id/accept`
- `POST /api/tasks/:id/submissions`
- `POST /api/tasks/:id/approve`
- `GET /api/owners/:ownerId/tasks`

## Implemented Web Modules
- `frontend/app/app/page.tsx`
  - owner dashboard route
- `frontend/components/owner-dashboard.tsx`
  - owner selector, task creation, approval queue, inventory, detail view
- `frontend/components/status-badge.tsx`
  - shared task-state presentation
- `frontend/lib/api.ts`
  - API wrapper using `NEXT_PUBLIC_API_URL` with localhost fallback

## Suggested Demo Users
- Owner demo user
- Worker demo user(s)
- Optional admin/approver view using owner identity

## Verification Notes
- Backend TypeScript build passes with `npm run build`.
- Frontend build passes with `npm run build -- --webpack`.
- Default `next build` using Turbopack hit an environment-specific sandbox error related to process/port binding, not an application code error.
