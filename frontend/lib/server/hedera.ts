import { AppError } from "@/lib/server/errors"

type HederaNetwork = "testnet" | "mainnet"

type HederaConfig = {
  configured: boolean
  network: HederaNetwork
  operatorAccountId: string | null
  operatorPrivateKey: string | null
  explorerBaseUrl: string
}

function trimEnv(name: string) {
  const value = process.env[name]?.trim()
  return value ? value : null
}

export function getHederaConfig(): HederaConfig {
  const network = trimEnv("HEDERA_NETWORK") === "mainnet" ? "mainnet" : "testnet"
  const operatorAccountId = trimEnv("HEDERA_OPERATOR_ACCOUNT_ID")
  const operatorPrivateKey = trimEnv("HEDERA_OPERATOR_PRIVATE_KEY")
  const explorerBaseUrl =
    trimEnv("HEDERA_EXPLORER_BASE_URL") ??
    `https://hashscan.io/${network}`

  return {
    configured: Boolean(operatorAccountId && operatorPrivateKey),
    network,
    operatorAccountId,
    operatorPrivateKey,
    explorerBaseUrl,
  }
}

export function isHederaPayoutCurrency(currency: string) {
  return currency.trim().toUpperCase() === "HBAR"
}

export function validateHederaAccountId(accountId: string) {
  const normalized = accountId.trim()

  if (!/^\d+\.\d+\.\d+$/.test(normalized)) {
    throw new AppError(400, "Hedera payout account must look like 0.0.12345")
  }

  return normalized
}

async function loadSdk() {
  return import("@hashgraph/sdk")
}

function transactionUrl(baseUrl: string, transactionId: string) {
  return `${baseUrl.replace(/\/$/, "")}/transaction/${encodeURIComponent(transactionId)}`
}

export async function transferHbarPayout(input: {
  taskId: string
  amount: number
  toAccountId: string
  network: HederaNetwork
}) {
  const config = getHederaConfig()

  if (!config.configured || !config.operatorAccountId || !config.operatorPrivateKey) {
    throw new AppError(503, "Hedera payout rail is not configured")
  }

  const { AccountId, Client, Hbar, PrivateKey, TransferTransaction } = await loadSdk()

  const client =
    input.network === "mainnet" ? Client.forMainnet() : Client.forTestnet()

  const operatorId = AccountId.fromString(config.operatorAccountId)
  const destinationId = AccountId.fromString(validateHederaAccountId(input.toAccountId))

  let operatorKey

  if (config.operatorPrivateKey.startsWith("0x")) {
    try {
      operatorKey = PrivateKey.fromStringECDSA(config.operatorPrivateKey)
    } catch {
      operatorKey = PrivateKey.fromStringED25519(config.operatorPrivateKey)
    }
  } else {
    try {
      operatorKey = PrivateKey.fromStringED25519(config.operatorPrivateKey)
    } catch {
      operatorKey = PrivateKey.fromStringECDSA(config.operatorPrivateKey)
    }
  }

  client.setOperator(operatorId, operatorKey)

  try {
    const transaction = await new TransferTransaction()
      .addHbarTransfer(operatorId, new Hbar(-input.amount))
      .addHbarTransfer(destinationId, new Hbar(input.amount))
      .setTransactionMemo(`edgebind:${input.taskId}`)
      .execute(client)

    const receipt = await transaction.getReceipt(client)
    const transactionId = transaction.transactionId?.toString() ?? null

    return {
      transactionId,
      receiptStatus: receipt.status.toString(),
      explorerUrl: transactionId
        ? transactionUrl(config.explorerBaseUrl, transactionId)
        : null,
    }
  } catch (error) {
    throw new AppError(
      502,
      error instanceof Error ? `Hedera transfer failed: ${error.message}` : "Hedera transfer failed",
    )
  } finally {
    client.close()
  }
}
