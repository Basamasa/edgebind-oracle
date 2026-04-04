"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { toQueryString } from "@/lib/format"
import { requireSessionRole } from "@/lib/server/session"
import { approveTask, createTask } from "@/lib/server/task-service"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error."
}

export async function createTaskAction(formData: FormData) {
  try {
    const owner = await requireSessionRole(["owner", "admin"])
    const rawDeadline = String(formData.get("deadline") ?? "")

    const task = await createTask({
      ownerId: owner.id,
      agentRef: String(formData.get("agentRef") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      rewardAmount: Number(formData.get("rewardAmount") ?? 0),
      rewardCurrency: String(formData.get("rewardCurrency") ?? "USD"),
      deadline: new Date(rawDeadline).toISOString(),
      proofType: String(formData.get("proofType") ?? "photo_location"),
      requestCode: String(formData.get("requestCode") ?? "") || undefined,
      locationRequirement:
        formData.get("useLocationRequirement") === "on"
          ? {
              label: String(formData.get("locationLabel") ?? "") || undefined,
              latitude: Number(formData.get("latitude") ?? 0),
              longitude: Number(formData.get("longitude") ?? 0),
              radiusMeters: Number(formData.get("radiusMeters") ?? 0),
            }
          : undefined,
    })

    revalidatePath("/app")
    redirect(
      `/app${toQueryString({
        task: task.id,
        notice: "Task created successfully.",
      })}`,
    )
  } catch (error) {
    redirect(
      `/app${toQueryString({
        error: errorMessage(error),
      })}`,
    )
  }
}

export async function approveTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "")

  try {
    const approver = await requireSessionRole(["owner", "admin"])

    await approveTask(taskId, {
      approverId: approver.id,
      approvalNote: "Approved from the owner dashboard after the agent escalated payout.",
    })

    revalidatePath("/app")
    redirect(
      `/app${toQueryString({
        task: taskId,
        notice: "Payout approved.",
      })}`,
    )
  } catch (error) {
    redirect(
      `/app${toQueryString({
        task: taskId,
        error: errorMessage(error),
      })}`,
    )
  }
}
