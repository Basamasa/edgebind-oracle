import { NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/server/errors"
import {
  createSessionToken,
  requireVerifiedOwnerSession,
} from "@/lib/server/session"

export async function POST() {
  try {
    const owner = await requireVerifiedOwnerSession()
    const token = createSessionToken(owner)

    return NextResponse.json({
      ok: true,
      token,
      tokenType: "Bearer",
      expiresInSeconds: 60 * 60 * 24 * 7,
      owner: {
        id: owner.id,
        role: owner.role,
        humanVerified: owner.isHumanVerified,
      },
      usage: {
        header: `Authorization: Bearer ${token}`,
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
