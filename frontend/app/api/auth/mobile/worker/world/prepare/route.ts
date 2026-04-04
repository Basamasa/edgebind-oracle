import { NextRequest, NextResponse } from "next/server"
import { signRequest } from "@worldcoin/idkit/signing"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { AppError, toErrorResponse } from "@/lib/server/errors"
import { listUsers } from "@/lib/server/task-service"
import { getWorldConfig } from "@/lib/world"

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

    const config = getWorldConfig()

    if (!config.appId || !config.action || !config.rpId || !config.rpSigningKey) {
      throw new AppError(503, "World verification is not configured yet")
    }

    const users = await listUsers("worker")
    const user = users.find((entry) => entry.id === userId)

    if (!user) {
      throw new AppError(404, `Worker ${userId} was not found`)
    }

    const signature = signRequest(config.action, config.rpSigningKey)

    return withCors(
      request,
      NextResponse.json({
        app_id: config.appId,
        action: config.action,
        environment: config.environment,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          isHumanVerified: user.isHumanVerified,
        },
        rp_context: {
          rp_id: config.rpId,
          nonce: signature.nonce,
          created_at: signature.createdAt,
          expires_at: signature.expiresAt,
          signature: signature.sig,
        },
      }),
    )
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}
