import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import type { ReactNode } from "react"

import { signInOwnerAction, signOutAction } from "@/app/auth/actions"
import { formatDate, formatMoney, toQueryString } from "@/lib/format"
import { getSessionUser } from "@/lib/server/session"
import { listOwnerTasks, listUsers } from "@/lib/server/task-service"

import { approveTaskAction, createTaskAction } from "../app/actions"

function getValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback
  }

  return value ?? fallback
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

  if (!sessionUser || (sessionUser.role !== "owner" && sessionUser.role !== "admin")) {
    const owners = await listUsers("owner")
    return (
      <AuthGate
        title="Owner sign-in"
        description="The owner is the human operator running a human-backed AI agent. Start that session here."
        users={owners}
        formAction={signInOwnerAction}
        error={error}
      />
    )
  }

  const tasks = await listOwnerTasks(sessionUser.id)
  const selectedTaskId = getValue(params.task, tasks[0]?.id ?? "")
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null
  const pendingApprovalTasks = tasks.filter((task) => task.status === "pending_approval")
  const paidTasks = tasks.filter((task) => task.status === "paid")
  const openTasks = tasks.filter((task) => task.status === "open")
  const totalValue = tasks.reduce((sum, task) => sum + task.rewardAmount, 0)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1b3432,transparent_28%),linear-gradient(180deg,#031110,#020707)] px-6 py-8 text-[#f3f5ec] md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
              Agent Owner Dashboard
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Create tasks and release payouts
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[#c3cdc0] md:text-base">
              Signed in as {sessionUser.name}. This role is the human operator behind a
              human-backed AI agent: create tasks, review proof, and approve only the
              high-risk payouts the agent escalates.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[#f3f5ec] transition hover:border-white/40"
            >
              Home
            </Link>
            <Link
              href="/worker"
              className="rounded-full bg-[#d9ff66] px-5 py-2 text-sm font-semibold text-[#071110] transition hover:opacity-90"
            >
              Worker flow
            </Link>
            <form action={signOutAction}>
              <input type="hidden" name="redirectTo" value="/" />
              <button
                type="submit"
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[#f3f5ec] transition hover:border-white/40"
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
          <MetricCard label="Owner tasks" value={String(tasks.length)} />
          <MetricCard label="Open tasks" value={String(openTasks.length)} />
          <MetricCard label="Needs approval" value={String(pendingApprovalTasks.length)} />
          <MetricCard label="Reward value" value={formatMoney(totalValue, "USD")} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
                  Create
                </div>
                <h2 className="mt-2 text-2xl font-semibold">New microtask</h2>
              </div>
              <div className="text-sm text-[#8ea38d]">Agent auto-pays below 25 USD</div>
            </div>

            <form action={createTaskAction} className="mt-6 grid gap-4">
              <Field label="Task title">
                <input
                  name="title"
                  required
                  placeholder="Take a live photo at the station entrance"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#071110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                />
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="Tell the worker what to prove and what a valid proof should contain."
                  className="w-full rounded-2xl border border-white/10 bg-[#071110] px-4 py-3 text-sm outline-none transition focus:border-[#d9ff66]/50"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Reward amount">
                  <input
                    name="rewardAmount"
                    type="number"
                    min="1"
                    step="0.5"
                    defaultValue="5"
                    required
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#071110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                  />
                </Field>
                <Field label="Currency">
                  <input
                    name="rewardCurrency"
                    defaultValue="USD"
                    required
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#071110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                  />
                </Field>
                <Field label="Deadline">
                  <input
                    name="deadline"
                    type="datetime-local"
                    required
                    defaultValue={defaultDeadlineValue()}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#071110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Proof type">
                  <select
                    name="proofType"
                    defaultValue="photo_location"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#071110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                  >
                    <option value="photo">Photo</option>
                    <option value="location">Location</option>
                    <option value="photo_location">Photo + location</option>
                  </select>
                </Field>
                <Field label="Agent ref">
                  <input
                    name="agentRef"
                    defaultValue="dispatch-scout"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#071110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                  />
                </Field>
                <Field label="Request code">
                  <input
                    name="requestCode"
                    placeholder="Auto-generated if blank"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-[#071110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                  />
                </Field>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#071110] p-4">
                <label className="flex items-center gap-3 text-sm font-medium text-[#f3f5ec]">
                  <input
                    type="checkbox"
                    name="useLocationRequirement"
                    defaultChecked
                    className="h-4 w-4 accent-[#d9ff66]"
                  />
                  Require location-bound proof
                </label>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Location label">
                    <input
                      name="locationLabel"
                      defaultValue="Cannes Station"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#031110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                    />
                  </Field>
                  <Field label="Radius (meters)">
                    <input
                      name="radiusMeters"
                      type="number"
                      min="1"
                      defaultValue="120"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#031110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                    />
                  </Field>
                  <Field label="Latitude">
                    <input
                      name="latitude"
                      type="number"
                      step="0.000001"
                      defaultValue="43.5534"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#031110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                    />
                  </Field>
                  <Field label="Longitude">
                    <input
                      name="longitude"
                      type="number"
                      step="0.000001"
                      defaultValue="7.0174"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#031110] px-4 text-sm outline-none transition focus:border-[#d9ff66]/50"
                    />
                  </Field>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-full bg-[#d9ff66] px-6 py-3 text-sm font-semibold text-[#071110] transition hover:opacity-90"
                >
                  Create task
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
                    Approval queue
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold">Manual releases</h2>
                </div>
                <div className="text-sm text-[#8ea38d]">{pendingApprovalTasks.length} waiting</div>
              </div>

              <div className="mt-6 space-y-4">
                {pendingApprovalTasks.length === 0 ? (
                  <EmptyState copy="No high-value tasks are waiting for owner approval." />
                ) : (
                  pendingApprovalTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-[24px] border border-white/10 bg-[#071110] p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <TaskStatusBadge status={task.status} />
                          <div className="text-lg font-semibold">{task.title}</div>
                          <p className="text-sm leading-6 text-[#c3cdc0]">
                            {task.validation?.reason ?? "Awaiting owner review."}
                          </p>
                        </div>
                        <form action={approveTaskAction}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-[#d9ff66] px-5 py-2 text-sm font-semibold text-[#071110] transition hover:opacity-90"
                          >
                            Approve payout
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
                Recently paid
              </div>
              <div className="mt-6 space-y-3">
                {paidTasks.length === 0 ? (
                  <EmptyState copy="No tasks have been paid out yet." />
                ) : (
                  paidTasks.slice(0, 3).map((task) => (
                    <Link
                      key={task.id}
                      href={`/owner${toQueryString({ task: task.id })}`}
                      className="block rounded-[20px] border border-white/10 bg-[#071110] px-4 py-4 transition hover:border-white/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{task.title}</div>
                          <div className="mt-1 text-sm text-[#8ea38d]">
                            {task.worker?.name ?? "Worker unassigned"}
                          </div>
                        </div>
                        <div className="text-sm text-[#d9ff66]">
                          {formatMoney(task.rewardAmount, task.rewardCurrency)}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
                  Inventory
                </div>
                <h2 className="mt-2 text-2xl font-semibold">Owner tasks</h2>
              </div>
              <div className="text-sm text-[#8ea38d]">{tasks.length} total</div>
            </div>

            <div className="mt-6 space-y-3">
              {tasks.length === 0 ? (
                <EmptyState copy="No tasks exist for this owner yet." />
              ) : (
                tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/owner${toQueryString({ task: task.id })}`}
                    className={`block rounded-[24px] border px-4 py-4 transition ${
                      task.id === selectedTask?.id
                        ? "border-[#d9ff66]/40 bg-[#d9ff66]/10"
                        : "border-white/10 bg-[#071110] hover:border-white/30"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <TaskStatusBadge status={task.status} />
                        <div className="text-lg font-semibold">{task.title}</div>
                        <p className="text-sm leading-6 text-[#c3cdc0]">{task.description}</p>
                      </div>
                      <div className="text-sm text-[#8ea38d]">
                        {formatMoney(task.rewardAmount, task.rewardCurrency)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">Detail</div>
            {selectedTask ? (
              <div className="mt-4 space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-3xl font-semibold">{selectedTask.title}</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c3cdc0]">
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
                  <DetailCard label="Worker" value={selectedTask.worker?.name ?? "Unassigned"} />
                </div>

                <div className="rounded-[24px] border border-white/10 bg-[#071110] p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">
                    Validation
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#c3cdc0]">
                    {selectedTask.validation?.reason ?? "No proof has been submitted yet."}
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <DetailCard
                      label="Agent decision"
                      value={
                        selectedTask.validation?.agentDecision
                          ? selectedTask.validation.agentDecision.replaceAll("_", " ")
                          : "No decision yet"
                      }
                    />
                    <DetailCard
                      label="Payout status"
                      value={selectedTask.payout?.status ?? "Not started"}
                    />
                  </div>

                  {selectedTask.latestSubmission ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <DetailCard
                        label="Proof asset"
                        value={selectedTask.latestSubmission.imageUrl ?? "No image supplied"}
                      />
                      <DetailCard
                        label="Proof location"
                        value={
                          selectedTask.latestSubmission.location
                            ? `${selectedTask.latestSubmission.location.latitude.toFixed(4)}, ${selectedTask.latestSubmission.location.longitude.toFixed(4)}`
                            : "No location supplied"
                        }
                      />
                    </div>
                  ) : null}
                </div>

                {selectedTask.status === "pending_approval" ? (
                  <form action={approveTaskAction} className="flex justify-end">
                    <input type="hidden" name="taskId" value={selectedTask.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-[#d9ff66] px-6 py-3 text-sm font-semibold text-[#071110] transition hover:opacity-90"
                    >
                      Approve payout
                    </button>
                  </form>
                ) : null}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState copy="Select a task to inspect its lifecycle details." />
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1b3432,transparent_28%),linear-gradient(180deg,#031110,#020707)] px-6 py-8 text-[#f3f5ec] md:px-12">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20">
        <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">{title}</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Start an owner session</h1>
        <p className="mt-4 text-sm leading-7 text-[#c3cdc0]">{description}</p>

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
              className="flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-[#071110] px-5 py-4 text-left transition hover:border-white/30"
            >
              <span className="font-semibold">{user.name}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-[#8ea38d]">
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
      <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">{label}</div>
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
      <span className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">{label}</span>
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
    <div className="rounded-[20px] border border-white/10 bg-[#071110] p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-[#8ea38d]">{label}</div>
      <div className={`mt-3 text-sm text-[#f3f5ec] ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  )
}

function EmptyState({ copy }: { copy: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 px-4 py-6 text-sm leading-7 text-[#8ea38d]">
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
          : "border border-white/10 bg-white/[0.03] text-[#f3f5ec]"

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {status.replaceAll("_", " ")}
    </span>
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
