import test from "node:test"
import assert from "node:assert/strict"

import { resetDatabaseForTests } from "../lib/server/db"
import {
  acceptTask,
  approveTask,
  createTask,
  getTaskById,
  listUsers,
  markUserHumanVerified,
  submitTask,
} from "../lib/server/task-service"

const ownerId = "owner-ava"
const otherOwnerId = "owner-jules"
const workerId = "worker-lina"

function futureDate(hours = 4) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

async function freshLowRiskTask() {
  return createTask({
    ownerId,
    title: "Capture storefront proof",
    description: "Take a fresh photo of the storefront and include the code.",
    rewardAmount: 5,
    rewardCurrency: "USD",
    deadline: futureDate(),
    proofType: "photo_location",
    locationRequirement: {
      label: "Storefront",
      latitude: 43.5534,
      longitude: 7.0174,
      radiusMeters: 120,
    },
    requestCode: "STORE-1001",
  })
}

async function freshHighRiskTask() {
  return createTask({
    ownerId,
    title: "Inspect event setup",
    description: "Document full event setup before payout is released.",
    rewardAmount: 75,
    rewardCurrency: "USD",
    deadline: futureDate(),
    proofType: "photo_location",
    locationRequirement: {
      label: "Event hall",
      latitude: 43.5534,
      longitude: 7.0174,
      radiusMeters: 120,
    },
    requestCode: "EVENT-5500",
  })
}

test.beforeEach(async () => {
  await resetDatabaseForTests()
})

test("valid low-risk proof releases payout automatically after validation", async () => {
  const task = await freshLowRiskTask()
  await acceptTask(task.id, { workerId })

  const submitted = await submitTask(task.id, {
    workerId,
    requestCode: "STORE-1001",
    imageDataUrl: "demo://proof",
    location: {
      latitude: 43.5534,
      longitude: 7.0174,
      accuracyMeters: 9,
    },
  })

  assert.equal(submitted.status, "paid")
  assert.equal(submitted.validation?.valid, true)
  assert.equal(submitted.validation?.agentDecision, "auto_pay")
  assert.equal(submitted.payout?.status, "released")
})

test("high-risk proof stays pending until approved by the task owner", async () => {
  const task = await freshHighRiskTask()
  await acceptTask(task.id, { workerId })

  const submitted = await submitTask(task.id, {
    workerId,
    requestCode: "EVENT-5500",
    imageDataUrl: "demo://proof",
    location: {
      latitude: 43.5534,
      longitude: 7.0174,
      accuracyMeters: 12,
    },
  })

  assert.equal(submitted.status, "pending_approval")
  assert.equal(submitted.validation?.agentDecision, "requires_approval")
  assert.equal(submitted.payout?.status, "pending_approval")

  const approved = await approveTask(task.id, {
    approverId: ownerId,
    approvalNote: "Manual review complete",
  })

  assert.equal(approved.status, "paid")
  assert.equal(approved.payout?.status, "released")
  assert.equal(approved.payout?.approvedBy, ownerId)
})

test("invalid proof cancels payout instead of releasing funds", async () => {
  const task = await freshLowRiskTask()
  await acceptTask(task.id, { workerId })

  const submitted = await submitTask(task.id, {
    workerId,
    requestCode: "WRONG-CODE",
    imageDataUrl: "demo://proof",
    location: {
      latitude: 43.5534,
      longitude: 7.0174,
      accuracyMeters: 9,
    },
  })

  assert.equal(submitted.status, "rejected")
  assert.equal(submitted.validation?.valid, false)
  assert.equal(submitted.payout?.status, "cancelled")
})

test("submission is rejected if the task was never accepted", async () => {
  const task = await freshLowRiskTask()

  await assert.rejects(
    submitTask(task.id, {
      workerId,
      requestCode: "STORE-1001",
      imageDataUrl: "demo://proof",
      location: {
        latitude: 43.5534,
        longitude: 7.0174,
      },
    }),
    /not ready for submission/i,
  )

  const untouched = await getTaskById(task.id)
  assert.equal(untouched.payout, null)
})

test("a different owner cannot approve a pending payout", async () => {
  const task = await freshHighRiskTask()
  await acceptTask(task.id, { workerId })
  await submitTask(task.id, {
    workerId,
    requestCode: "EVENT-5500",
    imageDataUrl: "demo://proof",
    location: {
      latitude: 43.5534,
      longitude: 7.0174,
      accuracyMeters: 12,
    },
  })

  await assert.rejects(
    approveTask(task.id, {
      approverId: otherOwnerId,
      approvalNote: "Attempting cross-owner release",
    }),
    /only the task owner or an admin approver/i,
  )
})

test("owner verification persists in the user store after World approval", async () => {
  const ownersBefore = await listUsers("owner")
  assert.equal(ownersBefore.find((user) => user.id === ownerId)?.isHumanVerified, false)

  const updated = await markUserHumanVerified(ownerId)

  assert.equal(updated.isHumanVerified, true)

  const ownersAfter = await listUsers("owner")
  assert.equal(ownersAfter.find((user) => user.id === ownerId)?.isHumanVerified, true)
})
