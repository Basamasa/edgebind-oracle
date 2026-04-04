import { eq } from "drizzle-orm"

import { db } from "../db"
import { taskSubmissions } from "../db/schema/task-submissions"
import { tasks } from "../db/schema/tasks"
import { validationResults } from "../db/schema/validation-results"
import { distanceInMeters } from "../utils/geo"
import { nowIso } from "../utils/time"
import { paymentService } from "./payment.service"
import { storageService } from "./storage.service"

type TaskRecord = typeof tasks.$inferSelect
type SubmissionInput = {
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

class VerificationService {
  processSubmission(task: TaskRecord, input: SubmissionInput) {
    const submittedAt = input.submittedAt ? new Date(input.submittedAt) : new Date()
    const submissionId = `submission-${crypto.randomUUID()}`
    const imageUrl = storageService.persistProofImage(input.imageDataUrl)
    const timestamp = nowIso()

    db.insert(taskSubmissions)
      .values({
        id: submissionId,
        taskId: task.id,
        workerId: input.workerId,
        submittedAt: submittedAt.toISOString(),
        imageUrl,
        locationLat: input.location?.latitude ?? null,
        locationLng: input.location?.longitude ?? null,
        locationAccuracyMeters: input.location?.accuracyMeters ?? null,
        requestCode: input.requestCode.trim().toUpperCase(),
        status: "submitted",
        createdAt: timestamp,
      })
      .run()

    const validation = this.validate(task, input, imageUrl, submittedAt)

    db.insert(validationResults)
      .values({
        id: `validation-${submissionId}`,
        submissionId,
        valid: validation.valid,
        reason: validation.reason,
        requiresApproval: validation.requiresApproval,
        createdAt: timestamp,
      })
      .run()

    db.update(taskSubmissions)
      .set({
        status: validation.valid ? "valid" : "invalid",
      })
      .where(eq(taskSubmissions.id, submissionId))
      .run()

    if (!validation.valid) {
      db.update(tasks)
        .set({
          status: "rejected",
          completedAt: timestamp,
          updatedAt: timestamp,
        })
        .where(eq(tasks.id, task.id))
        .run()

      paymentService.cancelPayment(task, validation.reason)
      return
    }

    if (validation.requiresApproval) {
      db.update(tasks)
        .set({
          status: "pending_approval",
          completedAt: timestamp,
          updatedAt: timestamp,
        })
        .where(eq(tasks.id, task.id))
        .run()

      paymentService.markPendingApproval(task)
      return
    }

    db.update(tasks)
      .set({
        status: "paid",
        completedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(tasks.id, task.id))
      .run()

    db.update(taskSubmissions)
      .set({
        status: "approved",
      })
      .where(eq(taskSubmissions.id, submissionId))
      .run()

    paymentService.releasePayment(task)
  }

  private validate(
    task: TaskRecord,
    input: SubmissionInput,
    imageUrl: string | null,
    submittedAt: Date,
  ) {
    if (input.requestCode.trim().toUpperCase() !== task.requestCode.trim().toUpperCase()) {
      return {
        valid: false,
        reason: "Request code mismatch.",
        requiresApproval: false,
      }
    }

    if (submittedAt.toISOString() > task.deadline) {
      return {
        valid: false,
        reason: "Submission missed the task deadline.",
        requiresApproval: false,
      }
    }

    if ((task.proofType === "photo" || task.proofType === "photo_location") && !imageUrl) {
      return {
        valid: false,
        reason: "Image proof is required.",
        requiresApproval: false,
      }
    }

    if (task.proofType === "location" || task.proofType === "photo_location") {
      if (!input.location) {
        return {
          valid: false,
          reason: "Location proof is required.",
          requiresApproval: false,
        }
      }
    }

    if (
      task.locationLat !== null &&
      task.locationLng !== null &&
      task.locationRadiusMeters !== null &&
      input.location
    ) {
      const distance = distanceInMeters(
        task.locationLat,
        task.locationLng,
        input.location.latitude,
        input.location.longitude,
      )

      if (distance > task.locationRadiusMeters) {
        return {
          valid: false,
          reason: `Worker was ${Math.round(distance)}m away from the required location.`,
          requiresApproval: false,
        }
      }
    }

    return {
      valid: true,
      reason: "Proof passed automated validation.",
      requiresApproval: paymentService.requiresManualApproval(
        task.rewardAmount,
        task.approvalThresholdAmount,
      ),
    }
  }
}

export const verificationService = new VerificationService()
