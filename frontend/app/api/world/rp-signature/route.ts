import { NextResponse } from "next/server"
import { signRequest } from "@worldcoin/idkit/signing"

import { AppError, toErrorResponse } from "@/lib/server/errors"
import { requireSessionRole } from "@/lib/server/session"
import { getWorldConfig } from "@/lib/world"

export async function POST() {
  try {
    await requireSessionRole(["owner", "admin"])
    const config = getWorldConfig()

    if (!config.appId || !config.action || !config.rpId || !config.rpSigningKey) {
      throw new AppError(503, "World verification is not configured yet")
    }

    const signature = signRequest(config.action, config.rpSigningKey)

    return NextResponse.json({
      app_id: config.appId,
      action: config.action,
      environment: config.environment,
      rp_context: {
        rp_id: config.rpId,
        nonce: signature.nonce,
        created_at: signature.createdAt,
        expires_at: signature.expiresAt,
        signature: signature.sig,
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
