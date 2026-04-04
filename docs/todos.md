# Todos

## Phase 1: Discovery And Planning
- [x] Inspect repo structure and existing app boundaries.
- [x] Identify reusable mobile, frontend, and backend scaffolding.
- [x] Document current state, scope, architecture direction, and decisions.
- [x] Get approval on the proposed implementation plan.

## Phase 2: Backend Foundation
- [x] Remove the standalone backend app and move backend logic into Next.js.
- [x] Add Next.js route handlers for tasks, approvals, and demo users.
- [x] Rebuild server-side task lifecycle services inside the Next.js app.
- [x] Replace standalone backend workflow scripts with pure Next.js scripts.

## Phase 3: API Surface
- [x] `POST /api/tasks`
- [x] `GET /api/tasks`
- [x] `GET /api/tasks/:id`
- [x] `POST /api/tasks/:id/accept`
- [x] `POST /api/tasks/:id/submissions`
- [x] `POST /api/tasks/:id/approve`
- [x] `GET /api/users`
- [x] `GET /api/owners/:ownerId/tasks`

## Phase 4: Mobile Worker Flow
- [ ] Deferred in this pass because mobile is being developed separately.

## Phase 5: Web Owner Flow
- [x] Rewrite the current web surface inside the new pure Next.js structure.
- [x] Add owner task creation form.
- [x] Add owner task list/detail views.
- [x] Add approval queue for high-value completed tasks.
- [x] Show task lifecycle timeline/status badges.

## Phase 6: Polish
- [ ] Align naming and shared status enums across backend/mobile/frontend.
- [ ] Add lightweight comments where logic is non-obvious.
- [ ] Add basic verification tests for lifecycle transitions.
- [x] Refresh docs after each implementation phase.
- [x] Add root-level developer workflow scripts for simpler local startup.

## Remaining Work
- [ ] Integrate mobile against the new Next.js API routes when that parallel work is ready.
- [ ] Add a shared package or shared folder for API DTOs.
- [ ] Replace the in-memory demo store with durable hosted persistence for Vercel deployment.
- [ ] Add runtime/API smoke tests once the environment allows loopback connections or a test harness is added.
