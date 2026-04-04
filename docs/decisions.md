# Decisions

## Current Decisions

### 1. Use Frontend As The Only Web Runtime
- Reason: deployment simplicity on Vercel now takes priority over preserving the earlier split architecture.
- Impact: owner UI and API/runtime now live together inside the Next.js app.

### 2. Remove The Standalone Backend Entirely
- Reason: a separate Express service is the wrong deploy shape for the current goal.
- Impact: backend logic moved into `frontend/app/api/*` and `frontend/lib/server/*`, and the old backend was deleted.

### 3. Shift Naming From `Request` Toward `Task`
- Reason: the requested product language is task/worker/owner/submission/payout, and the current mobile `request` concept is really a task.
- Impact: mobile can be refactored carefully, and the backend/web should adopt task terminology consistently.

### 4. Replace The In-Memory Store With Postgres Before External Integrations
- Reason: the execution guarantee is not credible on serverless without durable state and transaction-safe lifecycle updates.
- Impact: tasks, submissions, validations, and payouts now persist in Postgres, while external integrations remain a later layer.

### 5. Treat World As The Shared Human Identity Layer
- Reason: the hackathon narrative is stronger if both workers and human-backed agents are grounded in the same human-verification foundation.
- Impact: `World` should not be modeled as worker-only verification; it should anchor both worker eligibility and agent trust.

### 6. Prefer One Clean End-To-End Flow Over Breadth
- Reason: requested scope emphasizes demoability and coherent architecture.
- Impact: avoid marketplace breadth, advanced fraud tooling, or overdesigned reputation systems in the first implementation.

### 7. Exclude Mobile Changes In This Implementation Pass
- Reason: mobile is being developed in parallel by someone else.
- Impact: backend APIs and data contracts should be designed so the mobile client can integrate later without needing web-specific logic.

### 8. Add An Explicit Agent Decision Step
- Reason: validation alone does not express the “human-backed agent” story strongly enough.
- Impact: after validation, the system should make a simple decision such as `auto_pay` or `requires_approval` before payout routing.

### 9. Use Web As The Hackathon Worker Surface
- Reason: the deployed demo must work end-to-end without depending on the separate mobile workstream.
- Impact: `/work` now provides the worker browse -> accept -> submit -> outcome loop while mobile remains untouched.

### 10. Preserve The Landing Page And Add `/app` And `/work` For Product UI
- Reason: the product needs a clear entry point plus separate owner and worker surfaces.
- Impact: landing copy explains the product, `/app` serves owners, and `/work` serves workers.

### 11. Seed Lifecycle Data For Demo Clarity
- Reason: without modifying mobile in this pass, the app still needs visible examples of approval, payout, and rejection states.
- Impact: the Next.js demo store seeds representative tasks, submissions, validation results, and payouts on first load.

### 12. Use Webpack Build Verification For Frontend In This Environment
- Reason: `next build` with Turbopack failed here due sandboxed process/port restrictions during CSS processing.
- Impact: `npm run build -- --webpack` is the reliable verification command for the current environment.

### 13. Add Root-Level Convenience Scripts
- Reason: the repo previously had no root `package.json`, which made local startup confusing.
- Impact: local testing is now reduced to `npm run dev` and `npm run build` from the repo root.

### 14. Treat The Rewrite As A Code Reset, Not A History Rewrite
- Reason: the user wants the architecture removed, but rewriting git history is riskier than replacing the code in forward commits.
- Impact: delete and replace code in new commits rather than rebasing away earlier work.

### 15. Defer 0G Entirely For The Hackathon Critical Path
- Reason: the core demo still needs worker flow, decisioning, and payout integration, and `0G` would dilute focus.
- Impact: agent memory/task history are postponed until the main loop is complete.

### 16. Treat Current Integrations As Claimed Targets, Not Completed Wiring
- Reason: the implementation now has durable lifecycle state, but `World`, `Hedera`, and `Ledger` are still not wired.
- Impact: audit and planning should classify these as stubs until real gating or realistic simulation is added.

### 17. Treat Deployment Safety As A Separate Requirement From Local Demo Correctness
- Reason: persistence and authority checks are now durable, but deployed env wiring and external integrations still matter separately.
- Impact: passing local lifecycle tests is necessary but not sufficient for production readiness.

### 18. Use Signed Cookie Sessions As The Interim Auth Layer
- Reason: hidden form fields and query-string actor switching were too weak for the execution-layer model.
- Impact: owner and worker actions are now bound to demo sessions, while real identity integration remains a later step.

### 19. Use The Repo Root As The Only Normal npm Workflow Surface
- Reason: asking the user to `cd frontend` for installs and scripts is avoidable friction in a single-app deployment target.
- Impact: the repo now uses an npm workspace rooted at `/`, with one lockfile and root-level `npm install`, `npm run dev`, `npm run build`, and `npm test`.

## Open Decisions
- Whether to keep temporary compatibility endpoints (`/api/requests`, `/api/verify`) during migration or update mobile in one pass.
- Which hosted persistence layer should replace the in-memory demo store for Vercel deployment.
