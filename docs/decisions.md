# Decisions

## Current Decisions

### 1. Use Mobile As The Worker Demo Surface
- Reason: mobile already has the closest implemented flow for browse -> capture -> submit.
- Impact: we extend existing screens instead of rebuilding the worker experience in web first.

### 2. Use Frontend As The Owner/Admin Surface
- Reason: frontend has a strong UI component base but almost no product logic yet.
- Impact: owner task creation, task monitoring, and approval queue fit naturally here.

### 3. Treat Backend As New Implementation On Top Of Existing Scaffold
- Reason: backend filenames indicate intended architecture, but the actual source files are empty.
- Impact: we should preserve the folder structure where sensible, but not pretend there is reusable backend logic already.

### 4. Shift Naming From `Request` Toward `Task`
- Reason: the requested product language is task/worker/owner/submission/payout, and the current mobile `request` concept is really a task.
- Impact: mobile can be refactored carefully, and the backend/web should adopt task terminology consistently.

### 5. Build Stable Abstractions For Payment And Human Verification
- Reason: real integrations may not exist yet, but the demo flow needs believable system boundaries.
- Impact: demo-safe adapters first, real integrations later without rewriting business logic.

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
- Reason: without modifying mobile in this pass, the web app still needs visible examples of approval, payout, and rejection states.
- Impact: the backend seeds representative tasks, submissions, validation results, and payouts on first run.

### 10. Use Webpack Build Verification For Frontend In This Environment
- Reason: `next build` with Turbopack failed here due sandboxed process/port restrictions during CSS processing.
- Impact: `npm run build -- --webpack` is the reliable verification command for the current environment.

## Open Decisions
- Whether to keep temporary compatibility endpoints (`/api/requests`, `/api/verify`) during migration or update mobile in one pass.
- Whether proof images should remain as inline data URLs for demo speed or move immediately to a storage abstraction.
