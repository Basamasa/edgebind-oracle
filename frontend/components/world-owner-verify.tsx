"use client"

import { useState } from "react"
import {
  IDKitRequestWidget,
  IDKitErrorCodes,
  orbLegacy,
  type IDKitResult,
  type RpContext,
} from "@worldcoin/idkit"

type WorldOwnerVerifyProps = {
  appId: `app_${string}` | null
  action: string | null
  environment: "production" | "staging"
  rpContext: RpContext | null
  worldReady: boolean
  userId: string
}

export function WorldOwnerVerify({
  appId,
  action,
  environment,
  rpContext,
  worldReady,
  userId,
}: WorldOwnerVerifyProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string>("")
  const [isPreparing, setIsPreparing] = useState(false)
  const [runtimeRpContext, setRuntimeRpContext] = useState<RpContext | null>(rpContext)

  async function prepareVerification() {
    if (!worldReady || !appId || !action) {
      setStatus("World env is missing app, action, rp id, or signing key.")
      return
    }

    try {
      setIsPreparing(true)
      setStatus("")

      const response = await fetch("/api/world/rp-signature", {
        method: "POST",
        cache: "no-store",
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to prepare World verification")
      }

      setRuntimeRpContext(payload.rp_context)
      setOpen(true)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to prepare World verification")
    } finally {
      setIsPreparing(false)
    }
  }

  async function handleVerify(result: IDKitResult) {
    if (!runtimeRpContext) {
      throw new Error("World RP context is missing")
    }

    const response = await fetch("/api/world/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rp_id: runtimeRpContext.rp_id,
        idkitResponse: result,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(payload.error ?? "World proof verification failed")
    }
  }

  if (!worldReady || !appId || !action) {
    return (
      <div className="rounded-[24px] border border-[#a2322d]/15 bg-[#fff1ed] p-5 font-mono text-sm leading-7 text-[#7a2f2a]">
        WORLD_APP_ID, WORLD_ACTION_ID, WORLD_RP_ID, and WORLD_RP_SIGNING_KEY must be set before
        owner verification can run.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={prepareVerification}
        disabled={isPreparing}
        className="rounded-full border border-black/10 bg-white px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPreparing ? "preparing_world_check" : "verify_with_world"}
      </button>

      {status ? (
        <div className="rounded-[18px] border border-[#a2322d]/15 bg-[#fff1ed] px-4 py-3 font-mono text-xs text-[#7a2f2a]">
          {status}
        </div>
      ) : null}

      {runtimeRpContext ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={appId}
          action={action}
          rp_context={runtimeRpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy({ signal: userId })}
          environment={environment}
          handleVerify={handleVerify}
          onSuccess={() => {
            window.location.reload()
          }}
          onError={(errorCode) => {
            setStatus(
              errorCode === IDKitErrorCodes.UserRejected
                ? "Verification was canceled in World App."
                : `World verification failed: ${errorCode}`,
            )
          }}
        />
      ) : null}
    </div>
  )
}
