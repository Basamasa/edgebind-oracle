# Requirements

## Status
- Approved for implementation with one active constraint:
- web/backend are being rewritten as a single pure Next.js app.
- mobile remains intentionally excluded because it is being worked on in parallel.

## Product Goal
- Build a simple, demoable human-backed AI agent microtask app with one clean end-to-end flow.

## Core Roles
- Agent owner: creates a microtask with reward, deadline, and proof requirements.
- Worker: verified human who browses tasks, accepts one, and submits proof.
- System/agent: validates proof and routes payout automatically or to manual approval.

## In Scope
- Task creation by owner.
- Task listing for workers.
- Task acceptance by a worker.
- Proof submission with generic structure supporting image/location/request code.
- Backend proof validation result.
- Automatic payout release for low-value tasks.
- Manual approval state for high-value tasks.
- Visible task lifecycle in UI.
- Optional task/submission history that can later support reputation or worker memory.

## Out of Scope
- Broad marketplace mechanics.
- Full anti-fraud system.
- Complex reputation/token economics.
- Heavy DeFi/onchain implementation.
- Full production auth and identity stack beyond a clean demo abstraction.

## Preferred Demo Task
- Example: take a live photo at a specific location for a small reward.
- Data model should remain generic enough for other simple proof-based tasks.

## Required Task Fields
- `id`
- `title`
- `description`
- `rewardAmount`
- `rewardCurrency`
- `deadline`
- `proofType`
- `locationRequirement` (optional)
- `status`
- `ownerId`
- `agentId` or `ownerAgentRef`
- `workerId` (nullable until accepted)
- `requestCode` / nonce
- `approvalThresholdSnapshot`

## Required Proof Submission Fields
- `id`
- `taskId`
- `workerId`
- `submittedAt`
- `imageUrl` or inline demo image payload
- `location` (optional)
- `requestCode`
- `status`

## Required Validation Result Fields
- `valid`
- `reason`
- `requiresApproval`
- `paymentStatus`

## UX Goals
- Keep the flow short and understandable.
- Show status transitions clearly.
- Make owner-side and worker-side responsibilities obvious.
- Preserve demoability even if integrations are mocked behind stable interfaces.

## Delivery Scope For This Pass
- Implement a single pure Next.js app as both UI and API/runtime.
- Do not modify the mobile app in this pass.
