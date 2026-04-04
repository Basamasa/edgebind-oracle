import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import type { ReactNode } from "react"

import { signInOwnerAction, signOutAction } from "@/app/auth/actions"
import { formatDate, formatMoney, toQueryString } from "@/lib/format"
import { getSessionUser } from "@/lib/server/session"
import { listOwnerTasks, listUsers } from "@/lib/server/task-service"
import { getWorldConfig } from "@/lib/world"
import { getHederaConfig } from "@/lib/server/hedera"
import { WorldOwnerVerify } from "@/components/world-owner-verify"
import { LiveRefresh } from "@/components/live-refresh"
import { AgentTokenPanel } from "@/components/agent-token-panel"

import { approveTaskAction, createTaskAction } from "../app/actions"

function getValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback
  }

  return value ?? fallback
}

function parseContract(description: string) {
  const fields = new Map<string, string>()

  for (const line of description.split("\n")) {
    const trimmed = line.trim()
    const separatorIndex = trimmed.indexOf("=")

    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()

    if (key && value) {
      fields.set(key, value)
    }
  }

  return {
    instructions: fields.get("instructions") ?? "",
    doneWhen: fields.get("done_when") ?? "",
    proofRequirements: fields.get("proof_requirements") ?? "",
    autoReleaseIf: fields.get("auto_release_if") ?? "validation_passes && amount < 25",
    escalateIf: fields.get("escalate_if") ?? "validation_uncertain || amount >= 25",
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "open":
      return "open"
    case "accepted":
      return "accepted by worker"
    case "submitted":
      return "proof submitted"
    case "pending_approval":
      return "needs approval"
    case "paid":
      return "paid"
    case "rejected":
      return "rejected"
    case "expired":
      return "expired"
    default:
      return status
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "open":
      return "border-[#1f4f8a]/15 bg-[#edf4ff] text-[#1f4f8a]"
    case "accepted":
      return "border-[#8f5f12]/15 bg-[#fff4dc] text-[#8f5f12]"
    case "submitted":
      return "border-[#7a3a8f]/15 bg-[#f7e9fb] text-[#7a3a8f]"
    case "pending_approval":
      return "border-[#a2322d]/15 bg-[#ffefec] text-[#a2322d]"
    case "paid":
      return "border-[#0f6f52]/15 bg-[#ebf8f2] text-[#0f6f52]"
    case "rejected":
      return "border-[#8d3c33]/15 bg-[#f8ece9] text-[#8d3c33]"
    case "expired":
      return "border-black/10 bg-[#f2eee8] text-[#756b5e]"
    default:
      return "border-black/10 bg-white text-[#4e473d]"
  }
}

function workerLabel(task: { worker: { id: string } | null }) {
  return task.worker?.id ?? "unassigned"
}

function taskReason(task: {
  validation?: { reason?: string | null } | null
  status: string
}) {
  if (!task.validation?.reason) {
    return task.status === "rejected" ? "Proof failed validation." : null
  }

  return task.validation.reason
}

export default async function OwnerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  noStore()

  const params = await searchParams
  const notice = getValue(params.notice)
  const error = getValue(params.error)
  const sessionUser = await getSessionUser()
  const world = getWorldConfig()
  const hedera = getHederaConfig()
  const isLocalDev = process.env.NODE_ENV !== "production"

  if (!sessionUser || (sessionUser.role !== "owner" && sessionUser.role !== "admin")) {
    return (
      <OwnerEntryGate
        error={error}
        isLocalDev={isLocalDev}
        users={isLocalDev ? await listUsers("owner") : []}
      />
    )
  }

  if (!sessionUser.isHumanVerified) {
    return (
      <main className="min-h-screen bg-[#f3ede3] px-4 py-4 text-[#171717] md:px-6 md:py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-[28px] border border-black/10 bg-[#fffaf2] px-5 py-4 shadow-[0_18px_50px_rgba(40,29,17,0.08)] md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#756b5e]">
                owner verification
              </div>
              <div className="mt-2 font-mono text-sm text-[#4e473d]">
                World verification is required before this owner can create or approve tasks.
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-black/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition hover:border-black/30"
              >
                home
              </Link>
              <form action={signOutAction}>
                <input type="hidden" name="redirectTo" value="/" />
                <button
                  type="submit"
                  className="rounded-full border border-black/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition hover:border-black/30"
                >
                  sign_out
                </button>
              </form>
            </div>
          </header>

          {error ? (
            <div className="rounded-[20px] border border-[#a2322d]/20 bg-[#ffefec] px-4 py-3 font-mono text-xs text-[#a2322d]">
              {error}
            </div>
          ) : null}

          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="World Check" />
            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] border border-black/10 bg-white p-5 font-mono text-sm leading-7 text-[#302a24]">
                owner = {sessionUser.name}
                {"\n"}role = {sessionUser.role}
                {"\n"}identity = local_owner_session
                {"\n"}human_verified = false
                {"\n"}world.status = {world.status}
                {"\n"}world.environment = {world.environment}
              </div>

              <WorldOwnerVerify
                appId={world.appId}
                action={world.action}
                environment={world.environment}
                rpContext={null}
                worldReady={world.status === "configured"}
                userId={sessionUser.id}
              />
            </div>
          </section>
        </div>
      </main>
    )
  }

  const tasks = await listOwnerTasks(sessionUser.id)
  const selectedTaskId = getValue(params.task, tasks[0]?.id ?? "")
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null
  const contract = selectedTask ? parseContract(selectedTask.description) : null
  const needsApproval = tasks.filter((task) => task.status === "pending_approval")
  const activeTasks = tasks.filter((task) =>
    ["open", "accepted", "submitted", "pending_approval"].includes(task.status),
  )

  return (
    <main className="min-h-screen bg-[#f3ede3] px-4 py-4 text-[#171717] md:px-6 md:py-6">
      <LiveRefresh intervalMs={8000} />
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-black/10 bg-[#fffaf2] px-5 py-4 shadow-[0_18px_50px_rgba(40,29,17,0.08)] md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#756b5e]">
              owner control plane
            </div>
            <div className="mt-2 font-mono text-sm text-[#4e473d]">
              create task, review proof, release payout
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-black/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition hover:border-black/30"
            >
              home
            </Link>
            <form action={signOutAction}>
              <input type="hidden" name="redirectTo" value="/" />
              <button
                type="submit"
                className="rounded-full border border-black/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition hover:border-black/30"
              >
                sign_out
              </button>
            </form>
          </div>
        </header>

        {notice ? (
          <div className="rounded-[20px] border border-[#0f6f52]/20 bg-[#ebf8f2] px-4 py-3 font-mono text-xs text-[#0f6f52]">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[20px] border border-[#a2322d]/20 bg-[#ffefec] px-4 py-3 font-mono text-xs text-[#a2322d]">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="open_or_active" value={String(activeTasks.length)} copy="Still moving through execution." />
          <SummaryCard label="needs_approval" value={String(needsApproval.length)} copy="Awaiting release decision." />
          <SummaryCard label="total_tasks" value={String(tasks.length)} copy="Visible to this owner session." />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <SectionTitle title="Task Spec" />

            <form action={createTaskAction} className="mt-5 space-y-4">
              <Field label="objective" hint="What must the human do?">
                <input
                  name="objective"
                  required
                  placeholder="Photograph station entrance"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                />
              </Field>

              <Field label="instructions" hint="Exact execution steps.">
                <textarea
                  name="instructions"
                  required
                  rows={4}
                  placeholder="Go to the north entrance. Take one current photo. Keep the sign and surroundings visible."
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-black/30"
                />
              </Field>

              <Field label="done_when" hint="What must be true for completion to count?">
                <textarea
                  name="done_when"
                  required
                  rows={4}
                  placeholder="Photo is recent, readable, at the correct entrance, and includes the request code."
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-black/30"
                />
              </Field>

              <Field label="proof_type" hint="What evidence must be submitted?">
                <select
                  name="proof_type"
                  defaultValue="photo_location"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                >
                  <option value="photo">photo</option>
                  <option value="location">location</option>
                  <option value="photo_location">photo_location</option>
                </select>
              </Field>

              <Field label="proof_requirements" hint="List the exact proof required.">
                <textarea
                  name="proof_requirements"
                  required
                  rows={3}
                  placeholder="1 photo, GPS within 120m, request code visible in frame."
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-black/30"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="location_label" hint="Where must it happen?">
                  <input
                    name="location_label"
                    placeholder="Cannes Station north entrance"
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
                <Field label="location_lat" hint="Latitude">
                  <input
                    name="location_lat"
                    type="number"
                    step="0.000001"
                    placeholder="43.5534"
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
                <Field label="location_lng" hint="Longitude">
                  <input
                    name="location_lng"
                    type="number"
                    step="0.000001"
                    placeholder="7.0174"
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
                <Field label="location_radius_m" hint="Radius in meters">
                  <input
                    name="location_radius_m"
                    type="number"
                    min="1"
                    placeholder="120"
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="deadline" hint="When does this expire?">
                  <input
                    name="deadline"
                    type="datetime-local"
                    required
                    defaultValue={defaultDeadlineValue()}
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
                <Field label="payout_amount" hint="How much releases if validation passes?">
                  <input
                    name="payout_amount"
                    type="number"
                    min="1"
                    step="0.5"
                    defaultValue="8"
                    required
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
                <Field label="currency" hint="Currency code">
                  <input
                    name="currency"
                    defaultValue={hedera.configured ? "HBAR" : "USD"}
                    required
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
                <Field label="auto_release_if" hint="Rules for automatic payout.">
                  <input
                    name="auto_release_if"
                    defaultValue="validation_passes && amount < 25"
                    required
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
                <Field label="escalate_if" hint="Rules for manual review.">
                  <input
                    name="escalate_if"
                    defaultValue="validation_uncertain || amount >= 25"
                    required
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
                <Field label="agent_ref" hint="Agent identifier">
                  <input
                    name="agent_ref"
                    defaultValue="dispatch-scout"
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
                <Field label="request_code" hint="Optional or auto-generated">
                  <input
                    name="request_code"
                    placeholder="TASK-4821"
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 font-mono text-sm outline-none transition focus:border-black/30"
                  />
                </Field>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-full bg-[#171717] px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-black"
                >
                  create_task
                </button>
              </div>
            </form>
          </section>

          <div className="space-y-6">
            <AgentTokenPanel />

            <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
              <SectionTitle title="System Decision" />
              <pre className="mt-5 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
{`worker_identity = verified_human
validation = deterministic
payout_path = auto_release | manual_approval
risk_threshold = 25 USD
rail = Hedera
manual_layer = runtime_approval(high_risk_only)`}
              </pre>
            </section>

            <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
              <SectionTitle title="Task Output" />
              {selectedTask && contract ? (
                <pre className="mt-5 overflow-x-auto rounded-[20px] border border-black/10 bg-white p-4 font-mono text-sm leading-7 text-[#302a24]">
{`task_id = ${selectedTask.id}
status = ${statusLabel(selectedTask.status)}
assigned_worker = ${workerLabel(selectedTask)}
request_code = ${selectedTask.requestCode}
proof_type = ${selectedTask.proofType}
deadline = ${selectedTask.deadline}
payout_amount = ${selectedTask.rewardAmount} ${selectedTask.rewardCurrency}
validation_reason = ${taskReason(selectedTask) ?? "pending"}
auto_release_if = ${contract.autoReleaseIf}
escalate_if = ${contract.escalateIf}`}
                </pre>
              ) : (
                <EmptyState copy="Create a task to get machine-readable output." />
              )}
            </section>
          </div>
        </section>

        <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
          <SectionTitle title="My Tasks" />
          {tasks.length === 0 ? (
            <div className="mt-5">
              <EmptyState copy="No tasks yet." />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/owner${toQueryString({ task: task.id })}`}
                  className={`block rounded-[24px] border px-4 py-4 transition ${
                    task.id === selectedTask?.id
                      ? "border-black/20 bg-[#f8f0e4]"
                      : "border-black/10 bg-white hover:border-black/20 hover:bg-[#faf4ea]"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8b7d69]">
                        {task.id}
                      </div>
                      <div className="mt-2 text-base leading-6 text-[#221c16]">
                        {task.title}
                      </div>
                    </div>

                    <div
                      className={`inline-flex rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${statusClasses(
                        task.status,
                      )}`}
                    >
                      {statusLabel(task.status)}
                    </div>
                  </div>

	                  <div className="mt-4 grid gap-3 md:grid-cols-4">
	                    <OwnerDatum label="assigned_worker" value={workerLabel(task)} mono />
	                    <OwnerDatum label="proof_type" value={task.proofType} mono />
	                    <OwnerDatum label="payout" value={formatMoney(task.rewardAmount, task.rewardCurrency)} />
	                    <OwnerDatum label="created_at" value={shortDate(task.createdAt)} />
	                  </div>

                    {taskReason(task) ? (
                      <div className="mt-4 rounded-[18px] border border-[#8d3c33]/15 bg-[#f8ece9] px-3 py-3">
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8d3c33]">
                          reason
                        </div>
                        <div className="mt-2 text-sm leading-6 text-[#5f2f28]">{taskReason(task)}</div>
                      </div>
                    ) : null}
	                </Link>
	              ))}
	            </div>
	          )}
	        </section>

        <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
          <SectionTitle title="Task Detail" />
	          {selectedTask && contract ? (
	            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {taskReason(selectedTask) ? (
                  <div className="lg:col-span-2 rounded-[22px] border border-[#8d3c33]/15 bg-[#f8ece9] px-4 py-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8d3c33]">
                      task reason
                    </div>
                    <div className="mt-2 text-sm leading-7 text-[#5f2f28]">
                      {taskReason(selectedTask)}
                    </div>
                  </div>
                ) : null}

	              <DetailBlock
	                title="assignment"
	                lines={[
	                  `status = ${statusLabel(selectedTask.status)}`,
                  `assigned_worker = ${workerLabel(selectedTask)}`,
                  `accepted_at = ${selectedTask.acceptedAt ?? "none"}`,
                  `completed_at = ${selectedTask.completedAt ?? "none"}`,
                ]}
              />
              <DetailBlock
                title="spec"
                lines={[
                  `objective = ${selectedTask.title}`,
                  `instructions = ${contract.instructions || "none"}`,
                  `done_when = ${contract.doneWhen || "none"}`,
                  `proof_requirements = ${contract.proofRequirements || "none"}`,
                ]}
              />
              <DetailBlock
                title="latest_submission"
                lines={[
                  `submitted_at = ${selectedTask.latestSubmission?.submittedAt ?? "none"}`,
                  `asset = ${selectedTask.latestSubmission?.imageUrl ?? "none"}`,
                  `location = ${
                    selectedTask.latestSubmission?.location
                      ? `${selectedTask.latestSubmission.location.latitude.toFixed(4)}, ${selectedTask.latestSubmission.location.longitude.toFixed(4)}`
                      : "none"
                  }`,
                ]}
              />
              <DetailBlock
                title="validation_result"
                lines={[
                  `valid = ${selectedTask.validation?.valid ?? "pending"}`,
                  `reason = ${selectedTask.validation?.reason ?? "none"}`,
                  `agent_decision = ${selectedTask.validation?.agentDecision ?? "pending"}`,
                ]}
              />
              <DetailBlock
                title="payout_state"
                lines={[
                  `status = ${selectedTask.payout?.status ?? "not_started"}`,
                  `amount = ${selectedTask.rewardAmount} ${selectedTask.rewardCurrency}`,
                  `rail = ${selectedTask.payout?.rail ?? "pending"}`,
                  `reference = ${selectedTask.payout?.reference ?? "none"}`,
                  `released_at = ${selectedTask.payout?.releasedAt ?? "none"}`,
                ]}
              />
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState copy="Select a task to inspect detail." />
            </div>
          )}

          {selectedTask?.status === "pending_approval" ? (
            <form action={approveTaskAction} className="mt-5">
              <input type="hidden" name="taskId" value={selectedTask.id} />
              <button
                type="submit"
                className="rounded-full bg-[#171717] px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-black"
              >
                approve_payout
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function OwnerEntryGate({
  isLocalDev,
  users,
  error,
}: {
  isLocalDev: boolean
  users: Array<{ id: string; name: string }>
  error: string
}) {
  return (
    <main className="min-h-screen bg-[#f3ede3] px-4 py-6 text-[#171717]">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-[28px] border border-black/10 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#756b5e]">
            owner entry
          </div>
          <h1 className="mt-4 font-mono text-3xl leading-tight tracking-[-0.04em] text-[#171717] md:text-4xl">
            Owner access requires World verification.
          </h1>
          <div className="mt-4 max-w-2xl font-mono text-sm leading-7 text-[#4e473d]">
            Arrive with a valid owner session, verify the human behind it, then create tasks or
            release high-risk payouts.
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-black/10 bg-white p-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#756b5e]">
                production
              </div>
              <pre className="mt-3 overflow-x-auto font-mono text-sm leading-7 text-[#302a24]">{`1. obtain owner session
2. open /owner
3. complete World verification
4. create task or approve payout`}</pre>
            </div>

            <div className="rounded-[22px] border border-black/10 bg-white p-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#756b5e]">
                required
              </div>
              <pre className="mt-3 overflow-x-auto font-mono text-sm leading-7 text-[#302a24]">{`identity = owner | admin
human_verified = true
session = edgebind_session
dev_picker = hidden_in_production`}</pre>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[20px] border border-[#a2322d]/20 bg-[#ffefec] px-4 py-3 font-mono text-xs text-[#a2322d]">
            {error}
          </div>
        ) : null}

        {isLocalDev ? (
          <section className="rounded-[28px] border border-[#8b7d69]/20 bg-[#fffaf2] p-6 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8b7d69]">
              local dev only
            </div>
            <div className="mt-3 font-mono text-sm text-[#4e473d]">
              Seeded owner sessions are available only for local testing.
            </div>

            <div className="mt-5 space-y-3">
              {users.map((user) => (
                <form key={user.id} action={signInOwnerAction}>
                  <button
                    type="submit"
                    name="userId"
                    value={user.id}
                    className="w-full rounded-[20px] border border-black/10 bg-white px-4 py-4 text-left font-mono text-sm transition hover:border-black/30"
                  >
                    {user.name}
                  </button>
                </form>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-[#4e473d]">{title}</h2>
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-2">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#4e473d]">{label}</div>
      <div className="font-mono text-xs text-[#756b5e]">{hint}</div>
      {children}
    </label>
  )
}

function EmptyState({ copy }: { copy: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-black/10 bg-white px-4 py-5 font-mono text-sm text-[#756b5e]">
      {copy}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  copy,
}: {
  label: string
  value: string
  copy: string
}) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-[#fffaf2] px-4 py-4 shadow-[0_18px_50px_rgba(40,29,17,0.08)]">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#756b5e]">{label}</div>
      <div className="mt-3 text-3xl text-[#221c16]">{value}</div>
      <div className="mt-2 font-mono text-xs leading-6 text-[#756b5e]">{copy}</div>
    </div>
  )
}

function OwnerDatum({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-[18px] border border-black/10 bg-[#fffaf2] px-3 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b7d69]">{label}</div>
      <div className={`mt-2 text-sm text-[#302a24] ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  )
}

function DetailBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-[20px] border border-black/10 bg-white p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#756b5e]">{title}</div>
      <pre className="mt-4 overflow-x-auto font-mono text-sm leading-7 text-[#302a24]">
        {lines.join("\n")}
      </pre>
    </div>
  )
}

function defaultDeadlineValue() {
  const date = new Date(Date.now() + 4 * 60 * 60 * 1000)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  const hour = `${date.getHours()}`.padStart(2, "0")
  const minute = `${date.getMinutes()}`.padStart(2, "0")
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function shortDate(value: string) {
  return formatDate(value)
}
