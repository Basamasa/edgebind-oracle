import { NextRequest, NextResponse } from "next/server"

const DEFAULT_ALLOWED_ORIGINS = [
  "https://edgebind-worker.vercel.app",
  "https://edgebind-mobile.vercel.app",
  "https://edgebind-mobile-self.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
]

function configuredOrigins() {
  const value = process.env.MOBILE_APP_ORIGINS?.trim()

  if (!value) {
    return DEFAULT_ALLOWED_ORIGINS
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function isAllowedOrigin(origin: string | null) {
  if (!origin) {
    return false
  }

  return configuredOrigins().includes(origin)
}

export function withCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin")

  if (!isAllowedOrigin(origin)) {
    return response
  }

  response.headers.set("Access-Control-Allow-Origin", origin!)
  response.headers.set("Vary", "Origin")
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Authorization,Content-Type")

  return response
}

export function corsPreflight(request: NextRequest) {
  const origin = request.headers.get("origin")

  if (!isAllowedOrigin(origin)) {
    return new NextResponse(null, { status: 204 })
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin!,
      Vary: "Origin",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization,Content-Type",
    },
  })
}
