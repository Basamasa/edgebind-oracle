import { NextRequest, NextResponse } from "next/server"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { toErrorResponse } from "@/lib/server/errors"
import { requireVerifiedWorkerRequest } from "@/lib/server/session"
import { submitTask } from "@/lib/server/task-service"

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params
    const worker = requireVerifiedWorkerRequest(request)
    const payload = await request.json()

    return withCors(
      request,
      NextResponse.json(
        await submitTask(taskId, {
          ...payload,
          workerId: worker.id,
        }),
      ),
    )
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}
