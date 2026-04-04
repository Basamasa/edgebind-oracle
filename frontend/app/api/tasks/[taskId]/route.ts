import { NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/server/errors"
import { getTaskById } from "@/lib/server/task-service"

export async function GET(
  _request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params
    return NextResponse.json(getTaskById(taskId))
  } catch (error) {
    return toErrorResponse(error)
  }
}
