import { NextRequest, NextResponse } from "next/server"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { requireVerifiedOwnerRequest } from "@/lib/server/session"
import { createTask, listTasks } from "@/lib/server/task-service"
import { toErrorResponse } from "@/lib/server/errors"

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function GET(request: NextRequest) {
  try {
    return withCors(
      request,
      NextResponse.json(
      await listTasks({
        ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
        workerId: request.nextUrl.searchParams.get("workerId") ?? undefined,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
      }),
    )
    )
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}

export async function POST(request: NextRequest) {
  try {
    const owner = requireVerifiedOwnerRequest(request)
    const payload = await request.json()

    return withCors(
      request,
      NextResponse.json(
        await createTask({
          ...payload,
          ownerId: owner.id,
        }),
        { status: 201 },
      ),
    )
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}
