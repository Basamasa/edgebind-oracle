import { NextResponse } from "next/server"

import { databaseHealth } from "@/lib/server/db"
import { toErrorResponse } from "@/lib/server/errors"

export async function GET() {
  try {
    const database = await databaseHealth()

    return NextResponse.json({
      status: "ok",
      service: "edgebind-next-app",
      database,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
