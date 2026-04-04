import { NextRequest, NextResponse } from "next/server"

import { clearSession, setSession } from "@/lib/server/session"
import { AppError, toErrorResponse } from "@/lib/server/errors"
import { listUsers } from "@/lib/server/task-service"
import { getWorldConfig } from "@/lib/world"

function assertDevelopmentOnly() {
  if (process.env.NODE_ENV === "production") {
    throw new AppError(403, "Dev session bootstrap is disabled in production")
  }
}

export async function POST(request: NextRequest) {
  try {
    assertDevelopmentOnly()
    const payload = await request.json().catch(() => ({}))
    const userId = String(payload.userId ?? "").trim()

    if (!userId) {
      throw new AppError(400, "userId is required")
    }

    const users = await listUsers()
    const user = users.find((entry) => entry.id === userId)

    if (!user) {
      throw new AppError(404, `User ${userId} was not found`)
    }

    await setSession(user)
    const world = getWorldConfig()

    return NextResponse.json({
      ok: true,
      cookie: "edgebind_session",
      user,
      identity: {
        source: "dev_session",
        actorModel:
          user.role === "worker"
            ? "verified human executor"
            : user.isHumanVerified
              ? "human-backed agent operator"
              : "local owner session",
        humanVerified: user.isHumanVerified,
      },
      world: {
        provider: world.provider,
        status: world.status,
        targetModel: "verified human behind agent wallet",
        registerCommand: world.registerCommand,
        chainId: world.chainId,
        environment: world.environment,
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE() {
  try {
    assertDevelopmentOnly()
    await clearSession()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
