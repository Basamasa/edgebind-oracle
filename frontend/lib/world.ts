export type WorldIntegrationStatus = "docs_only" | "configured"

export type WorldConfig = {
  provider: "world-agentkit"
  status: WorldIntegrationStatus
  registerCommand: string
  docsUrl: string
  repoUrl: string
  worldAppUrl: string
  chainId: string
  appIdConfigured: boolean
  actionIdConfigured: boolean
  rpIdConfigured: boolean
  rpSigningKeyConfigured: boolean
  rpcUrlConfigured: boolean
  relayUrlConfigured: boolean
  environment: "production" | "staging"
  appId: `app_${string}` | null
  action: string | null
  rpId: `rp_${string}` | null
  rpSigningKey: string | null
  agentBookAddress: string | null
}

function trimEnv(name: string) {
  const value = process.env[name]?.trim()
  return value ? value : null
}

export function getWorldConfig(): WorldConfig {
  const appId = trimEnv("WORLD_APP_ID")
  const actionId = trimEnv("WORLD_ACTION_ID")
  const rpId = trimEnv("WORLD_RP_ID")
  const rpSigningKey = trimEnv("WORLD_RP_SIGNING_KEY")
  const rpcUrl = trimEnv("WORLD_AGENTKIT_RPC_URL")
  const relayUrl = trimEnv("WORLD_AGENTKIT_RELAY_URL")
  const agentBookAddress = trimEnv("WORLD_AGENTKIT_AGENTBOOK_ADDRESS")
  const chainId = trimEnv("WORLD_AGENTKIT_CHAIN_ID") ?? "eip155:8453"
  const environment =
    trimEnv("WORLD_ENVIRONMENT") === "staging" || process.env.NODE_ENV !== "production"
      ? "staging"
      : "production"

  return {
    provider: "world-agentkit",
    status: appId && actionId && rpId && rpSigningKey ? "configured" : "docs_only",
    registerCommand: "npx @worldcoin/agentkit-cli register <agent-wallet-address>",
    docsUrl: "https://docs.world.org/agents/agent-kit/sdk-reference",
    repoUrl: "https://github.com/worldcoin/agentkit",
    worldAppUrl: trimEnv("NEXT_PUBLIC_WORLD_APP_URL") ?? "https://world.org/",
    chainId,
    environment,
    appId: appId as `app_${string}` | null,
    action: actionId,
    rpId: rpId as `rp_${string}` | null,
    rpSigningKey,
    appIdConfigured: Boolean(appId),
    actionIdConfigured: Boolean(actionId),
    rpIdConfigured: Boolean(rpId),
    rpSigningKeyConfigured: Boolean(rpSigningKey),
    rpcUrlConfigured: Boolean(rpcUrl),
    relayUrlConfigured: Boolean(relayUrl),
    agentBookAddress,
  }
}
