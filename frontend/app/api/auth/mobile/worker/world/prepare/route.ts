import { NextRequest, NextResponse } from "next/server"
import { signRequest } from "@worldcoin/idkit/signing"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { AppError, toErrorResponse } from "@/lib/server/errors"
import { getWorldConfig } from "@/lib/world"

const WORKER_WORLD_SIGNAL = "edgebind-worker-auth"

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    const config = getWorldConfig()

    if (!config.appId || !config.action || !config.rpId || !config.rpSigningKey) {
      throw new AppError(503, "World verification is not configured yet")
    }

    const signature = signRequest(config.action, config.rpSigningKey)

    return withCors(
      request,
      NextResponse.json({
        app_id: config.appId,
        action: config.action,
        environment: config.environment,
        signal: WORKER_WORLD_SIGNAL,
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
