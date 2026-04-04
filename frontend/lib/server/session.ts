import { createHmac, timingSafeEqual } from "node:crypto"

import { cookies } from "next/headers"

import type { UserRole, UserSummary } from "@/lib/domain"
import { AppError } from "@/lib/server/errors"

const SESSION_COOKIE_NAME = "edgebind_session"

type SessionPayload = UserSummary & {
  issuedAt: number
}

function sessionSecret() {
  const value = process.env.SESSION_SECRET

  if (value) {
    return value
  }

  if (process.env.NODE_ENV !== "production") {
    return "edgebind-dev-session-secret"
  }

  throw new Error("SESSION_SECRET is required in production")
}

function sign(unsignedValue: string) {
  return createHmac("sha256", sessionSecret()).update(unsignedValue).digest("base64url")
}

function encode(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url")
}

function decode(value: string) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload
  } catch {
    return null
  }
}

function parseToken(token: string | undefined) {
  if (!token) {
    return null
  }

  const [encodedPayload, providedSignature] = token.split(".")
  if (!encodedPayload || !providedSignature) {
    return null
  }

  const expectedSignature = sign(encodedPayload)
  const provided = Buffer.from(providedSignature)
  const expected = Buffer.from(expectedSignature)

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null
  }

  return decode(encodedPayload)
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  return parseToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}

export async function requireSessionUser() {
  const user = await getSessionUser()

  if (!user) {
    throw new AppError(401, "You must sign in to continue")
  }

  return user
}

export async function requireSessionRole(roles: UserRole[]) {
  const user = await requireSessionUser()

  if (!roles.includes(user.role)) {
    throw new AppError(403, "Your session does not have access to this action")
  }

  return user
}

export async function requireVerifiedWorkerSession() {
  const user = await requireSessionRole(["worker"])

  if (!user.isHumanVerified) {
    throw new AppError(403, "Only verified humans can perform this action")
  }

  return user
}

export async function setSession(user: UserSummary) {
  const cookieStore = await cookies()
  const payload: SessionPayload = {
    ...user,
    issuedAt: Date.now(),
  }
  const encodedPayload = encode(payload)
  const token = `${encodedPayload}.${sign(encodedPayload)}`

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
