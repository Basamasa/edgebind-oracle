import { NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/server/errors"
import { approveTask } from "@/lib/server/task-service"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params
    return NextResponse.json(approveTask(taskId, await request.json()))
  } catch (error) {
    return toErrorResponse(error)
  }
}
