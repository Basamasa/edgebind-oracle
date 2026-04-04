import { NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/server/errors"
import { listOwnerTasks } from "@/lib/server/task-service"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ ownerId: string }> },
) {
  try {
    const { ownerId } = await context.params
    return NextResponse.json(listOwnerTasks(ownerId))
  } catch (error) {
    return toErrorResponse(error)
  }
}
