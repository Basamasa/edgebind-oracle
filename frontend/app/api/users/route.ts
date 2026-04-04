import { NextRequest, NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/server/errors"
import { listUsers } from "@/lib/server/task-service"

export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role") ?? undefined
    return NextResponse.json(await listUsers(role))
  } catch (error) {
    return toErrorResponse(error)
  }
}
