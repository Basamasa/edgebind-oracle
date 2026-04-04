import { NextRequest, NextResponse } from "next/server"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { toErrorResponse } from "@/lib/server/errors"
import { listUsers } from "@/lib/server/task-service"

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get("role") ?? undefined
    return withCors(request, NextResponse.json(await listUsers(role)))
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}
