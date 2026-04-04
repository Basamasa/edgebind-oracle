import "server-only"

import type {
  AgentDecision,
  PayoutRecord,
  ProofType,
  SubmissionRecord,
  TaskRecord,
  TaskView,
  UserSummary,
  ValidationRecord,
} from "@/lib/domain"
import { AppError } from "@/lib/server/errors"
import {
  acceptTaskSchema,
  approveTaskSchema,
  createTaskSchema,
  submitTaskSchema,
} from "@/lib/server/schemas"

import { getDemoStore } from "./demo-store"

const DEFAULT_APPROVAL_THRESHOLD_AMOUNT = 25

type ListTaskFilters = {
  ownerId?: string
  workerId?: string
  status?: string
}

function nowIso() {
  return new Date().toISOString()
}

function randomId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function randomRequestCode() {
  return `TASK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function findUser(userId: string) {
  const user = getDemoStore().users.find((entry) => entry.id === userId)

  if (!user) {
    throw new AppError(404, `User ${userId} was not found`)
  }

  return user
}

function findTask(taskId: string) {
  const task = getDemoStore().tasks.find((entry) => entry.id === taskId)

  if (!task) {
    throw new AppError(404, `Task ${taskId} was not found`)
  }

  return task
}

function payoutForTask(taskId: string) {
  return getDemoStore().payouts.find((entry) => entry.taskId === taskId) ?? null
}

function latestSubmissionForTask(taskId: string) {
  return getDemoStore()
    .submissions.filter((entry) => entry.taskId === taskId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
}

function validationForSubmission(submissionId: string | undefined) {
  if (!submissionId) {
    return null
  }

  return getDemoStore().validations.find((entry) => entry.submissionId === submissionId) ?? null
}

function upsertPayout(values: PayoutRecord) {
  const store = getDemoStore()
  const index = store.payouts.findIndex((entry) => entry.taskId === values.taskId)

  if (index >= 0) {
    store.payouts[index] = values
    return
  }

  store.payouts.push(values)
}

function distanceInMeters(
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
) {
  const earthRadiusMeters = 6_371_000
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180

  const deltaLat = toRadians(targetLat - originLat)
  const deltaLng = toRadians(targetLng - originLng)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(deltaLng / 2) ** 2

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function syncExpiredTasks() {
  const timestamp = nowIso()

  for (const task of getDemoStore().tasks) {
    if ((task.status === "open" || task.status === "accepted") && task.deadline < timestamp) {
      task.status = "expired"
      task.updatedAt = timestamp
    }
  }
}

function assertOwnerOrAdmin(user: UserSummary) {
  if (user.role !== "owner" && user.role !== "admin") {
    throw new AppError(403, `${user.name} cannot manage tasks`)
  }
}

function assertVerifiedWorker(user: UserSummary) {
  if (user.role !== "worker") {
    throw new AppError(400, `${user.name} is not a worker`)
  }

  if (!user.isHumanVerified) {
    throw new AppError(403, `${user.name} is not human-verified`)
  }
}

function releasePayment(task: TaskRecord, approvedBy?: string, approvalNote?: string) {
  const timestamp = nowIso()
  upsertPayout({
    id: `payout-${task.id}`,
    taskId: task.id,
    status: "released",
    amount: task.rewardAmount,
    currency: task.rewardCurrency,
    releasedAt: timestamp,
    approvedBy: approvedBy ?? null,
    approvalNote: approvalNote ?? "Auto-approved below threshold.",
    createdAt: payoutForTask(task.id)?.createdAt ?? timestamp,
    updatedAt: timestamp,
  })
}

function markPendingApproval(task: TaskRecord) {
  const timestamp = nowIso()
  upsertPayout({
    id: `payout-${task.id}`,
    taskId: task.id,
    status: "pending_approval",
    amount: task.rewardAmount,
    currency: task.rewardCurrency,
    releasedAt: null,
    approvedBy: null,
    approvalNote: "Awaiting manual approval above threshold.",
    createdAt: payoutForTask(task.id)?.createdAt ?? timestamp,
    updatedAt: timestamp,
  })
}

function cancelPayment(task: TaskRecord, note: string) {
  const timestamp = nowIso()
  upsertPayout({
    id: `payout-${task.id}`,
    taskId: task.id,
    status: "cancelled",
    amount: task.rewardAmount,
    currency: task.rewardCurrency,
    releasedAt: null,
    approvedBy: null,
    approvalNote: note,
    createdAt: payoutForTask(task.id)?.createdAt ?? timestamp,
    updatedAt: timestamp,
  })
}

function toTaskView(task: TaskRecord): TaskView {
  const owner = findUser(task.ownerId)
  const worker = task.workerId ? findUser(task.workerId) : null
  const latestSubmission = latestSubmissionForTask(task.id)
  const validation = validationForSubmission(latestSubmission?.id)
  const payout = payoutForTask(task.id)

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    rewardAmount: task.rewardAmount,
    rewardCurrency: task.rewardCurrency,
    deadline: task.deadline,
    proofType: task.proofType,
    locationRequirement: task.locationRequirement,
    status: task.status,
    owner,
    agentRef: task.agentRef,
    worker,
    requestCode: task.requestCode,
    approvalThresholdAmount: task.approvalThresholdAmount,
    acceptedAt: task.acceptedAt,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    latestSubmission: latestSubmission
      ? {
          id: latestSubmission.id,
          workerId: latestSubmission.workerId,
          submittedAt: latestSubmission.submittedAt,
          imageUrl: latestSubmission.imageUrl,
          location: latestSubmission.location,
          requestCode: latestSubmission.requestCode,
          status: latestSubmission.status,
        }
      : null,
    validation: validation
      ? {
          valid: validation.valid,
          reason: validation.reason,
          requiresApproval: validation.requiresApproval,
          agentDecision: validation.agentDecision,
          createdAt: validation.createdAt,
        }
      : null,
    payout: payout
      ? {
          status: payout.status,
          amount: payout.amount,
          currency: payout.currency,
          releasedAt: payout.releasedAt,
          approvedBy: payout.approvedBy,
          approvalNote: payout.approvalNote,
        }
      : null,
  }
}

function evaluateSubmission(
  task: TaskRecord,
  input: ReturnType<typeof submitTaskSchema.parse>,
) {
  const normalizedRequestCode = input.requestCode.trim().toUpperCase()

  if (normalizedRequestCode !== task.requestCode.trim().toUpperCase()) {
    return {
      valid: false,
      reason: "Request code mismatch.",
      requiresApproval: false,
      agentDecision: null,
    }
  }

  const submittedAt = input.submittedAt ?? nowIso()
  if (submittedAt > task.deadline) {
    return {
      valid: false,
      reason: "Submission missed the task deadline.",
      requiresApproval: false,
      agentDecision: null,
    }
  }

  if ((task.proofType === "photo" || task.proofType === "photo_location") && !input.imageDataUrl) {
    return {
      valid: false,
      reason: "Image proof is required.",
      requiresApproval: false,
      agentDecision: null,
    }
  }

  if ((task.proofType === "location" || task.proofType === "photo_location") && !input.location) {
    return {
      valid: false,
      reason: "Location proof is required.",
      requiresApproval: false,
      agentDecision: null,
    }
  }

  if (task.locationRequirement && input.location) {
    const distance = distanceInMeters(
      task.locationRequirement.latitude,
      task.locationRequirement.longitude,
      input.location.latitude,
      input.location.longitude,
    )

    if (distance > task.locationRequirement.radiusMeters) {
      return {
        valid: false,
        reason: `Worker was ${Math.round(distance)}m away from the required location.`,
        requiresApproval: false,
        agentDecision: null,
      }
    }
  }

  const agentDecision: AgentDecision =
    task.rewardAmount >= task.approvalThresholdAmount ? "requires_approval" : "auto_pay"

  return {
    valid: true,
    reason:
      agentDecision === "requires_approval"
        ? "Proof passed validation and the agent escalated payout for manual approval."
        : "Proof passed validation and the agent approved automatic payout.",
    requiresApproval: agentDecision === "requires_approval",
    agentDecision,
  }
}

export function listUsers(role?: string) {
  return role ? getDemoStore().users.filter((entry) => entry.role === role) : getDemoStore().users
}

export function listTasks(filters: ListTaskFilters = {}) {
  syncExpiredTasks()

  return getDemoStore()
    .tasks.filter((task) => {
      if (filters.ownerId && task.ownerId !== filters.ownerId) {
        return false
      }
      if (filters.workerId && task.workerId !== filters.workerId) {
        return false
      }
      if (filters.status && task.status !== filters.status) {
        return false
      }
      return true
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(toTaskView)
}

export function listOwnerTasks(ownerId: string) {
  return listTasks({ ownerId })
}

export function getTaskById(taskId: string) {
  syncExpiredTasks()
  return toTaskView(findTask(taskId))
}

export function createTask(input: unknown) {
  const data = createTaskSchema.parse(input)
  const owner = findUser(data.ownerId)
  assertOwnerOrAdmin(owner)

  const deadline = new Date(data.deadline)
  if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
    throw new AppError(400, "Deadline must be a future ISO timestamp")
  }

  const task: TaskRecord = {
    id: randomId("task"),
    title: data.title.trim(),
    description: data.description.trim(),
    rewardAmount: data.rewardAmount,
    rewardCurrency: data.rewardCurrency.trim().toUpperCase(),
    deadline: deadline.toISOString(),
    proofType: data.proofType as ProofType,
    locationRequirement: data.locationRequirement
      ? {
          label: data.locationRequirement.label ?? null,
          latitude: data.locationRequirement.latitude,
          longitude: data.locationRequirement.longitude,
          radiusMeters: data.locationRequirement.radiusMeters,
        }
      : null,
    status: "open",
    ownerId: owner.id,
    agentRef: data.agentRef?.trim() || `${owner.id}-agent`,
    workerId: null,
    requestCode: data.requestCode?.trim().toUpperCase() || randomRequestCode(),
    approvalThresholdAmount: DEFAULT_APPROVAL_THRESHOLD_AMOUNT,
    acceptedAt: null,
    completedAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  getDemoStore().tasks.push(task)
  return getTaskById(task.id)
}

export function acceptTask(taskId: string, input: unknown) {
  syncExpiredTasks()

  const data = acceptTaskSchema.parse(input)
  const task = findTask(taskId)
  const worker = findUser(data.workerId)

  if (task.status !== "open") {
    throw new AppError(409, `Task ${taskId} is not open for acceptance`)
  }

  assertVerifiedWorker(worker)

  const timestamp = nowIso()
  task.status = "accepted"
  task.workerId = worker.id
  task.acceptedAt = timestamp
  task.updatedAt = timestamp

  return getTaskById(taskId)
}

export function submitTask(taskId: string, input: unknown) {
  syncExpiredTasks()

  const data = submitTaskSchema.parse(input)
  const task = findTask(taskId)

  if (task.status !== "accepted") {
    throw new AppError(409, `Task ${taskId} is not ready for submission`)
  }

  if (!task.workerId || task.workerId !== data.workerId) {
    throw new AppError(403, "Only the assigned worker can submit proof")
  }

  const timestamp = nowIso()
  task.status = "submitted"
  task.updatedAt = timestamp

  const submission: SubmissionRecord = {
    id: randomId("submission"),
    taskId: task.id,
    workerId: data.workerId,
    submittedAt: data.submittedAt ?? timestamp,
    imageUrl: data.imageDataUrl ?? null,
    location: data.location
      ? {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          accuracyMeters: data.location.accuracyMeters ?? null,
        }
      : null,
    requestCode: data.requestCode.trim().toUpperCase(),
    status: "submitted",
    createdAt: timestamp,
  }

  getDemoStore().submissions.push(submission)

  const validationResult = evaluateSubmission(task, data)
  const validation: ValidationRecord = {
    id: randomId("validation"),
    submissionId: submission.id,
    valid: validationResult.valid,
    reason: validationResult.reason,
    requiresApproval: validationResult.requiresApproval,
    agentDecision: validationResult.agentDecision,
    createdAt: timestamp,
  }
  getDemoStore().validations.push(validation)

  if (!validation.valid) {
    submission.status = "invalid"
    task.status = "rejected"
    task.completedAt = timestamp
    task.updatedAt = timestamp
    cancelPayment(task, validation.reason)
    return getTaskById(taskId)
  }

  submission.status = validation.agentDecision === "requires_approval" ? "valid" : "approved"
  task.completedAt = timestamp
  task.updatedAt = timestamp

  if (validation.agentDecision === "requires_approval") {
    task.status = "pending_approval"
    markPendingApproval(task)
    return getTaskById(taskId)
  }

  task.status = "paid"
  releasePayment(task)
  return getTaskById(taskId)
}

export function approveTask(taskId: string, input: unknown) {
  const data = approveTaskSchema.parse(input)
  const task = findTask(taskId)
  const approver = findUser(data.approverId)
  assertOwnerOrAdmin(approver)

  if (task.status !== "pending_approval") {
    throw new AppError(409, `Task ${taskId} is not awaiting approval`)
  }

  const latestSubmission = latestSubmissionForTask(task.id)
  if (latestSubmission) {
    latestSubmission.status = "approved"
  }

  task.status = "paid"
  task.updatedAt = nowIso()
  releasePayment(
    task,
    approver.id,
    data.approvalNote?.trim() || "Approved manually in the Next.js owner console.",
  )

  return getTaskById(taskId)
}
