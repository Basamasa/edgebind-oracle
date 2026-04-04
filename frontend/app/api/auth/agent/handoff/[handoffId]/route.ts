import { NextRequest, NextResponse } from "next/server"

import { AppError, toErrorResponse } from "@/lib/server/errors"
import { getAgentHandoff } from "@/lib/server/task-service"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handoffId: string }> },
) {
  try {
    const { handoffId } = await params
    const handoff = await getAgentHandoff(handoffId)

    return NextResponse.json({
      ok: true,
      handoffId: handoff.id,
      status: handoff.status,
      token: handoff.status === "completed" ? handoff.token : null,
      ownerId: handoff.ownerId,
      completedAt: handoff.completedAt,
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
