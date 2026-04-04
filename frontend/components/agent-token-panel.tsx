"use client"

import { useState } from "react"

type TokenResponse = {
  token: string
  tokenType: string
  expiresInSeconds: number
}

export function AgentTokenPanel() {
  const [token, setToken] = useState("")
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function generateToken() {
    try {
      setIsLoading(true)
      setStatus("")

      const response = await fetch("/api/auth/agent/token", {
        method: "POST",
        cache: "no-store",
      })
      const payload = (await response.json().catch(() => ({}))) as
        | TokenResponse
        | { error?: string }

      if (!response.ok || !("token" in payload)) {
        throw new Error((payload as { error?: string }).error ?? "Failed to generate token")
      }

      setToken(payload.token)
      setStatus(`expires_in = ${payload.expiresInSeconds}s`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to generate token")
    } finally {
      setIsLoading(false)
    }
  }

  async function copyToken() {
    if (!token) {
      return
    }

    try {
      await navigator.clipboard.writeText(token)
      setStatus("token copied")
    } catch {
      setStatus("copy failed")
    }
  }

  return (
    <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
      <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-[#4e473d]">Agent Access</h2>
      <div className="mt-4 rounded-[20px] border border-black/10 bg-white p-4">
        <div className="font-mono text-xs leading-7 text-[#302a24]">
          Verify once, then paste this token into the external agent. The agent should call the
          API with `Authorization: Bearer ...`.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateToken}
            disabled={isLoading}
            className="rounded-full bg-[#171717] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "generating" : "generate_agent_token"}
          </button>
          <button
            type="button"
            onClick={copyToken}
            disabled={!token}
            className="rounded-full border border-black/10 bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#302a24] transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            copy_token
          </button>
        </div>

        {token ? (
          <pre className="mt-4 overflow-x-auto rounded-[18px] border border-black/10 bg-[#fcfaf7] p-3 font-mono text-xs leading-6 text-[#302a24]">
{`authorization = Bearer ${token}`}
          </pre>
        ) : null}

        <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#756b5e]">
          human_handoff = copy token =&gt; paste into agent chat
        </div>

        {status ? (
          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#756b5e]">
            {status}
          </div>
        ) : null}
      </div>
    </section>
  )
}
