import { NextRequest, NextResponse } from "next/server"

import { requireSessionRole } from "@/lib/server/session"
import { createTask, listTasks } from "@/lib/server/task-service"
import { toErrorResponse } from "@/lib/server/errors"

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      await listTasks({
        ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
        workerId: request.nextUrl.searchParams.get("workerId") ?? undefined,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
      }),
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const owner = await requireSessionRole(["owner", "admin"])
    const payload = await request.json()

    return NextResponse.json(
      await createTask({
        ...payload,
        ownerId: owner.id,
      }),
      { status: 201 },
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}
