import { and, desc, eq, inArray, lt } from "drizzle-orm"

import { db } from "../db"
import { payouts } from "../db/schema/payouts"
import { taskSubmissions } from "../db/schema/task-submissions"
import { tasks, type ProofType, type TaskStatus } from "../db/schema/tasks"
import { users, type UserRole } from "../db/schema/users"
import { validationResults } from "../db/schema/validation-results"
import { AppError } from "../middleware/error.middleware"
import { humanVerificationService } from "./human-verification.service"
import { paymentService } from "./payment.service"
import { verificationService } from "./verification.service"

type TaskRecord = typeof tasks.$inferSelect
type UserRecord = typeof users.$inferSelect

type ListTaskFilters = {
  ownerId?: string
  workerId?: string
  status?: string
}

type LocationRequirement = {
  label?: string
  latitude: number
  longitude: number
  radiusMeters: number
}

type CreateTaskInput = {
  ownerId: string
  agentRef?: string
  title: string
  description: string
  rewardAmount: number
  rewardCurrency: string
  deadline: string
  proofType: ProofType
  requestCode?: string
  locationRequirement?: LocationRequirement
}

type AcceptTaskInput = {
  workerId: string
}

type SubmitTaskInput = {
  workerId: string
  submittedAt?: string
  requestCode: string
  imageDataUrl?: string
  location?: {
    latitude: number
    longitude: number
    accuracyMeters?: number
  }
}

type ApproveTaskInput = {
  approverId: string
  approvalNote?: string
}

class TaskService {
  listTasks(filters: ListTaskFilters = {}) {
    this.refreshExpiredTasks()

    const conditions = []

    if (filters.ownerId) {
      conditions.push(eq(tasks.ownerId, filters.ownerId))
    }

    if (filters.workerId) {
      conditions.push(eq(tasks.workerId, filters.workerId))
    }

    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status as TaskStatus))
    }

    const query = db.select().from(tasks)

    const rows =
      conditions.length > 0
        ? query.where(and(...conditions)).orderBy(desc(tasks.createdAt)).all()
        : query.orderBy(desc(tasks.createdAt)).all()

    return rows.map((task) => this.toTaskView(task))
  }

  getTaskById(taskId: string) {
    this.refreshExpiredTasks()

    const task = this.getTaskRecord(taskId)
    return this.toTaskView(task)
  }

  createTask(input: CreateTaskInput) {
    const owner = this.getUserById(input.ownerId)

    if (owner.role !== "owner" && owner.role !== "admin") {
      throw new AppError(400, `${owner.name} cannot create tasks`)
    }

    const deadline = new Date(input.deadline)
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      throw new AppError(400, "Deadline must be a future ISO timestamp")
    }

    const timestamp = new Date().toISOString()
    const taskId = `task-${crypto.randomUUID()}`
    const requestCode =
      input.requestCode?.trim().toUpperCase() ?? this.generateRequestCode()
    const thresholdAmount = paymentService.getApprovalThresholdAmount()

    db.insert(tasks)
      .values({
        id: taskId,
        title: input.title.trim(),
        description: input.description.trim(),
        rewardAmount: input.rewardAmount,
        rewardCurrency: input.rewardCurrency.trim().toUpperCase(),
        deadline: deadline.toISOString(),
        proofType: input.proofType,
        locationLabel: input.locationRequirement?.label?.trim() ?? null,
        locationLat: input.locationRequirement?.latitude ?? null,
        locationLng: input.locationRequirement?.longitude ?? null,
        locationRadiusMeters: input.locationRequirement?.radiusMeters ?? null,
        status: "open",
        ownerId: owner.id,
        agentRef: input.agentRef?.trim() || `${owner.id}-agent`,
        workerId: null,
        requestCode,
        approvalThresholdAmount: thresholdAmount,
        acceptedAt: null,
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run()

    return this.getTaskById(taskId)
  }

  acceptTask(taskId: string, input: AcceptTaskInput) {
    this.refreshExpiredTasks()

    const task = this.getTaskRecord(taskId)

    if (task.status !== "open") {
      throw new AppError(409, `Task ${taskId} is not open for acceptance`)
    }

    humanVerificationService.assertVerifiedWorker(input.workerId)

    const timestamp = new Date().toISOString()

    db.update(tasks)
      .set({
        status: "accepted",
        workerId: input.workerId,
        acceptedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(tasks.id, taskId))
      .run()

    return this.getTaskById(taskId)
  }

  submitTask(taskId: string, input: SubmitTaskInput) {
    this.refreshExpiredTasks()

    const task = this.getTaskRecord(taskId)

    if (task.status !== "accepted") {
      throw new AppError(409, `Task ${taskId} is not ready for submission`)
    }

    if (!task.workerId || task.workerId !== input.workerId) {
      throw new AppError(403, "Only the assigned worker can submit proof")
    }

    const timestamp = new Date().toISOString()

    db.update(tasks)
      .set({
        status: "submitted",
        updatedAt: timestamp,
      })
      .where(eq(tasks.id, taskId))
      .run()

    verificationService.processSubmission(task, input)

    return this.getTaskById(taskId)
  }

  approveTask(taskId: string, input: ApproveTaskInput) {
    const task = this.getTaskRecord(taskId)

    if (task.status !== "pending_approval") {
      throw new AppError(409, `Task ${taskId} is not awaiting approval`)
    }

    const approver = this.getUserById(input.approverId)
    if (approver.role !== "owner" && approver.role !== "admin") {
      throw new AppError(403, `${approver.name} cannot approve payouts`)
    }

    paymentService.releasePayment(
      task,
      approver.id,
      input.approvalNote?.trim() || "Approved manually in owner dashboard.",
    )

    db.update(taskSubmissions)
      .set({
        status: "approved",
      })
      .where(eq(taskSubmissions.taskId, taskId))
      .run()

    db.update(tasks)
      .set({
        status: "paid",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, taskId))
      .run()

    return this.getTaskById(taskId)
  }

  private refreshExpiredTasks() {
    db.update(tasks)
      .set({
        status: "expired",
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          inArray(tasks.status, ["open", "accepted"]),
          lt(tasks.deadline, new Date().toISOString()),
        ),
      )
      .run()
  }

  private getTaskRecord(taskId: string) {
    const task = db.select().from(tasks).where(eq(tasks.id, taskId)).get()

    if (!task) {
      throw new AppError(404, `Task ${taskId} was not found`)
    }

    return task
  }

  private getUserById(userId: string) {
    const user = db.select().from(users).where(eq(users.id, userId)).get()

    if (!user) {
      throw new AppError(404, `User ${userId} was not found`)
    }

    return user
  }

  private toTaskView(task: TaskRecord) {
    const owner = this.getUserById(task.ownerId)
    const worker = task.workerId ? this.getUserById(task.workerId) : null
    const latestSubmission = db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, task.id))
      .orderBy(desc(taskSubmissions.createdAt))
      .get()
    const validation = latestSubmission
      ? db
          .select()
          .from(validationResults)
          .where(eq(validationResults.submissionId, latestSubmission.id))
          .get()
      : null
    const payout = db.select().from(payouts).where(eq(payouts.taskId, task.id)).get()

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      rewardAmount: task.rewardAmount,
      rewardCurrency: task.rewardCurrency,
      deadline: task.deadline,
      proofType: task.proofType,
      locationRequirement:
        task.locationLat !== null &&
        task.locationLng !== null &&
        task.locationRadiusMeters !== null
          ? {
              label: task.locationLabel,
              latitude: task.locationLat,
              longitude: task.locationLng,
              radiusMeters: task.locationRadiusMeters,
            }
          : null,
      status: task.status,
      owner: this.toUserSummary(owner),
      agentRef: task.agentRef,
      worker: worker ? this.toUserSummary(worker) : null,
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
            location:
              latestSubmission.locationLat !== null &&
              latestSubmission.locationLng !== null
                ? {
                    latitude: latestSubmission.locationLat,
                    longitude: latestSubmission.locationLng,
                    accuracyMeters: latestSubmission.locationAccuracyMeters,
                  }
                : null,
            requestCode: latestSubmission.requestCode,
            status: latestSubmission.status,
          }
        : null,
      validation: validation
        ? {
            valid: validation.valid,
            reason: validation.reason,
            requiresApproval: validation.requiresApproval,
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

  private toUserSummary(user: UserRecord) {
    return {
      id: user.id,
      name: user.name,
      role: user.role as UserRole,
      isHumanVerified: user.isHumanVerified,
    }
  }

  private generateRequestCode() {
    return `TASK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }
}

export const taskService = new TaskService()
