import { NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/server/errors"
import { requireSessionRole } from "@/lib/server/session"
import { approveTask } from "@/lib/server/task-service"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params
    const approver = await requireSessionRole(["owner", "admin"])
    const payload = await request.json().catch(() => ({}))

    return NextResponse.json(
      await approveTask(taskId, {
        ...payload,
        approverId: approver.id,
      }),
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}
