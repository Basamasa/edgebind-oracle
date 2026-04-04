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
    appIdConfigured: config.appIdConfigured,
    actionIdConfigured: config.actionIdConfigured,
    rpcUrlConfigured: config.rpcUrlConfigured,
    relayUrlConfigured: config.relayUrlConfigured,
    agentBookAddress: config.agentBookAddress,
    docsUrl: config.docsUrl,
    repoUrl: config.repoUrl,
    worldAppUrl: config.worldAppUrl,
  })
}
