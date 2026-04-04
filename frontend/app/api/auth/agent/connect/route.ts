import { NextRequest, NextResponse } from "next/server"

import { createProvisionalOwnerSession, getAgentHandoff } from "@/lib/server/task-service"
import { createSessionToken } from "@/lib/server/session"

export async function GET(request: NextRequest) {
  const handoffId = request.nextUrl.searchParams.get("handoff")?.trim()

  if (!handoffId) {
    return NextResponse.redirect(new URL("/owner?error=missing_handoff", request.url))
  }

  await getAgentHandoff(handoffId)

  const owner = await createProvisionalOwnerSession()
  const token = createSessionToken(owner)
  const redirectUrl = new URL("/owner", request.url)
  redirectUrl.searchParams.set("handoff", handoffId)
  redirectUrl.searchParams.set("autostart", "1")

  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set("edgebind_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
