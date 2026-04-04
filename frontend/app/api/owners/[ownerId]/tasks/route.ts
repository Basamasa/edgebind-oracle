import { NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/server/errors"
import { requireSessionRole } from "@/lib/server/session"
import { listOwnerTasks } from "@/lib/server/task-service"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ ownerId: string }> },
) {
  try {
    const sessionUser = await requireSessionRole(["owner", "admin"])
    const { ownerId } = await context.params

    if (sessionUser.role !== "admin" && sessionUser.id !== ownerId) {
      return NextResponse.json(
        { error: "You can only view your own task inventory" },
        { status: 403 },
      )
    }

    return NextResponse.json(await listOwnerTasks(ownerId))
  } catch (error) {
    return toErrorResponse(error)
  }
}
