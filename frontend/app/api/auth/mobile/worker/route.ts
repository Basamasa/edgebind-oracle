import { NextRequest, NextResponse } from "next/server"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { AppError, toErrorResponse } from "@/lib/server/errors"
import { createSessionToken } from "@/lib/server/session"
import { listUsers } from "@/lib/server/task-service"

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}))
    const userId = String(payload.userId ?? "").trim()

    if (!userId) {
      throw new AppError(400, "userId is required")
    }

    const users = await listUsers("worker")
    const user = users.find((entry) => entry.id === userId)

    if (!user) {
      throw new AppError(404, `Worker ${userId} was not found`)
    }

    if (!user.isHumanVerified) {
      throw new AppError(403, "Only verified worker accounts can use the mobile app")
    }

    return withCors(
      request,
      NextResponse.json({
        ok: true,
        token: createSessionToken(user),
        user,
      }),
    )
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}
