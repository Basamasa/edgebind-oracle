# Decisions

## Current Decisions

### 1. Use Mobile As The Worker Demo Surface
- Reason: mobile already has the closest implemented flow for browse -> capture -> submit.
- Impact: we extend existing screens instead of rebuilding the worker experience in web first.

### 2. Use Frontend As The Only Web Runtime
- Reason: deployment simplicity on Vercel now takes priority over preserving the earlier split architecture.
- Impact: owner UI and API/runtime now live together inside the Next.js app.

### 3. Remove The Standalone Backend Entirely
- Reason: a separate Express service is the wrong deploy shape for the current goal.
- Impact: backend logic moved into `frontend/app/api/*` and `frontend/lib/server/*`, and the old backend was deleted.

### 4. Shift Naming From `Request` Toward `Task`
- Reason: the requested product language is task/worker/owner/submission/payout, and the current mobile `request` concept is really a task.
- Impact: mobile can be refactored carefully, and the backend/web should adopt task terminology consistently.

### 5. Use An In-Memory Demo Store For The Rewrite Milestone
- Reason: the immediate goal is a pure Next.js reset and demoable flow, not full infrastructure setup.
- Impact: the app is easy to run and deploy, but persistence is not durable yet.

### 6. Prefer One Clean End-To-End Flow Over Breadth
- Reason: requested scope emphasizes demoability and coherent architecture.
- Impact: avoid marketplace breadth, advanced fraud tooling, or overdesigned reputation systems in the first implementation.

### 7. Exclude Mobile Changes In This Implementation Pass
- Reason: mobile is being developed in parallel by someone else.
- Impact: backend APIs and data contracts should be designed so the mobile client can integrate later without needing web-specific logic.

### 8. Preserve The Landing Page And Add `/app` For Product UI
- Reason: the existing landing page is already usable, while the new task operations UI is application-facing.
- Impact: owner/admin workflows live under `/app` and marketing copy can continue to evolve independently.

### 9. Seed Lifecycle Data For Demo Clarity
- Reason: without modifying mobile in this pass, the app still needs visible examples of approval, payout, and rejection states.
- Impact: the Next.js demo store seeds representative tasks, submissions, validation results, and payouts on first load.

### 10. Use Webpack Build Verification For Frontend In This Environment
- Reason: `next build` with Turbopack failed here due sandboxed process/port restrictions during CSS processing.
- Impact: `npm run build -- --webpack` is the reliable verification command for the current environment.

### 11. Add Root-Level Convenience Scripts
- Reason: the repo previously had no root `package.json`, which made local startup confusing.
- Impact: local testing is now reduced to `npm run dev` and `npm run build` from the repo root.

### 12. Treat The Rewrite As A Code Reset, Not A History Rewrite
- Reason: the user wants the architecture removed, but rewriting git history is riskier than replacing the code in forward commits.
- Impact: delete and replace code in new commits rather than rebasing away earlier work.

## Open Decisions
- Whether to keep temporary compatibility endpoints (`/api/requests`, `/api/verify`) during migration or update mobile in one pass.
- Which hosted persistence layer should replace the in-memory demo store for Vercel deployment.
