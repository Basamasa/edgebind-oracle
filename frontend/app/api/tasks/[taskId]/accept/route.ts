import { NextRequest, NextResponse } from "next/server"

import { requireVerifiedWorkerSession } from "@/lib/server/session"
import { acceptTask } from "@/lib/server/task-service"
import { toErrorResponse } from "@/lib/server/errors"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params
    const worker = await requireVerifiedWorkerSession()
    const payload = await request.json().catch(() => ({}))

    return NextResponse.json(
      await acceptTask(taskId, {
        ...payload,
        workerId: worker.id,
      }),
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}
