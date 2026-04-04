import { NextRequest, NextResponse } from "next/server"

import { corsPreflight, withCors } from "@/lib/server/cors"
import { toErrorResponse } from "@/lib/server/errors"
import { requireVerifiedWorkerRequest } from "@/lib/server/session"
import { getUserProfile, updateWorkerPayoutAccount } from "@/lib/server/task-service"

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function GET(request: NextRequest) {
  try {
    const worker = requireVerifiedWorkerRequest(request)
    return withCors(request, NextResponse.json(await getUserProfile(worker.id)))
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}

export async function POST(request: NextRequest) {
  try {
    const worker = requireVerifiedWorkerRequest(request)
    const payload = (await request.json().catch(() => ({}))) as { payoutAccountId?: string }

    return withCors(
      request,
      NextResponse.json(
        await updateWorkerPayoutAccount(worker.id, payload.payoutAccountId ?? ""),
      ),
    )
  } catch (error) {
    return withCors(request, toErrorResponse(error))
  }
}
