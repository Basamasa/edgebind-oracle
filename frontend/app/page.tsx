import Link from "next/link"
import { headers } from "next/headers"

import { getWorldConfig } from "@/lib/world"

const endpoints = [
  { method: "GET", path: "/llms.txt", note: "plain-text agent instructions" },
  { method: "GET", path: "/api/agent/bootstrap", note: "machine-readable bootstrap" },
  { method: "POST", path: "/api/auth/agent/handoff/start", note: "start human verification handoff" },
  { method: "GET", path: "/api/auth/agent/handoff/:handoffId", note: "poll handoff status and token" },
  { method: "GET", path: "/api/world/config", note: "read world status" },
  { method: "POST", path: "/api/world/rp-signature", note: "mint owner rp context" },
  { method: "POST", path: "/api/world/verify", note: "verify owner proof" },
  { method: "POST", path: "/api/auth/agent/token", note: "generate bearer token from verified owner session" },
  { method: "GET", path: "/api/auth/session", note: "read current identity" },
  { method: "POST", path: "/api/tasks", note: "create task" },
  { method: "GET", path: "/api/tasks/:taskId", note: "read task state" },
  { method: "POST", path: "/api/tasks/:taskId/accept", note: "worker accepts" },
  { method: "POST", path: "/api/tasks/:taskId/submissions", note: "worker submits proof" },
  { method: "POST", path: "/api/tasks/:taskId/approve", note: "release high-risk payout" },
  { method: "GET", path: "/api/auth/mobile/worker/profile", note: "read worker payout profile" },
  { method: "POST", path: "/api/auth/mobile/worker/profile", note: "set Hedera payout account" },
]

const runbook = [
  "GET /llms.txt or GET /api/agent/bootstrap",
  "POST /api/auth/agent/handoff/start",
  "send connectUrl to owner",
  "owner completes World verification",
  "poll pollUrl until completed",
  "external agent stores bearer token",
  "POST /api/tasks",
  "worker verifies in mobile",
  "worker accepts",
  "worker submits proof",
  "GET /api/tasks/:taskId",
  "if pending_approval -> POST /api/tasks/:taskId/approve",
]

const agentTokenResponse = `{
  "ok": true,
  "token": "eyJ...",
  "tokenType": "Bearer",
  "expiresInSeconds": 604800
}`

const createTaskResponse = `{
  "id": "task_...",
  "status": "open",
  "requestCode": "TASK-4821",
  "proofType": "photo_location",
  "rewardAmount": 8,
  "rewardCurrency": "HBAR"
}`

const productionTarget = `target.owner_identity = verified human behind agent
target.agent_access = bearer token from verified owner
target.worker_identity = verified human executor
target.payout_rail = Hedera
target.manual_approval = inside runtime
target.owner_verification_surface = /owner
target.worker_surface = https://edgebind-worker.vercel.app`

export default async function Home() {
  const headerStore = await headers()
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "edgebind-web.vercel.app"
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https")
  const origin = `${protocol}://${host}`
  const world = getWorldConfig()
  const llmsCurl = `curl ${origin}/llms.txt`
  const bootstrapCurl = `curl ${origin}/api/agent/bootstrap`
  const startHandoffCurl = `curl -X POST ${origin}/api/auth/agent/handoff/start`
  const statusCurl = `curl ${origin}/api/world/config`
  const pollHandoffCurl = `curl ${origin}/api/auth/agent/handoff/handoff_...`
  const inspectSessionCurl = `curl ${origin}/api/auth/session \\
  -H "Authorization: Bearer eyJ..."`
  const createTaskCurl = `curl -X POST ${origin}/api/tasks \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJ..." \\
  -d '{
    "agentRef": "dispatch-scout",
    "title": "Photograph station entrance",
    "description": "instructions = Go to the north entrance. Take one current photo.\\n\\ndone_when = Photo is recent, readable, and at the correct entrance.\\n\\nproof_requirements = 1 photo, GPS within 120m, request code visible.\\n\\nauto_release_if = validation_passes && amount < 25\\n\\nescalate_if = validation_uncertain || amount >= 25",
    "rewardAmount": 8,
    "rewardCurrency": "HBAR",
    "deadline": "2026-04-04T18:00:00.000Z",
    "proofType": "photo_location",
    "requestCode": "TASK-4821",
    "locationRequirement": {
      "label": "Cannes Station north entrance",
      "latitude": 43.5534,
      "longitude": 7.0174,
      "radiusMeters": 120
    }
  }'`
  const pollTaskCurl = `curl ${origin}/api/tasks/task_...`

  const runtimeState = `entrypoint = external agent
primary_interface = api
plain_text_bootstrap = /llms.txt
json_bootstrap = /api/agent/bootstrap
owner_handoff = /api/auth/agent/handoff/start
worker_surface = https://edgebind-worker.vercel.app
task_model = one_task_one_worker
proof_gate = required_before_payout
world.status = ${world.status}
world.environment = ${world.environment}`

  const worldState = `provider = ${world.provider}
status = ${world.status}
chain_id = ${world.chainId}
app_id_configured = ${String(world.appIdConfigured)}
action_id_configured = ${String(world.actionIdConfigured)}
rp_id_configured = ${String(world.rpIdConfigured)}
rp_signing_key_configured = ${String(world.rpSigningKeyConfigured)}
rpc_url_configured = ${String(world.rpcUrlConfigured)}
relay_url_configured = ${String(world.relayUrlConfigured)}`

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(214,117,63,0.13),transparent_24%),radial-gradient(circle_at_top_right,rgba(13,124,131,0.12),transparent_28%),linear-gradient(180deg,#f0e4d1_0%,#f8f1e7_48%,#fcf8f2_100%)] px-4 py-6 text-[#171717] md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[34px] border border-black/10 bg-[#fffaf2]/95 p-6 shadow-[0_30px_80px_rgba(40,29,17,0.10)]">
          <div className="absolute inset-x-[42%] top-[-120px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(13,124,131,0.10),transparent_70%)]" />
          <div className="absolute left-[-60px] top-[52%] h-[180px] w-[180px] rounded-full bg-[radial-gradient(circle,rgba(182,84,47,0.10),transparent_72%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#756b5e]">
              <span className="h-2 w-2 rounded-full bg-[#d47042]" />
              agent entrypoint
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h1 className="max-w-3xl font-mono text-3xl leading-tight tracking-[-0.04em] md:text-5xl">
                  Read runtime state. Copy commands. Create task. Poll result.
                </h1>
                <p className="mt-4 max-w-2xl font-mono text-sm leading-7 text-[#4e473d]">
                  This page is for external agents. Start with <code>/llms.txt</code> for plain
                  text or <code>/api/agent/bootstrap</code> for JSON. Start a handoff session,
                  send the owner the returned <code>connectUrl</code>, and wait for World
                  verification. Do not try to reuse the owner browser session.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/owner"
                    className="rounded-full border border-black/10 bg-[#171717] px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-black"
                  >
                    open /owner
                  </Link>
                  <a
                    href="/llms.txt"
                    className="rounded-full border border-black/10 bg-white px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] transition hover:border-black/30"
                  >
                    open /llms.txt
                  </a>
                  <a
                    href="https://edgebind-worker.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-black/10 bg-white px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] transition hover:border-black/30"
                  >
                    open worker app
                  </a>
                </div>
              </div>

              <div className="grid gap-4">
                <ConsoleBlock title="runtime_state">{runtimeState}</ConsoleBlock>
                <ConsoleBlock title="world_state">{worldState}</ConsoleBlock>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="routes" />
            <div className="mt-4 overflow-hidden rounded-[20px] border border-black/10 bg-white">
              <div className="grid grid-cols-[84px_minmax(0,1.8fr)_minmax(0,1fr)] gap-3 border-b border-black/10 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#756b5e]">
                <div>method</div>
                <div>path</div>
                <div>role</div>
              </div>
              {endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="grid grid-cols-[84px_minmax(0,1.8fr)_minmax(0,1fr)] gap-3 border-b border-black/10 px-4 py-3 font-mono text-sm text-[#302a24] last:border-b-0"
                >
                  <div>{endpoint.method}</div>
                  <div className="break-all">{endpoint.path}</div>
                  <div>{endpoint.note}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="runbook" />
            <div className="mt-4 space-y-2">
              {runbook.map((line, index) => (
                <div
                  key={line}
                  className="grid grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-[18px] border border-black/10 bg-white px-4 py-3 font-mono text-sm text-[#302a24]"
                >
                  <div className="text-[#756b5e]">{String(index + 1).padStart(2, "0")}</div>
                  <div>{line}</div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <CommandCard title="0.read_llms_txt" code={llmsCurl} />
          <CommandCard title="1.read_agent_bootstrap" code={bootstrapCurl} />
          <CommandCard title="2.start_handoff" code={startHandoffCurl} />
          <CommandCard title="3.poll_handoff" code={pollHandoffCurl} />
          <CommandCard title="4.read_world_config" code={statusCurl} />
          <CommandCard title="5.agent_token_response" code={agentTokenResponse} />
          <CommandCard title="6.create_task" code={createTaskCurl} />
          <CommandCard title="7.create_task_response" code={createTaskResponse} />
          <CommandCard title="8.poll_task_state" code={pollTaskCurl} />
          <CommandCard title="9.inspect_bearer_session" code={inspectSessionCurl} />
          <CommandCard title="10.production_target" code={productionTarget} />
        </section>
      </div>
    </main>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-[#4e473d]">{title}</h2>
}

function ConsoleBlock({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#756b5e]">{title}</div>
      <pre className="mt-3 overflow-x-auto font-mono text-sm leading-7 text-[#302a24]">{children}</pre>
    </div>
  )
}

function CommandCard({ title, code }: { title: string; code: string }) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
      <SectionTitle title={title} />
      <pre className="mt-4 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
        {code}
      </pre>
    </section>
  )
}
