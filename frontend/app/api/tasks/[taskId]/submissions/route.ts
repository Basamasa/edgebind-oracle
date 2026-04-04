import { NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/server/errors"
import { requireVerifiedWorkerSession } from "@/lib/server/session"
import { submitTask } from "@/lib/server/task-service"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params
    const worker = await requireVerifiedWorkerSession()
    const payload = await request.json()

    return NextResponse.json(
      await submitTask(taskId, {
        ...payload,
        workerId: worker.id,
      }),
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}
