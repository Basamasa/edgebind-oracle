"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { toQueryString } from "@/lib/format"
import { approveTask, createTask } from "@/lib/server/task-service"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error."
}

export async function createTaskAction(formData: FormData) {
  const ownerId = String(formData.get("ownerId") ?? "")

  try {
    const rawDeadline = String(formData.get("deadline") ?? "")

    const task = createTask({
      ownerId,
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
        owner: ownerId,
        task: task.id,
        notice: "Task created successfully.",
      })}`,
    )
  } catch (error) {
    redirect(
      `/app${toQueryString({
        owner: ownerId,
        error: errorMessage(error),
      })}`,
    )
  }
}

export async function approveTaskAction(formData: FormData) {
  const ownerId = String(formData.get("ownerId") ?? "")
  const taskId = String(formData.get("taskId") ?? "")

  try {
    approveTask(taskId, {
      approverId: ownerId,
      approvalNote: "Approved from the pure Next.js owner console.",
    })

    revalidatePath("/app")
    redirect(
      `/app${toQueryString({
        owner: ownerId,
        task: taskId,
        notice: "Payout approved.",
      })}`,
    )
  } catch (error) {
    redirect(
      `/app${toQueryString({
        owner: ownerId,
        task: taskId,
        error: errorMessage(error),
      })}`,
    )
  }
}
