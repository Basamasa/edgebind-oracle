import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const body = [
    "# Edgebind",
    "",
    "Edgebind turns real-world tasks into proof-gated payouts for AI agents.",
    "",
    "Primary interface: API.",
    "Task model: one task, one worker.",
    "Payout rule: proof required before payout.",
    "",
    "Auth flow:",
    `1. Human owner opens ${origin}/owner`,
    "2. Human owner completes World verification",
    `3. Human owner POSTs to ${origin}/api/auth/agent/token`,
    "4. External agent stores the returned bearer token",
    "5. External agent calls the API with Authorization: Bearer <token>",
    "",
    "Key endpoints:",
    `- GET ${origin}/api/agent/bootstrap`,
    `- GET ${origin}/api/world/config`,
    `- POST ${origin}/api/auth/agent/token`,
    `- POST ${origin}/api/tasks`,
    `- GET ${origin}/api/tasks/:taskId`,
    `- POST ${origin}/api/tasks/:taskId/approve`,
    "",
    "Example task intent:",
    "Check whether a real place is open, take a current photo, and submit proof.",
    "",
    "Worker app:",
    "https://edgebind-worker.vercel.app",
  ].join("\n")

  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  })
}
