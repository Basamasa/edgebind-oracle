"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { toQueryString } from "@/lib/format"
import { acceptTask, submitTask } from "@/lib/server/task-service"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error."
}

export async function acceptTaskAction(formData: FormData) {
  const workerId = String(formData.get("workerId") ?? "")
  const taskId = String(formData.get("taskId") ?? "")

  try {
    acceptTask(taskId, { workerId })

    revalidatePath("/work")
    redirect(
      `/work${toQueryString({
        worker: workerId,
        task: taskId,
        notice: "Task accepted. Submit proof to continue.",
      })}`,
    )
  } catch (error) {
    redirect(
      `/work${toQueryString({
        worker: workerId,
        task: taskId,
        error: errorMessage(error),
      })}`,
    )
  }
}

export async function submitTaskAction(formData: FormData) {
  const workerId = String(formData.get("workerId") ?? "")
  const taskId = String(formData.get("taskId") ?? "")
  const requestCode = String(formData.get("requestCode") ?? "")
  const imageDataUrl = String(formData.get("imageDataUrl") ?? "").trim()
  const latitude = String(formData.get("latitude") ?? "").trim()
  const longitude = String(formData.get("longitude") ?? "").trim()
  const accuracyMeters = String(formData.get("accuracyMeters") ?? "").trim()

  try {
    submitTask(taskId, {
      workerId,
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
        worker: workerId,
        task: taskId,
        notice: "Proof submitted. Validation and payout state updated.",
      })}`,
    )
  } catch (error) {
    redirect(
      `/work${toQueryString({
        worker: workerId,
        task: taskId,
        error: errorMessage(error),
      })}`,
    )
  }
}
