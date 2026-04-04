import { eq } from "drizzle-orm"

import { env } from "../config/env"
import { db } from "../db"
import { payouts } from "../db/schema/payouts"
import type { tasks } from "../db/schema/tasks"
import { nowIso } from "../utils/time"

type TaskRecord = typeof tasks.$inferSelect

class PaymentService {
  getApprovalThresholdAmount() {
    return env.APPROVAL_THRESHOLD_AMOUNT
  }

  requiresManualApproval(amount: number, thresholdAmount: number) {
    return amount >= thresholdAmount
  }

  markPendingApproval(task: TaskRecord) {
    const timestamp = nowIso()

    this.upsertPayout(task.id, {
      status: "pending_approval",
      amount: task.rewardAmount,
      currency: task.rewardCurrency,
      releasedAt: null,
      approvedBy: null,
      approvalNote: "Awaiting manual approval above threshold.",
      updatedAt: timestamp,
      createdAt: timestamp,
    })
  }

  releasePayment(task: TaskRecord, approvedBy?: string, approvalNote?: string) {
    const timestamp = nowIso()

    this.upsertPayout(task.id, {
      status: "released",
      amount: task.rewardAmount,
      currency: task.rewardCurrency,
      releasedAt: timestamp,
      approvedBy: approvedBy ?? null,
      approvalNote: approvalNote ?? "Auto-approved below threshold.",
      updatedAt: timestamp,
      createdAt: timestamp,
    })
  }

  cancelPayment(task: TaskRecord, approvalNote: string) {
    const timestamp = nowIso()

    this.upsertPayout(task.id, {
      status: "cancelled",
      amount: task.rewardAmount,
      currency: task.rewardCurrency,
      releasedAt: null,
      approvedBy: null,
      approvalNote,
      updatedAt: timestamp,
      createdAt: timestamp,
    })
  }

  private upsertPayout(
    taskId: string,
    values: Omit<typeof payouts.$inferInsert, "id" | "taskId">,
  ) {
    const existing = db.select().from(payouts).where(eq(payouts.taskId, taskId)).get()

    if (existing) {
      db.update(payouts)
        .set({
          status: values.status,
          amount: values.amount,
          currency: values.currency,
          releasedAt: values.releasedAt,
          approvedBy: values.approvedBy,
          approvalNote: values.approvalNote,
          updatedAt: values.updatedAt,
        })
        .where(eq(payouts.taskId, taskId))
        .run()
      return
    }

    db.insert(payouts)
      .values({
        id: `payout-${taskId}`,
        taskId,
        ...values,
      })
      .run()
  }
}

export const paymentService = new PaymentService()
