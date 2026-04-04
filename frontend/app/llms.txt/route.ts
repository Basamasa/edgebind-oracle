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
    "Important:",
    "External agents cannot use the human owner's browser session or World app directly.",
    "Start a handoff session, give the human the connectUrl, and wait for World verification to complete.",
    "",
    "Auth flow:",
    `1. POST ${origin}/api/auth/agent/handoff/start`,
    "2. Give the human the returned connectUrl",
    "3. Human opens the link and completes World verification",
    "4. Poll the returned pollUrl until status = completed",
    "5. Use the returned token with Authorization: Bearer <token>",
    "",
    "Key endpoints:",
    `- GET ${origin}/api/agent/bootstrap`,
    `- GET ${origin}/api/world/config`,
    `- POST ${origin}/api/auth/agent/handoff/start`,
    `- GET ${origin}/api/auth/agent/handoff/:handoffId`,
    `- POST ${origin}/api/auth/agent/token`,
    `- POST ${origin}/api/tasks`,
    `- GET ${origin}/api/tasks/:taskId`,
    `- POST ${origin}/api/tasks/:taskId/approve`,
    "",
    "Do not rely on:",
    "- browser cookies from the human owner's session",
    "- clicking /owner from a read-only fetch tool",
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
