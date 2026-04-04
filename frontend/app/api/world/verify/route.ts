import type { IDKitResult } from "@worldcoin/idkit"
import { hashSignal } from "@worldcoin/idkit/hashing"
import { NextRequest, NextResponse } from "next/server"

import { AppError, toErrorResponse } from "@/lib/server/errors"
import { requireSessionRole, setSession } from "@/lib/server/session"
import { markUserHumanVerified } from "@/lib/server/task-service"
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

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireSessionRole(["owner", "admin"])
    const config = getWorldConfig()

    if (!config.rpId || !config.rpSigningKey) {
      throw new AppError(503, "World verification is not configured yet")
    }

    const payload = (await request.json()) as VerifyPayload
    const rpId = payload.rp_id?.trim()
    const result = payload.idkitResponse

    if (!rpId || !result) {
      throw new AppError(400, "rp_id and idkitResponse are required")
    }

    if (rpId !== config.rpId) {
      throw new AppError(400, "World RP mismatch")
    }

    const expectedSignalHash = hashSignal(sessionUser.id)
    const signalHashes = result.responses.map((response) => response.signal_hash).filter(Boolean)

    if (signalHashes.length === 0 || signalHashes.some((hash) => hash !== expectedSignalHash)) {
      throw new AppError(400, "World proof was not bound to the current owner session")
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

    const updatedUser = await markUserHumanVerified(sessionUser.id)
    await setSession(updatedUser)

    return NextResponse.json({
      ok: true,
      user: updatedUser,
      identity: {
        source: "world_id",
        actorModel: "human-backed agent operator",
        humanVerified: true,
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
