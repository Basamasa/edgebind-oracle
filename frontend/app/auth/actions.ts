"use server"

import { redirect } from "next/navigation"

import { AppError } from "@/lib/server/errors"
import { clearSession, setSession } from "@/lib/server/session"
import { listUsers } from "@/lib/server/task-service"

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error."
}

async function signInAsRole(
  userId: string,
  role: "owner" | "worker",
  redirectTo: string,
  fallbackMessage: string,
) {
  try {
    const users = await listUsers(role)
    const user = users.find((entry) => entry.id === userId)

    if (!user) {
      throw new AppError(404, fallbackMessage)
    }

    if (role === "worker" && !user.isHumanVerified) {
      throw new AppError(403, "Only verified humans can access worker tasks")
    }

    await setSession(user)
    redirect(redirectTo)
  } catch (error) {
    const message = errorMessage(error)
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`)
  }
}

export async function signInOwnerAction(formData: FormData) {
  await signInAsRole(
    String(formData.get("userId") ?? ""),
    "owner",
    "/app",
    "Select a valid owner session",
  )
}

export async function signInWorkerAction(formData: FormData) {
  await signInAsRole(
    String(formData.get("userId") ?? ""),
    "worker",
    "/work",
    "Select a valid worker session",
  )
}

export async function signOutAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "/")
  await clearSession()
  redirect(redirectTo)
}
