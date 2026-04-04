import type { IDKitResult } from "@worldcoin/idkit"
import { hashSignal } from "@worldcoin/idkit/hashing"
import { NextRequest, NextResponse } from "next/server"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { AppError, toErrorResponse } from "@/lib/server/errors"
import { createSessionToken } from "@/lib/server/session"
import { findOrCreateWorldWorker } from "@/lib/server/task-service"
import { getWorldConfig } from "@/lib/world"

type VerifyPayload = {
  rp_id?: string
  idkitResponse?: IDKitResult
}

type WorldVerifyResponse = {
  success?: boolean
  verified?: boolean
  code?: string
  detail?: string
}

const WORKER_WORLD_SIGNAL = "edgebind-worker-auth"

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as VerifyPayload
    const rpId = payload.rp_id?.trim()
    const result = payload.idkitResponse
    const config = getWorldConfig()

    if (!rpId || !result) {
      throw new AppError(400, "rp_id and idkitResponse are required")
    }

    if (!config.rpId || !config.rpSigningKey) {
      throw new AppError(503, "World verification is not configured yet")
    }

    if (rpId !== config.rpId) {
      throw new AppError(400, "World RP mismatch")
    }

    const expectedSignalHash = hashSignal(WORKER_WORLD_SIGNAL)
    const signalHashes = result.responses.map((response) => response.signal_hash).filter(Boolean)

    if (signalHashes.length === 0 || signalHashes.some((hash) => hash !== expectedSignalHash)) {
      throw new AppError(400, "World proof was not bound to the worker auth flow")
    }

    const worldNullifier = result.responses[0]?.nullifier?.trim().toLowerCase()

    if (!worldNullifier) {
      throw new AppError(400, "World proof did not include a nullifier")
    }

    const verifyResponse = await fetch(`https://developer.world.org/api/v4/verify/${rpId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
      cache: "no-store",
    })

    const verifyBody = (await verifyResponse.json().catch(() => ({}))) as WorldVerifyResponse

    if (!verifyResponse.ok || (!verifyBody.success && !verifyBody.verified)) {
      throw new AppError(
        400,
        verifyBody.detail || verifyBody.code || "World proof verification failed",
      )
    }

    const verifiedUser = await findOrCreateWorldWorker(worldNullifier)

    return withCors(
      request,
      NextResponse.json({
        ok: true,
        token: createSessionToken(verifiedUser),
        user: verifiedUser,
        identity: {
          source: "world_id",
          actorModel: "verified human worker",
          humanVerified: true,
        },
      }),
    )
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}
