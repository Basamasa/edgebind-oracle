import Link from "next/link"

import { getWorldConfig } from "@/lib/world"

const endpoints = [
  { method: "GET", path: "/api/world/config", note: "read current World AgentKit status" },
  { method: "POST", path: "/api/world/rp-signature", note: "mint a signed RP context for World verification" },
  { method: "POST", path: "/api/world/verify", note: "verify the World proof and upgrade owner identity" },
  { method: "POST", path: "/api/auth/dev/session", note: "local dev: mint signed session cookie" },
  { method: "GET", path: "/api/auth/session", note: "inspect current identity and cookie session" },
  { method: "POST", path: "/api/tasks", note: "create task as verified owner session" },
  { method: "GET", path: "/api/tasks/:taskId", note: "read task state" },
  { method: "POST", path: "/api/tasks/:taskId/accept", note: "accept as verified worker session" },
  { method: "POST", path: "/api/tasks/:taskId/submissions", note: "submit proof as verified worker session" },
  { method: "POST", path: "/api/tasks/:taskId/approve", note: "approve high-risk payout as owner/admin" },
]

const protocol = [
  "read /api/world/config",
  "bootstrap owner session in local dev",
  "human behind the agent opens /owner and verifies with World",
  "confirm identity.humanVerified = true",
  "call POST /api/tasks",
  "verified human accepts",
  "verified human submits proof",
  "runtime validates proof",
  "low-risk pays automatically",
  "high-risk waits for approval",
]

const readConfigExample = `curl http://localhost:3000/api/world/config`

const devAuthExample = `curl -X POST http://localhost:3000/api/auth/dev/session \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{"userId":"owner-ava"}'`

const sessionExample = `curl http://localhost:3000/api/auth/session \\
  -b cookies.txt`

const ownerVerifyExample = `open http://localhost:3000/owner

# sign in as the owner session
# tap verify_with_world
# approve in World App
# then re-run GET /api/auth/session and confirm:
# identity.humanVerified = true`

const createTaskExample = `curl -X POST http://localhost:3000/api/tasks \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{
    "agentRef": "dispatch-scout",
    "title": "Photograph station entrance",
    "description": "instructions = Go to the north entrance. Take one current photo.\\n\\ndone_when = Photo is recent, readable, and at the correct entrance.\\n\\nproof_requirements = 1 photo, GPS within 120m, request code visible.\\n\\nauto_release_if = validation_passes && amount < 25\\n\\nescalate_if = validation_uncertain || amount >= 25",
    "rewardAmount": 8,
    "rewardCurrency": "USD",
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

const createTaskResponse = `{
  "id": "task_...",
  "status": "open",
  "requestCode": "TASK-4821",
  "proofType": "photo_location",
  "rewardAmount": 8,
  "rewardCurrency": "USD"
}`

const worldTargetExample = `npx @worldcoin/agentkit-cli register <agent-wallet-address>

# complete verification in World App
# register once per wallet
# target identity = verified human behind agent wallet`

export default function Home() {
  const world = getWorldConfig()
  const currentVsTarget = `today.auth = dev_session_cookie
today.cookie = edgebind_session
today.owner_model = local owner session
today.worker_model = verified human executor
target.identity = World AgentKit
target.owner_model = verified human behind agent wallet
target.worker_model = verified human executor
world.status = ${world.status}
world.chain_id = ${world.chainId}`

  const worldStatus = `provider = ${world.provider}
status = ${world.status}
environment = ${world.environment}
chain_id = ${world.chainId}
app_id_configured = ${String(world.appIdConfigured)}
action_id_configured = ${String(world.actionIdConfigured)}
rp_id_configured = ${String(world.rpIdConfigured)}
rp_signing_key_configured = ${String(world.rpSigningKeyConfigured)}
rpc_url_configured = ${String(world.rpcUrlConfigured)}
relay_url_configured = ${String(world.relayUrlConfigured)}
agentbook_address = ${world.agentBookAddress ?? "unset"}`

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#efe4d2_0%,#f7f0e5_46%,#fbf7f2_100%)] px-4 py-6 text-[#171717] md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[32px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_24px_60px_rgba(40,29,17,0.08)]">
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#756b5e]">
            agent bootstrap
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="font-mono text-3xl leading-tight md:text-5xl">
                Load this page. Copy the commands. Create the task.
              </h1>
              <p className="mt-4 max-w-3xl font-mono text-sm leading-7 text-[#4e473d]">
                Edgebind is API-first. In local dev, bootstrap a signed cookie. In production,
                owner identity should move to a World AgentKit-backed wallet.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/owner"
                  className="rounded-full border border-black/10 bg-white px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] transition hover:border-black/30"
                >
                  Open manual console
                </Link>
                <Link
                  href="/worker"
                  className="rounded-full border border-black/10 bg-white px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] transition hover:border-black/30"
                >
                  Open temporary worker flow
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <ConsoleBlock title="runtime">
                {currentVsTarget}
              </ConsoleBlock>
              <ConsoleBlock title="world">
                {worldStatus}
              </ConsoleBlock>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="Endpoints" />
            <div className="mt-4 overflow-hidden rounded-[20px] border border-black/10 bg-white">
              <div className="grid grid-cols-[84px_minmax(0,1.75fr)_minmax(0,1.35fr)] gap-3 border-b border-black/10 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#756b5e]">
                <div>method</div>
                <div>path</div>
                <div>note</div>
              </div>
              {endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="grid grid-cols-[84px_minmax(0,1.75fr)_minmax(0,1.35fr)] gap-3 border-b border-black/10 px-4 py-3 font-mono text-sm text-[#302a24] last:border-b-0"
                >
                  <div>{endpoint.method}</div>
                  <div className="break-all">{endpoint.path}</div>
                  <div>{endpoint.note}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="Protocol" />
            <div className="mt-4 space-y-2">
              {protocol.map((line, index) => (
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
          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="0. Read Current World Config" />
            <pre className="mt-4 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
              {readConfigExample}
            </pre>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="1. Bootstrap Local Dev Auth" />
            <pre className="mt-4 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
              {devAuthExample}
            </pre>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="2. Inspect Session Identity" />
            <pre className="mt-4 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
              {sessionExample}
            </pre>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="3. Verify Owner With World" />
            <pre className="mt-4 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
              {ownerVerifyExample}
            </pre>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="4. Create Task" />
            <pre className="mt-4 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
              {createTaskExample}
            </pre>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="5. Expected Create Response" />
            <pre className="mt-4 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
              {createTaskResponse}
            </pre>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="6. World AgentKit Target Path" />
            <pre className="mt-4 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
              {worldTargetExample}
            </pre>
            <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.16em] text-[#756b5e]">
              <a
                href={world.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/10 bg-white px-4 py-2 transition hover:border-black/30"
              >
                agentkit repo
              </a>
              <a
                href={world.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/10 bg-white px-4 py-2 transition hover:border-black/30"
              >
                sdk docs
              </a>
              <a
                href={world.worldAppUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/10 bg-white px-4 py-2 transition hover:border-black/30"
              >
                world app
              </a>
            </div>
          </section>
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
