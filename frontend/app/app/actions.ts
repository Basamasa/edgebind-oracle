"use server"

import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"

import { toQueryString } from "@/lib/format"
import { requireVerifiedOwnerSession } from "@/lib/server/session"
import { approveTask, createTask } from "@/lib/server/task-service"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error."
}

function buildTaskDescription(formData: FormData) {
  const directDescription = String(formData.get("description") ?? "").trim()

  if (directDescription) {
    return directDescription
  }

  const instructions = String(formData.get("instructions") ?? "").trim()
  const doneWhen = String(formData.get("done_when") ?? "").trim()
  const proofRequirements = String(formData.get("proof_requirements") ?? "").trim()
  const autoReleaseIf = String(formData.get("auto_release_if") ?? "").trim()
  const escalateIf = String(formData.get("escalate_if") ?? "").trim()
  const parts = [
    instructions ? `instructions = ${instructions}` : "",
    doneWhen ? `done_when = ${doneWhen}` : "",
    proofRequirements ? `proof_requirements = ${proofRequirements}` : "",
    autoReleaseIf ? `auto_release_if = ${autoReleaseIf}` : "",
    escalateIf ? `escalate_if = ${escalateIf}` : "",
  ].filter(Boolean)

  return parts.join("\n\n")
}

export async function createTaskAction(formData: FormData) {
  try {
    const owner = await requireVerifiedOwnerSession()
    const rawDeadline = String(formData.get("deadline") ?? "")

    const task = await createTask({
      ownerId: owner.id,
      agentRef: String(formData.get("agent_ref") ?? ""),
      title: String(formData.get("objective") ?? ""),
      description: buildTaskDescription(formData),
      rewardAmount: Number(formData.get("payout_amount") ?? 0),
      rewardCurrency: String(formData.get("currency") ?? "USD"),
      deadline: new Date(rawDeadline).toISOString(),
      proofType: String(formData.get("proof_type") ?? "photo_location"),
      requestCode: String(formData.get("request_code") ?? "") || undefined,
      locationRequirement:
        String(formData.get("location_label") ?? "").trim() ||
        String(formData.get("location_lat") ?? "").trim() ||
        String(formData.get("location_lng") ?? "").trim() ||
        String(formData.get("location_radius_m") ?? "").trim()
          ? {
              label: String(formData.get("location_label") ?? "") || undefined,
              latitude: Number(formData.get("location_lat") ?? 0),
              longitude: Number(formData.get("location_lng") ?? 0),
              radiusMeters: Number(formData.get("location_radius_m") ?? 0),
            }
          : undefined,
    })

    revalidatePath("/app")
    revalidatePath("/owner")
    redirect(
      `/owner${toQueryString({
        task: task.id,
        notice: "Task created successfully.",
      })}`,
    )
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    redirect(
      `/owner${toQueryString({
        error: errorMessage(error),
      })}`,
    )
  }
}

export async function approveTaskAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "")

  try {
    const approver = await requireVerifiedOwnerSession()

    await approveTask(taskId, {
      approverId: approver.id,
      approvalNote: "Approved from the owner dashboard after the agent escalated payout.",
    })

    revalidatePath("/app")
    revalidatePath("/owner")
    redirect(
      `/owner${toQueryString({
        task: taskId,
        notice: "Payout approved.",
      })}`,
    )
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    redirect(
      `/owner${toQueryString({
        task: taskId,
        error: errorMessage(error),
      })}`,
    )
  }
}
