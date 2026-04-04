import { NextRequest, NextResponse } from "next/server"

import { createAgentHandoff } from "@/lib/server/task-service"

export async function POST(request: NextRequest) {
  const handoff = await createAgentHandoff()
  const origin = request.nextUrl.origin

  return NextResponse.json({
    ok: true,
    handoffId: handoff.id,
    status: handoff.status,
    connectUrl: `${origin}/api/auth/agent/connect?handoff=${encodeURIComponent(handoff.id)}`,
    pollUrl: `${origin}/api/auth/agent/handoff/${encodeURIComponent(handoff.id)}`,
  })
}
