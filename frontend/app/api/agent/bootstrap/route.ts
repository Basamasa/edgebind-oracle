import { NextRequest, NextResponse } from "next/server"

import { getWorldConfig } from "@/lib/world"

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const world = getWorldConfig()

  return NextResponse.json({
    service: "edgebind",
    audience: "external_agent",
    baseUrl: origin,
    ownerSurface: `${origin}/owner`,
    workerSurface: "https://edgebind-worker.vercel.app",
    auth: {
      mode: "verified_owner_bearer",
      ownerVerification: "world",
      tokenRoute: `${origin}/api/auth/agent/token`,
      header: "Authorization: Bearer <token>",
      steps: [
        "human owner opens /owner",
        "human owner completes World verification",
        "human owner generates bearer token",
        "external agent stores bearer token",
      ],
    },
    model: {
      taskShape: "one_task_one_worker",
      proofGate: "required_before_payout",
      payoutRail: "hedera",
      highRisk: "manual_approval_inside_runtime",
    },
    world: {
      status: world.status,
      environment: world.environment,
      provider: world.provider,
    },
    routes: {
      createTask: { method: "POST", path: "/api/tasks" },
      readTask: { method: "GET", path: "/api/tasks/:taskId" },
      approveTask: { method: "POST", path: "/api/tasks/:taskId/approve" },
    },
    example: {
      createTask: {
        headers: {
          Authorization: "Bearer <token>",
          "Content-Type": "application/json",
        },
        body: {
          agentRef: "dispatch-scout",
          title: "Check whether a place is open",
          description:
            "instructions = Go to the storefront and take one current exterior photo.\n\ndone_when = Photo is recent, readable, and clearly shows whether the place is open.\n\nproof_requirements = 1 photo, GPS attached, request code visible.",
          rewardAmount: 5,
          rewardCurrency: "HBAR",
          deadline: "2026-04-04T18:00:00.000Z",
          proofType: "photo_location",
          requestCode: "TASK-OPEN-01",
        },
      },
    },
  })
}
