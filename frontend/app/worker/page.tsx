import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import type { ReactNode } from "react"

import { signInWorkerAction, signOutAction } from "@/app/auth/actions"
import { formatDate, formatMoney, toQueryString } from "@/lib/format"
import { getSessionUser } from "@/lib/server/session"
import { listTasks, listUsers } from "@/lib/server/task-service"
import { LiveRefresh } from "@/components/live-refresh"

import { acceptTaskAction, submitTaskAction } from "../work/actions"

function getValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback
  }

  return value ?? fallback
}

export default async function WorkerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  noStore()

  const params = await searchParams
  const notice = getValue(params.notice)
  const error = getValue(params.error)
  const sessionUser = await getSessionUser()

  if (!sessionUser || sessionUser.role !== "worker" || !sessionUser.isHumanVerified) {
    const workers = (await listUsers("worker")).filter((worker) => worker.isHumanVerified)

    return (
      <AuthGate
        title="web fallback"
        description="Use the worker mobile app for normal execution. This route exists only as a browser fallback for runtime inspection and local testing."
        users={workers}
        formAction={signInWorkerAction}
        error={error}
      />
    )
  }

  const allTasks = await listTasks()
  const availableTasks = allTasks.filter((task) => task.status === "open")
  const activeTasks = allTasks.filter(
    (task) =>
      task.worker?.id === sessionUser.id &&
      ["accepted", "pending_approval", "paid", "rejected"].includes(task.status),
  )
  const workerTasks = [...activeTasks, ...availableTasks]
  const selectedTaskId = getValue(
    params.task,
    activeTasks[0]?.id ?? availableTasks[0]?.id ?? allTasks[0]?.id ?? "",
  )
  const selectedTask =
    workerTasks.find((task) => task.id === selectedTaskId) ??
    allTasks.find((task) => task.id === selectedTaskId) ??
    null
  const activeAcceptedCount = allTasks.filter(
    (task) => task.worker?.id === sessionUser.id && task.status === "accepted",
  ).length
  const releasedCount = allTasks.filter(
    (task) => task.worker?.id === sessionUser.id && task.payout?.status === "released",
  ).length

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#1f3024,transparent_30%),linear-gradient(180deg,#03110a,#020705)] px-6 py-8 text-[#f5f5ed] md:px-12">
      <LiveRefresh intervalMs={8000} />
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">
              Web fallback
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Inspect and submit execution state
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[#cad3c2] md:text-base">
              Signed in as {sessionUser.name}. The mobile app is the primary worker surface. This
              page is only a browser fallback.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[#f5f5ed] transition hover:border-white/40"
            >
              Home
            </Link>
            <Link
              href="/owner"
              className="rounded-full bg-[#d9ff66] px-5 py-2 text-sm font-semibold text-[#071110] transition hover:opacity-90"
            >
              Owner control plane
            </Link>
            <form action={signOutAction}>
              <input type="hidden" name="redirectTo" value="/" />
              <button
                type="submit"
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[#f5f5ed] transition hover:border-white/40"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {notice ? (
          <div className="rounded-2xl border border-[#d9ff66]/40 bg-[#d9ff66]/10 px-4 py-3 text-sm text-[#efffc2]">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ffd7d7]">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Open tasks" value={String(availableTasks.length)} />
          <MetricCard label="Assigned to you" value={String(activeAcceptedCount)} />
          <MetricCard label="Paid out" value={String(releasedCount)} />
          <MetricCard label="Verification" value="Verified human" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">
                  Task queue
                </div>
                <h2 className="mt-2 text-2xl font-semibold">Available and active tasks</h2>
              </div>
              <div className="text-sm text-[#9cb089]">{workerTasks.length} visible</div>
            </div>

            <div className="mt-6 space-y-3">
              {workerTasks.length === 0 ? (
                <EmptyState copy="No tasks are available yet." />
              ) : (
                workerTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/worker${toQueryString({ task: task.id })}`}
                    className={`block rounded-[24px] border px-4 py-4 transition ${
                      task.id === selectedTask?.id
                        ? "border-[#d9ff66]/40 bg-[#d9ff66]/10"
                        : "border-white/10 bg-[#07110b] hover:border-white/30"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <TaskStatusBadge status={task.status} />
                        <div className="text-lg font-semibold">{task.title}</div>
                        <p className="text-sm leading-6 text-[#cad3c2]">{task.description}</p>
                      </div>
                      <div className="text-sm text-[#d9ff66]">
                        {formatMoney(task.rewardAmount, task.rewardCurrency)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">Task detail</div>

            {selectedTask ? (
              <div className="mt-4 space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-3xl font-semibold">{selectedTask.title}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#cad3c2]">
                      {selectedTask.description}
                    </p>
                  </div>
                  <TaskStatusBadge status={selectedTask.status} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DetailCard
                    label="Reward"
                    value={formatMoney(selectedTask.rewardAmount, selectedTask.rewardCurrency)}
                  />
                  <DetailCard
                    label="Proof type"
                    value={selectedTask.proofType.replaceAll("_", " + ")}
                  />
                  <DetailCard label="Request code" value={selectedTask.requestCode} mono />
                  <DetailCard label="Deadline" value={formatDate(selectedTask.deadline)} />
                  <DetailCard label="Owner" value={selectedTask.owner.name} />
                  <DetailCard
                    label="Location"
                    value={selectedTask.locationRequirement?.label ?? "No location lock"}
                  />
                </div>

                {selectedTask.status === "open" ? (
                  <div className="rounded-[24px] border border-white/10 bg-[#07110b] p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">
                      Accept task
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#cad3c2]">
                      This verified worker can claim the task immediately.
                    </p>
                    <form action={acceptTaskAction} className="mt-4 flex justify-end">
                      <input type="hidden" name="taskId" value={selectedTask.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-[#d9ff66] px-6 py-3 text-sm font-semibold text-[#071110] transition hover:opacity-90"
                      >
                        Accept task
                      </button>
                    </form>
                  </div>
                ) : null}

                {selectedTask.status === "accepted" && selectedTask.worker?.id === sessionUser.id ? (
                  <div className="rounded-[24px] border border-white/10 bg-[#07110b] p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">
                      Submit proof
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#cad3c2]">
                      Use the matching request code and include proof required by the task.
                    </p>

                    <form action={submitTaskAction} className="mt-5 grid gap-4">
                      <input type="hidden" name="taskId" value={selectedTask.id} />

                      <Field label="Request code">
                        <input
                          name="requestCode"
                          defaultValue={selectedTask.requestCode}
                          required
                          className="h-12 w-full rounded-2xl border border-white/10 bg-[#03110a] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                        />
                      </Field>

                      <Field label="Image proof">
                        <input
                          name="imageDataUrl"
                          placeholder="live://capture-proof"
                          className="h-12 w-full rounded-2xl border border-white/10 bg-[#03110a] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                        />
                      </Field>

                      <div className="grid gap-4 md:grid-cols-3">
                        <Field label="Latitude">
                          <input
                            name="latitude"
                            type="number"
                            step="0.000001"
                            defaultValue={selectedTask.locationRequirement?.latitude ?? ""}
                            className="h-12 w-full rounded-2xl border border-white/10 bg-[#03110a] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                          />
                        </Field>
                        <Field label="Longitude">
                          <input
                            name="longitude"
                            type="number"
                            step="0.000001"
                            defaultValue={selectedTask.locationRequirement?.longitude ?? ""}
                            className="h-12 w-full rounded-2xl border border-white/10 bg-[#03110a] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                          />
                        </Field>
                        <Field label="Accuracy meters">
                          <input
                            name="accuracyMeters"
                            type="number"
                            min="0"
                            step="1"
                            defaultValue="15"
                            className="h-12 w-full rounded-2xl border border-white/10 bg-[#03110a] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                          />
                        </Field>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="rounded-full bg-[#d9ff66] px-6 py-3 text-sm font-semibold text-[#071110] transition hover:opacity-90"
                        >
                          Submit proof
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-white/10 bg-[#07110b] p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">
                    Validation and payout
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#cad3c2]">
                    {selectedTask.validation?.reason ??
                      "No proof has been submitted yet. Once proof arrives, the agent decides whether to auto-pay or escalate."}
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <DetailCard
                      label="Agent decision"
                      value={
                        selectedTask.validation?.agentDecision
                          ? selectedTask.validation.agentDecision.replaceAll("_", " ")
                          : "Pending validation"
                      }
                    />
                    <DetailCard
                      label="Payout status"
                      value={selectedTask.payout?.status ?? "Not started"}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState copy="Select a task to accept it or inspect its payout state." />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function AuthGate({
  title,
  description,
  users,
  formAction,
  error,
}: {
  title: string
  description: string
  users: Array<{ id: string; name: string }>
  formAction: (formData: FormData) => Promise<void>
  error: string
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#1f3024,transparent_30%),linear-gradient(180deg,#03110a,#020705)] px-6 py-8 text-[#f5f5ed] md:px-12">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20">
        <div className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">{title}</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Start a worker session</h1>
        <p className="mt-4 text-sm leading-7 text-[#cad3c2]">{description}</p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ffd7d7]">
            {error}
          </div>
        ) : null}

        <form action={formAction} className="mt-8 space-y-4">
          {users.map((user) => (
            <button
              key={user.id}
              type="submit"
              name="userId"
              value={user.id}
              className="flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-[#07110b] px-5 py-4 text-left transition hover:border-white/30"
            >
              <span className="font-semibold">{user.name}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-[#9cb089]">
                Sign in
              </span>
            </button>
          ))}
        </form>
      </div>
    </main>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">{label}</div>
      <div className="mt-4 text-3xl font-semibold">{value}</div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">{label}</span>
      {children}
    </label>
  )
}

function DetailCard({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#03110a] p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-[#9cb089]">{label}</div>
      <div className={`mt-3 text-sm text-[#f5f5ed] ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  )
}

function EmptyState({ copy }: { copy: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 px-4 py-6 text-sm leading-7 text-[#9cb089]">
      {copy}
    </div>
  )
}

function TaskStatusBadge({ status }: { status: string }) {
  const className =
    status === "paid"
      ? "bg-[#d9ff66] text-[#071110]"
      : status === "pending_approval"
        ? "bg-[#ffc857] text-[#071110]"
        : status === "rejected"
          ? "bg-[#ef4444] text-white"
          : status === "accepted"
            ? "bg-[#68e0cf] text-[#071110]"
            : "border border-white/10 bg-white/[0.03] text-[#f5f5ed]"

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  )
}
