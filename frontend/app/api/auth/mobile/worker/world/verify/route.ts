import type { IDKitResult } from "@worldcoin/idkit"
import { hashSignal } from "@worldcoin/idkit/hashing"
import { NextRequest, NextResponse } from "next/server"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { AppError, toErrorResponse } from "@/lib/server/errors"
import { createSessionToken } from "@/lib/server/session"
import { listUsers, markUserHumanVerified } from "@/lib/server/task-service"
import { getWorldConfig } from "@/lib/world"

type VerifyPayload = {
  userId?: string
  rp_id?: string
  idkitResponse?: IDKitResult
}

type WorldVerifyResponse = {
  success?: boolean
  verified?: boolean
  code?: string
  detail?: string
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as VerifyPayload
    const userId = String(payload.userId ?? "").trim()
    const rpId = payload.rp_id?.trim()
    const result = payload.idkitResponse
    const config = getWorldConfig()

    if (!userId || !rpId || !result) {
      throw new AppError(400, "userId, rp_id, and idkitResponse are required")
    }

    if (!config.rpId || !config.rpSigningKey) {
      throw new AppError(503, "World verification is not configured yet")
    }

    if (rpId !== config.rpId) {
      throw new AppError(400, "World RP mismatch")
    }

    const users = await listUsers("worker")
    const user = users.find((entry) => entry.id === userId)

    if (!user) {
      throw new AppError(404, `Worker ${userId} was not found`)
    }

    const expectedSignalHash = hashSignal(user.id)
    const signalHashes = result.responses.map((response) => response.signal_hash).filter(Boolean)

    if (signalHashes.length === 0 || signalHashes.some((hash) => hash !== expectedSignalHash)) {
      throw new AppError(400, "World proof was not bound to the current worker selection")
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

    const verifiedUser = await markUserHumanVerified(user.id)

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
