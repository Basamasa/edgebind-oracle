import { createHash } from "node:crypto"
import type { PoolClient } from "pg"

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
import { dbQuery, withTransaction } from "@/lib/server/db"
import { AppError } from "@/lib/server/errors"
import {
  getHederaConfig,
  isHederaPayoutCurrency,
  transferHbarPayout,
  validateHederaAccountId,
} from "@/lib/server/hedera"
import {
  acceptTaskSchema,
  approveTaskSchema,
  createTaskSchema,
  submitTaskSchema,
} from "@/lib/server/schemas"

const DEFAULT_APPROVAL_THRESHOLD_AMOUNT = 25

type ListTaskFilters = {
  ownerId?: string
  workerId?: string
  status?: string
}

type UserRow = {
  id: string
  name: string
  role: UserSummary["role"]
  is_human_verified: boolean
  world_nullifier: string | null
  payout_account_id: string | null
}

type TaskRow = {
  id: string
  title: string
  description: string
  reward_amount: number
  reward_currency: string
  deadline: string | Date
  proof_type: ProofType
  location_label: string | null
  location_lat: number | null
  location_lng: number | null
  location_radius_meters: number | null
  status: TaskRecord["status"]
  owner_id: string
  agent_ref: string
  worker_id: string | null
  request_code: string
  approval_threshold_amount: number
  accepted_at: string | Date | null
  completed_at: string | Date | null
  created_at: string | Date
  updated_at: string | Date
}

type SubmissionRow = {
  id: string
  task_id: string
  worker_id: string
  submitted_at: string | Date
  image_url: string | null
  location_lat: number | null
  location_lng: number | null
  location_accuracy_meters: number | null
  request_code: string
  status: SubmissionRecord["status"]
  created_at: string | Date
}

type ValidationRow = {
  id: string
  submission_id: string
  valid: boolean
  reason: string
  requires_approval: boolean
  agent_decision: AgentDecision | null
  created_at: string | Date
}

type PayoutRow = {
  id: string
  task_id: string
  status: PayoutRecord["status"]
  amount: number
  currency: string
  rail: PayoutRecord["rail"]
  reference: string | null
  released_at: string | Date | null
  approved_by: string | null
  approval_note: string | null
  created_at: string | Date
  updated_at: string | Date
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

function toIso(value: string | Date | null | undefined) {
  if (!value) {
    return null
  }

  return new Date(value).toISOString()
}

function mapUser(row: UserRow): UserSummary {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    isHumanVerified: row.is_human_verified,
    payoutAccountId: row.payout_account_id,
  }
}

function mapTask(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    rewardAmount: row.reward_amount,
    rewardCurrency: row.reward_currency,
    deadline: toIso(row.deadline) ?? nowIso(),
    proofType: row.proof_type,
    locationRequirement:
      row.location_lat !== null &&
      row.location_lng !== null &&
      row.location_radius_meters !== null
        ? {
            label: row.location_label,
            latitude: row.location_lat,
            longitude: row.location_lng,
            radiusMeters: row.location_radius_meters,
          }
        : null,
    status: row.status,
    ownerId: row.owner_id,
    agentRef: row.agent_ref,
    workerId: row.worker_id,
    requestCode: row.request_code,
    approvalThresholdAmount: row.approval_threshold_amount,
    acceptedAt: toIso(row.accepted_at),
    completedAt: toIso(row.completed_at),
    createdAt: toIso(row.created_at) ?? nowIso(),
    updatedAt: toIso(row.updated_at) ?? nowIso(),
  }
}

function mapSubmission(row: SubmissionRow): SubmissionRecord {
  return {
    id: row.id,
    taskId: row.task_id,
    workerId: row.worker_id,
    submittedAt: toIso(row.submitted_at) ?? nowIso(),
    imageUrl: row.image_url,
    location:
      row.location_lat !== null && row.location_lng !== null
        ? {
            latitude: row.location_lat,
            longitude: row.location_lng,
            accuracyMeters: row.location_accuracy_meters,
          }
        : null,
    requestCode: row.request_code,
    status: row.status,
    createdAt: toIso(row.created_at) ?? nowIso(),
  }
}

function mapValidation(row: ValidationRow): ValidationRecord {
  return {
    id: row.id,
    submissionId: row.submission_id,
    valid: row.valid,
    reason: row.reason,
    requiresApproval: row.requires_approval,
    agentDecision: row.agent_decision,
    createdAt: toIso(row.created_at) ?? nowIso(),
  }
}

function mapPayout(row: PayoutRow): PayoutRecord {
  return {
    id: row.id,
    taskId: row.task_id,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    rail: row.rail,
    reference: row.reference,
    releasedAt: toIso(row.released_at),
    approvedBy: row.approved_by,
    approvalNote: row.approval_note,
    createdAt: toIso(row.created_at) ?? nowIso(),
    updatedAt: toIso(row.updated_at) ?? nowIso(),
  }
}

async function findUser(userId: string, executor?: PoolClient) {
  const result = await dbQuery<UserRow>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [userId], executor)
  const row = result.rows[0]

  if (!row) {
    throw new AppError(404, `User ${userId} was not found`)
  }

  return mapUser(row)
}

async function findTaskRow(taskId: string, executor?: PoolClient, forUpdate = false) {
  const result = await dbQuery<TaskRow>(
    `SELECT * FROM tasks WHERE id = $1 LIMIT 1${forUpdate ? " FOR UPDATE" : ""}`,
    [taskId],
    executor,
  )

  const row = result.rows[0]
  if (!row) {
    throw new AppError(404, `Task ${taskId} was not found`)
  }

  return row
}

async function payoutForTask(taskId: string, executor?: PoolClient) {
  const result = await dbQuery<PayoutRow>(
    `SELECT * FROM payouts WHERE task_id = $1 LIMIT 1`,
    [taskId],
    executor,
  )

  return result.rows[0] ? mapPayout(result.rows[0]) : null
}

async function latestSubmissionForTask(taskId: string, executor?: PoolClient, forUpdate = false) {
  const result = await dbQuery<SubmissionRow>(
    `
      SELECT * FROM submissions
      WHERE task_id = $1
      ORDER BY created_at DESC
      LIMIT 1${forUpdate ? " FOR UPDATE" : ""}
    `,
    [taskId],
    executor,
  )

  return result.rows[0] ? mapSubmission(result.rows[0]) : null
}

async function validationForSubmission(submissionId: string | undefined, executor?: PoolClient) {
  if (!submissionId) {
    return null
  }

  const result = await dbQuery<ValidationRow>(
    `SELECT * FROM validations WHERE submission_id = $1 LIMIT 1`,
    [submissionId],
    executor,
  )

  return result.rows[0] ? mapValidation(result.rows[0]) : null
}

async function upsertPayout(values: PayoutRecord, executor: PoolClient) {
  await dbQuery(
    `
      INSERT INTO payouts (
        id,
        task_id,
        status,
        amount,
        currency,
        rail,
        reference,
        released_at,
        approved_by,
        approval_note,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (task_id) DO UPDATE
      SET status = EXCLUDED.status,
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          rail = EXCLUDED.rail,
          reference = EXCLUDED.reference,
          released_at = EXCLUDED.released_at,
          approved_by = EXCLUDED.approved_by,
          approval_note = EXCLUDED.approval_note,
          updated_at = EXCLUDED.updated_at
    `,
    [
      values.id,
      values.taskId,
      values.status,
      values.amount,
      values.currency,
      values.rail,
      values.reference,
      values.releasedAt,
      values.approvedBy,
      values.approvalNote,
      values.createdAt,
      values.updatedAt,
    ],
    executor,
  )
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

async function syncExpiredTasks(executor?: PoolClient) {
  const timestamp = nowIso()
  await dbQuery(
    `
      UPDATE tasks
      SET status = 'expired', updated_at = $1
      WHERE status IN ('open', 'accepted') AND deadline < $1
    `,
    [timestamp],
    executor,
  )
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

async function releasePayment(
  task: TaskRecord,
  executor: PoolClient,
  approvedBy?: string,
  approvalNote?: string,
) {
  const timestamp = nowIso()
  const existing = await payoutForTask(task.id, executor)
  let rail: PayoutRecord["rail"] = "internal"
  let reference: string | null = null
  let resolvedApprovalNote = approvalNote ?? "Auto-approved below threshold."

  if (isHederaPayoutCurrency(task.rewardCurrency)) {
    const hedera = getHederaConfig()
    const worker = task.workerId ? await findUser(task.workerId, executor) : null
    const payoutAccountId = worker?.payoutAccountId?.trim()

    if (hedera.configured && payoutAccountId) {
      const transfer = await transferHbarPayout({
        taskId: task.id,
        amount: task.rewardAmount,
        toAccountId: payoutAccountId,
        network: hedera.network,
      })

      rail = "hedera"
      reference = transfer.transactionId
      resolvedApprovalNote =
        approvalNote ??
        `Released on Hedera ${hedera.network} to ${payoutAccountId}.`
    } else {
      resolvedApprovalNote =
        approvalNote ??
        `HBAR payout recorded without live Hedera transfer${
          !hedera.configured ? " because the rail is not configured" : " because the worker has no payout account"
        }.`
    }
  }

  await upsertPayout(
    {
      id: existing?.id ?? `payout-${task.id}`,
      taskId: task.id,
      status: "released",
      amount: task.rewardAmount,
      currency: task.rewardCurrency,
      rail,
      reference,
      releasedAt: timestamp,
      approvedBy: approvedBy ?? null,
      approvalNote: resolvedApprovalNote,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    },
    executor,
  )
}

async function markPendingApproval(task: TaskRecord, executor: PoolClient) {
  const timestamp = nowIso()
  const existing = await payoutForTask(task.id, executor)

  await upsertPayout(
    {
      id: existing?.id ?? `payout-${task.id}`,
      taskId: task.id,
      status: "pending_approval",
      amount: task.rewardAmount,
      currency: task.rewardCurrency,
      rail: existing?.rail ?? "internal",
      reference: existing?.reference ?? null,
      releasedAt: null,
      approvedBy: null,
      approvalNote: "Awaiting manual approval above threshold.",
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    },
    executor,
  )
}

async function cancelPayment(task: TaskRecord, note: string, executor: PoolClient) {
  const timestamp = nowIso()
  const existing = await payoutForTask(task.id, executor)

  await upsertPayout(
    {
      id: existing?.id ?? `payout-${task.id}`,
      taskId: task.id,
      status: "cancelled",
      amount: task.rewardAmount,
      currency: task.rewardCurrency,
      rail: existing?.rail ?? "internal",
      reference: existing?.reference ?? null,
      releasedAt: null,
      approvedBy: null,
      approvalNote: note,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    },
    executor,
  )
}

async function toTaskView(task: TaskRecord): Promise<TaskView> {
  const owner = await findUser(task.ownerId)
  const worker = task.workerId ? await findUser(task.workerId) : null
  const latestSubmission = await latestSubmissionForTask(task.id)
  const validation = await validationForSubmission(latestSubmission?.id)
  const payout = await payoutForTask(task.id)

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
          rail: payout.rail,
          reference: payout.reference,
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

export async function listUsers(role?: string) {
  const result = role
    ? await dbQuery<UserRow>(`SELECT * FROM users WHERE role = $1 ORDER BY name ASC`, [role])
    : await dbQuery<UserRow>(`SELECT * FROM users ORDER BY name ASC`)

  return result.rows.map(mapUser)
}

export async function markUserHumanVerified(userId: string) {
  return withTransaction(async (client) => {
    const user = await findUser(userId, client)
    const verified = user.isHumanVerified ? user : { ...user, isHumanVerified: true }

    await dbQuery(
      `
        UPDATE users
        SET is_human_verified = TRUE
        WHERE id = $1
      `,
      [userId],
      client,
    )

    return verified
  })
}

export async function getUserProfile(userId: string) {
  return findUser(userId)
}

export async function updateWorkerPayoutAccount(userId: string, payoutAccountId: string) {
  const normalizedAccountId = validateHederaAccountId(payoutAccountId)

  return withTransaction(async (client) => {
    const user = await findUser(userId, client)

    if (user.role !== "worker") {
      throw new AppError(400, "Only workers can set a payout account")
    }

    await dbQuery(
      `
        UPDATE users
        SET payout_account_id = $2
        WHERE id = $1
      `,
      [userId, normalizedAccountId],
      client,
    )

    return {
      ...user,
      payoutAccountId: normalizedAccountId,
    }
  })
}

export async function findOrCreateWorldWorker(worldNullifier: string) {
  const normalizedNullifier = worldNullifier.trim().toLowerCase()

  if (!normalizedNullifier) {
    throw new AppError(400, "World nullifier is required")
  }

  return withTransaction(async (client) => {
    const existing = await dbQuery<UserRow>(
      `SELECT * FROM users WHERE world_nullifier = $1 LIMIT 1`,
      [normalizedNullifier],
      client,
    )

    if (existing.rows[0]) {
      const row = existing.rows[0]

      if (!row.is_human_verified) {
        await dbQuery(
          `
            UPDATE users
            SET is_human_verified = TRUE
            WHERE id = $1
          `,
          [row.id],
          client,
        )
      }

      return {
        ...mapUser(row),
        isHumanVerified: true,
      }
    }

    const suffix = createHash("sha256").update(normalizedNullifier).digest("hex").slice(0, 12)
    const user = {
      id: `worker-${suffix}`,
      name: "Verified Worker",
      role: "worker" as const,
      isHumanVerified: true,
    }

    await dbQuery(
      `
        INSERT INTO users (id, name, role, is_human_verified, world_nullifier)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [user.id, user.name, user.role, true, normalizedNullifier],
      client,
    )

    return user
  })
}

export async function listTasks(filters: ListTaskFilters = {}) {
  await syncExpiredTasks()

  const clauses: string[] = []
  const params: unknown[] = []

  if (filters.ownerId) {
    params.push(filters.ownerId)
    clauses.push(`owner_id = $${params.length}`)
  }
  if (filters.workerId) {
    params.push(filters.workerId)
    clauses.push(`worker_id = $${params.length}`)
  }
  if (filters.status) {
    params.push(filters.status)
    clauses.push(`status = $${params.length}`)
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""
  const result = await dbQuery<TaskRow>(
    `SELECT * FROM tasks ${whereClause} ORDER BY created_at DESC`,
    params,
  )

  return Promise.all(result.rows.map((row) => toTaskView(mapTask(row))))
}

export async function listOwnerTasks(ownerId: string) {
  return listTasks({ ownerId })
}

export async function getTaskById(taskId: string) {
  await syncExpiredTasks()
  return toTaskView(mapTask(await findTaskRow(taskId)))
}

export async function createTask(input: unknown) {
  const data = createTaskSchema.parse(input)
  const owner = await findUser(data.ownerId)
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

  await dbQuery(
    `
      INSERT INTO tasks (
        id,
        title,
        description,
        reward_amount,
        reward_currency,
        deadline,
        proof_type,
        location_label,
        location_lat,
        location_lng,
        location_radius_meters,
        status,
        owner_id,
        agent_ref,
        worker_id,
        request_code,
        approval_threshold_amount,
        accepted_at,
        completed_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `,
    [
      task.id,
      task.title,
      task.description,
      task.rewardAmount,
      task.rewardCurrency,
      task.deadline,
      task.proofType,
      task.locationRequirement?.label ?? null,
      task.locationRequirement?.latitude ?? null,
      task.locationRequirement?.longitude ?? null,
      task.locationRequirement?.radiusMeters ?? null,
      task.status,
      task.ownerId,
      task.agentRef,
      task.workerId,
      task.requestCode,
      task.approvalThresholdAmount,
      task.acceptedAt,
      task.completedAt,
      task.createdAt,
      task.updatedAt,
    ],
  )

  return getTaskById(task.id)
}

export async function acceptTask(taskId: string, input: unknown) {
  await syncExpiredTasks()

  const data = acceptTaskSchema.parse(input)

  return withTransaction(async (client) => {
    const taskRow = await findTaskRow(taskId, client, true)
    const task = mapTask(taskRow)
    const worker = await findUser(data.workerId, client)

    if (task.status !== "open") {
      throw new AppError(409, `Task ${taskId} is not open for acceptance`)
    }

    assertVerifiedWorker(worker)

    const timestamp = nowIso()
    await dbQuery(
      `
        UPDATE tasks
        SET status = 'accepted',
            worker_id = $2,
            accepted_at = $3,
            updated_at = $3
        WHERE id = $1
      `,
      [taskId, worker.id, timestamp],
      client,
    )
  }).then(() => getTaskById(taskId))
}

export async function submitTask(taskId: string, input: unknown) {
  await syncExpiredTasks()

  const data = submitTaskSchema.parse(input)

  return withTransaction(async (client) => {
    const taskRow = await findTaskRow(taskId, client, true)
    const task = mapTask(taskRow)

    if (task.status !== "accepted") {
      throw new AppError(409, `Task ${taskId} is not ready for submission`)
    }

    if (!task.workerId || task.workerId !== data.workerId) {
      throw new AppError(403, "Only the assigned worker can submit proof")
    }

    const timestamp = nowIso()
    await dbQuery(
      `UPDATE tasks SET status = 'submitted', updated_at = $2 WHERE id = $1`,
      [taskId, timestamp],
      client,
    )

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

    await dbQuery(
      `
        INSERT INTO submissions (
          id,
          task_id,
          worker_id,
          submitted_at,
          image_url,
          location_lat,
          location_lng,
          location_accuracy_meters,
          request_code,
          status,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        submission.id,
        submission.taskId,
        submission.workerId,
        submission.submittedAt,
        submission.imageUrl,
        submission.location?.latitude ?? null,
        submission.location?.longitude ?? null,
        submission.location?.accuracyMeters ?? null,
        submission.requestCode,
        submission.status,
        submission.createdAt,
      ],
      client,
    )

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

    await dbQuery(
      `
        INSERT INTO validations (
          id,
          submission_id,
          valid,
          reason,
          requires_approval,
          agent_decision,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        validation.id,
        validation.submissionId,
        validation.valid,
        validation.reason,
        validation.requiresApproval,
        validation.agentDecision,
        validation.createdAt,
      ],
      client,
    )

    if (!validation.valid) {
      await dbQuery(`UPDATE submissions SET status = 'invalid' WHERE id = $1`, [submission.id], client)
      await dbQuery(
        `
          UPDATE tasks
          SET status = 'rejected',
              completed_at = $2,
              updated_at = $2
          WHERE id = $1
        `,
        [taskId, timestamp],
        client,
      )
      await cancelPayment(task, validation.reason, client)
      return
    }

    const submissionStatus =
      validation.agentDecision === "requires_approval" ? "valid" : "approved"
    await dbQuery(
      `UPDATE submissions SET status = $2 WHERE id = $1`,
      [submission.id, submissionStatus],
      client,
    )

    if (validation.agentDecision === "requires_approval") {
      await dbQuery(
        `
          UPDATE tasks
          SET status = 'pending_approval',
              completed_at = $2,
              updated_at = $2
          WHERE id = $1
        `,
        [taskId, timestamp],
        client,
      )
      await markPendingApproval(task, client)
      return
    }

    await dbQuery(
      `
        UPDATE tasks
        SET status = 'paid',
            completed_at = $2,
            updated_at = $2
        WHERE id = $1
      `,
      [taskId, timestamp],
      client,
    )
    await releasePayment(task, client)
  }).then(() => getTaskById(taskId))
}

export async function approveTask(taskId: string, input: unknown) {
  const data = approveTaskSchema.parse(input)

  return withTransaction(async (client) => {
    const taskRow = await findTaskRow(taskId, client, true)
    const task = mapTask(taskRow)
    const approver = await findUser(data.approverId, client)
    assertOwnerOrAdmin(approver)

    if (approver.role !== "admin" && approver.id !== task.ownerId) {
      throw new AppError(403, "Only the task owner or an admin approver can release this payout")
    }

    if (task.status !== "pending_approval") {
      throw new AppError(409, `Task ${taskId} is not awaiting approval`)
    }

    const latestSubmission = await latestSubmissionForTask(task.id, client, true)
    if (latestSubmission) {
      await dbQuery(
        `UPDATE submissions SET status = 'approved' WHERE id = $1`,
        [latestSubmission.id],
        client,
      )
    }

    const timestamp = nowIso()
    await dbQuery(
      `UPDATE tasks SET status = 'paid', updated_at = $2 WHERE id = $1`,
      [taskId, timestamp],
      client,
    )
    await releasePayment(
      task,
      client,
      approver.id,
      data.approvalNote?.trim() || "Approved manually in the owner approval flow.",
    )
  }).then(() => getTaskById(taskId))
}
