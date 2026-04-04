import { NextResponse } from "next/server"

import { getWorldConfig } from "@/lib/world"

export async function GET() {
  const config = getWorldConfig()

  return NextResponse.json({
    provider: config.provider,
    status: config.status,
    targetModel: "verified human behind agent wallet",
    registerCommand: config.registerCommand,
    chainId: config.chainId,
    environment: config.environment,
    appIdConfigured: config.appIdConfigured,
    actionIdConfigured: config.actionIdConfigured,
    rpIdConfigured: config.rpIdConfigured,
    rpSigningKeyConfigured: config.rpSigningKeyConfigured,
    rpcUrlConfigured: config.rpcUrlConfigured,
    relayUrlConfigured: config.relayUrlConfigured,
    agentBookAddress: config.agentBookAddress,
    docsUrl: config.docsUrl,
    repoUrl: config.repoUrl,
    worldAppUrl: config.worldAppUrl,
  })
}
