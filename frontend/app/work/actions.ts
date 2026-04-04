"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { toQueryString } from "@/lib/format"
import { requireVerifiedWorkerSession } from "@/lib/server/session"
import { acceptTask, submitTask } from "@/lib/server/task-service"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error."
}

export async function acceptTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "")

  try {
    const worker = await requireVerifiedWorkerSession()
    await acceptTask(taskId, { workerId: worker.id })

    revalidatePath("/work")
    redirect(
      `/work${toQueryString({
        task: taskId,
        notice: "Task accepted. Submit proof to continue.",
      })}`,
    )
  } catch (error) {
    redirect(
      `/work${toQueryString({
        task: taskId,
        error: errorMessage(error),
      })}`,
    )
  }
}

export async function submitTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "")
  const requestCode = String(formData.get("requestCode") ?? "")
  const imageDataUrl = String(formData.get("imageDataUrl") ?? "").trim()
  const latitude = String(formData.get("latitude") ?? "").trim()
  const longitude = String(formData.get("longitude") ?? "").trim()
  const accuracyMeters = String(formData.get("accuracyMeters") ?? "").trim()

  try {
    const worker = await requireVerifiedWorkerSession()

    await submitTask(taskId, {
      workerId: worker.id,
      requestCode,
      imageDataUrl: imageDataUrl || undefined,
      location:
        latitude && longitude
          ? {
              latitude: Number(latitude),
              longitude: Number(longitude),
              accuracyMeters: accuracyMeters ? Number(accuracyMeters) : undefined,
            }
          : undefined,
    })

    revalidatePath("/work")
    revalidatePath("/app")
    redirect(
      `/work${toQueryString({
        task: taskId,
        notice: "Proof submitted. Validation and payout state updated.",
      })}`,
    )
  } catch (error) {
    redirect(
      `/work${toQueryString({
        task: taskId,
        error: errorMessage(error),
      })}`,
    )
  }
}
