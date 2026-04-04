import { NextRequest, NextResponse } from "next/server"

import { acceptTask } from "@/lib/server/task-service"
import { toErrorResponse } from "@/lib/server/errors"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params
    return NextResponse.json(acceptTask(taskId, await request.json()))
  } catch (error) {
    return toErrorResponse(error)
  }
}
