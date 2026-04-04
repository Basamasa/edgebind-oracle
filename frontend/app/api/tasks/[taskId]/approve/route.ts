import { NextRequest, NextResponse } from "next/server"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { toErrorResponse } from "@/lib/server/errors"
import { requireVerifiedOwnerRequest } from "@/lib/server/session"
import { approveTask } from "@/lib/server/task-service"

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params
    const approver = requireVerifiedOwnerRequest(request)
    const payload = await request.json().catch(() => ({}))

    return withCors(
      request,
      NextResponse.json(
        await approveTask(taskId, {
          ...payload,
          approverId: approver.id,
        }),
      ),
    )
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}
