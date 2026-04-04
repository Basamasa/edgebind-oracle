import { NextResponse } from "next/server"

import { getSessionUser } from "@/lib/server/session"
import { toErrorResponse } from "@/lib/server/errors"
import { getWorldConfig } from "@/lib/world"

export async function GET() {
  try {
    const session = await getSessionUser()
    const world = getWorldConfig()

    return NextResponse.json({
      authenticated: Boolean(session),
      session,
      identity: session
        ? {
            source: "dev_session",
            actorModel:
              session.role === "worker"
                ? "verified human executor"
                : session.isHumanVerified
                  ? "human-backed agent operator"
                  : "local owner session",
            humanVerified: session.isHumanVerified,
            cookie: "edgebind_session",
          }
        : {
            source: "anonymous",
            actorModel: null,
            humanVerified: false,
            cookie: "edgebind_session",
          },
      world: {
        provider: world.provider,
        status: world.status,
        targetModel: "verified human behind agent wallet",
        registerCommand: world.registerCommand,
        chainId: world.chainId,
        appIdConfigured: world.appIdConfigured,
        actionIdConfigured: world.actionIdConfigured,
        rpcUrlConfigured: world.rpcUrlConfigured,
        relayUrlConfigured: world.relayUrlConfigured,
        agentBookAddress: world.agentBookAddress,
        docsUrl: world.docsUrl,
        repoUrl: world.repoUrl,
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
