# Todos

## Phase 1: Discovery And Planning
- [x] Inspect repo structure and existing app boundaries.
- [x] Identify reusable mobile, frontend, and backend scaffolding.
- [x] Document current state, scope, architecture direction, and decisions.
- [x] Get approval on the proposed implementation plan.

## Phase 2: Backend Foundation
- [x] Implement backend app bootstrap, env loading, and route registration.
- [x] Add Drizzle schema for tasks, submissions, validations, and payout events/states.
- [x] Add seed/demo data strategy.
- [x] Add task lifecycle service layer.
- [x] Add payment policy abstraction with auto-pay vs approval threshold.
- [x] Add proof validation abstraction with demo-safe rules.

## Phase 3: API Surface
- [x] `POST /api/tasks`
- [x] `GET /api/tasks`
- [x] `GET /api/tasks/:id`
- [x] `POST /api/tasks/:id/accept`
- [x] `POST /api/tasks/:id/submissions`
- [x] `POST /api/tasks/:id/approve`
- [x] `GET /api/owners/:ownerId/tasks`
- [ ] Keep compatibility aliases only if needed for existing mobile flow.

## Phase 4: Mobile Worker Flow
- [ ] Deferred in this pass because mobile is being developed separately.

## Phase 5: Web Owner Flow
- [x] Replace marketing-only home/app surface with a demo app dashboard or add dashboard routes alongside the landing page.
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
- [ ] Integrate mobile against the new backend task APIs when that parallel work is ready.
- [ ] Add a shared package or shared folder for API DTOs.
- [ ] Add runtime/API smoke tests once the environment allows loopback connections or a test harness is added.
