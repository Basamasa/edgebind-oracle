"use client"

import Link from "next/link"
import { type ReactNode, useEffect, useMemo, useState, useTransition } from "react"

import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/lib/api"
import type { ProofType, TaskView, UserSummary } from "@/lib/types"

type CreateTaskFormState = {
  title: string
  description: string
  rewardAmount: string
  rewardCurrency: string
  deadlineLocal: string
  proofType: ProofType
  agentRef: string
  requestCode: string
  useLocationRequirement: boolean
  locationLabel: string
  latitude: string
  longitude: string
  radiusMeters: string
}

const initialFormState: CreateTaskFormState = {
  title: "",
  description: "",
  rewardAmount: "5",
  rewardCurrency: "USD",
  deadlineLocal: addHoursToLocalInput(4),
  proofType: "photo_location",
  agentRef: "concierge-scout",
  requestCode: "",
  useLocationRequirement: true,
  locationLabel: "Cannes Station",
  latitude: "43.5534",
  longitude: "7.0174",
  radiusMeters: "120",
}

export function OwnerDashboard() {
  const [owners, setOwners] = useState<UserSummary[]>([])
  const [selectedOwnerId, setSelectedOwnerId] = useState("")
  const [tasks, setTasks] = useState<TaskView[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateTaskFormState>(initialFormState)
  const [error, setError] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSaving, startSavingTransition] = useTransition()
  const [isApproving, startApprovingTransition] = useTransition()

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const ownerList = await apiFetch<UserSummary[]>("/users?role=owner")
        if (!active) {
          return
        }

        setOwners(ownerList)
        setSelectedOwnerId((current) => current || ownerList[0]?.id || "")
      } catch (bootstrapError) {
        if (!active) {
          return
        }

        setError(
          bootstrapError instanceof Error
            ? bootstrapError.message
            : "Failed to load owners.",
        )
      } finally {
        if (active) {
          setIsBootstrapping(false)
        }
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedOwnerId) {
      return
    }

    let active = true

    async function loadTasks() {
      try {
        const ownerTasks = await apiFetch<TaskView[]>(
          `/owners/${selectedOwnerId}/tasks`,
        )
        if (!active) {
          return
        }

        setTasks(ownerTasks)
        setSelectedTaskId((current) =>
          current && ownerTasks.some((task) => task.id === current)
            ? current
            : ownerTasks[0]?.id ?? null,
        )
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error ? loadError.message : "Failed to load tasks.",
        )
      }
    }

    loadTasks()

    return () => {
      active = false
    }
  }, [selectedOwnerId])

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null

  const pendingApprovalTasks = useMemo(
    () => tasks.filter((task) => task.status === "pending_approval"),
    [tasks],
  )

  const stats = useMemo(() => {
    const totalReward = tasks.reduce((sum, task) => sum + task.rewardAmount, 0)

    return {
      total: tasks.length,
      open: tasks.filter((task) => task.status === "open").length,
      pendingApproval: pendingApprovalTasks.length,
      paid: tasks.filter((task) => task.status === "paid").length,
      totalReward,
    }
  }, [pendingApprovalTasks.length, tasks])

  async function refreshTasks(ownerId: string) {
    const ownerTasks = await apiFetch<TaskView[]>(`/owners/${ownerId}/tasks`)
    setTasks(ownerTasks)
    setSelectedTaskId((current) =>
      current && ownerTasks.some((task) => task.id === current)
        ? current
        : ownerTasks[0]?.id ?? null,
    )
  }

  function handleCreateTask() {
    if (!selectedOwnerId) {
      setError("Select an owner before creating a task.")
      return
    }

    setError(null)

    startSavingTransition(async () => {
      try {
        const payload = {
          ownerId: selectedOwnerId,
          agentRef: form.agentRef,
          title: form.title,
          description: form.description,
          rewardAmount: Number(form.rewardAmount),
          rewardCurrency: form.rewardCurrency,
          deadline: new Date(form.deadlineLocal).toISOString(),
          proofType: form.proofType,
          requestCode: form.requestCode || undefined,
          locationRequirement: form.useLocationRequirement
            ? {
                label: form.locationLabel || undefined,
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
                radiusMeters: Number(form.radiusMeters),
              }
            : undefined,
        }

        const createdTask = await apiFetch<TaskView>("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        })

        const refreshedTasks = [createdTask, ...tasks.filter((task) => task.id !== createdTask.id)]
        setTasks(refreshedTasks)
        setSelectedTaskId(createdTask.id)
        setForm({
          ...initialFormState,
          agentRef: form.agentRef,
        })
      } catch (saveError) {
        setError(
          saveError instanceof Error ? saveError.message : "Failed to create task.",
        )
      }
    })
  }

  function handleApproveTask(taskId: string) {
    setError(null)

    startApprovingTransition(async () => {
      try {
        await apiFetch<TaskView>(`/tasks/${taskId}/approve`, {
          method: "POST",
          body: JSON.stringify({
            approverId: selectedOwnerId,
            approvalNote: "Approved in the owner dashboard.",
          }),
        })

        await refreshTasks(selectedOwnerId)
      } catch (approvalError) {
        setError(
          approvalError instanceof Error
            ? approvalError.message
            : "Failed to approve task payout.",
        )
      }
    })
  }

  if (isBootstrapping) {
    return (
      <main className="min-h-screen bg-[#0c0c0c] px-6 py-10 text-white md:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-white/60">Loading owner workspace...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0c0c0c] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 md:px-12">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Link href="/" className="text-sm text-white/60 transition hover:text-white">
              Back to landing
            </Link>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Human-backed task ops
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-white/60 md:text-base">
              Create microtasks, monitor worker proof, and approve higher-value
              payouts from one owner console.
            </p>
          </div>

          <div className="flex min-w-[220px] flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/40">
              Owner
            </span>
            <Select
              value={selectedOwnerId}
              onValueChange={(nextOwnerId) => {
                setSelectedOwnerId(nextOwnerId)
                setError(null)
              }}
            >
              <SelectTrigger className="w-full border-white/15 bg-white/5 text-white">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-[#D21056]/40 bg-[#D21056]/10 px-4 py-3 text-sm text-white">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Owner Tasks" value={stats.total.toString()} />
          <MetricCard label="Open" value={stats.open.toString()} />
          <MetricCard
            label="Needs Approval"
            value={stats.pendingApproval.toString()}
          />
          <MetricCard label="Paid" value={stats.paid.toString()} />
          <MetricCard
            label="Reward Value"
            value={`${stats.totalReward.toFixed(0)} USD`}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Create a new microtask</CardTitle>
              <CardDescription>
                Tasks at or above 25 USD will route to manual approval after
                successful validation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Task title"
                  input={
                    <Input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Take a live photo at the station entrance"
                    />
                  }
                />
                <Field
                  label="Agent reference"
                  input={
                    <Input
                      value={form.agentRef}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          agentRef: event.target.value,
                        }))
                      }
                      placeholder="concierge-scout"
                    />
                  }
                />
              </div>

              <Field
                label="Description"
                input={
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Tell the worker what needs to be proven."
                    rows={5}
                  />
                }
              />

              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="Reward amount"
                  input={
                    <Input
                      type="number"
                      min="1"
                      step="0.5"
                      value={form.rewardAmount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          rewardAmount: event.target.value,
                        }))
                      }
                    />
                  }
                />
                <Field
                  label="Currency"
                  input={
                    <Input
                      value={form.rewardCurrency}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          rewardCurrency: event.target.value.toUpperCase(),
                        }))
                      }
                    />
                  }
                />
                <Field
                  label="Deadline"
                  input={
                    <Input
                      type="datetime-local"
                      value={form.deadlineLocal}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          deadlineLocal: event.target.value,
                        }))
                      }
                    />
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Proof type"
                  input={
                    <Select
                      value={form.proofType}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          proofType: value as ProofType,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="photo_location">
                          Photo + location
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                <Field
                  label="Request code"
                  input={
                    <Input
                      value={form.requestCode}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          requestCode: event.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Auto-generated if blank"
                    />
                  }
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.useLocationRequirement}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        useLocationRequirement: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#D21056]"
                  />
                  Require location-bound proof
                </label>

                {form.useLocationRequirement ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field
                      label="Location label"
                      input={
                        <Input
                          value={form.locationLabel}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              locationLabel: event.target.value,
                            }))
                          }
                          placeholder="Forville Market"
                        />
                      }
                    />
                    <Field
                      label="Radius (meters)"
                      input={
                        <Input
                          type="number"
                          min="1"
                          value={form.radiusMeters}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              radiusMeters: event.target.value,
                            }))
                          }
                        />
                      }
                    />
                    <Field
                      label="Latitude"
                      input={
                        <Input
                          type="number"
                          step="0.000001"
                          value={form.latitude}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              latitude: event.target.value,
                            }))
                          }
                        />
                      }
                    />
                    <Field
                      label="Longitude"
                      input={
                        <Input
                          type="number"
                          step="0.000001"
                          value={form.longitude}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              longitude: event.target.value,
                            }))
                          }
                        />
                      }
                    />
                  </div>
                ) : null}
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t border-white/10 pt-6">
              <p className="text-sm text-white/50">
                Low-value tasks auto-pay when proof validates.
              </p>
              <Button
                onClick={handleCreateTask}
                disabled={isSaving || !selectedOwnerId}
                className="bg-[linear-gradient(90deg,#D21056_0%,#FF6B35_100%)] text-white hover:opacity-90"
              >
                {isSaving ? "Creating..." : "Create task"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Approval queue</CardTitle>
              <CardDescription>
                Review high-value tasks that already passed automated proof
                checks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingApprovalTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/50">
                  No tasks currently require manual approval.
                </div>
              ) : (
                pendingApprovalTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={task.status} />
                          <span className="text-xs text-white/40">
                            {task.rewardAmount} {task.rewardCurrency}
                          </span>
                        </div>
                        <div className="text-base font-semibold">{task.title}</div>
                        <p className="text-sm leading-6 text-white/60">
                          {task.validation?.reason ?? "Awaiting owner review."}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleApproveTask(task.id)}
                        disabled={isApproving}
                        className="bg-[linear-gradient(90deg,#D21056_0%,#FF6B35_100%)] text-white hover:opacity-90"
                      >
                        {isApproving ? "Approving..." : "Approve payout"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Owner task inventory</CardTitle>
            <CardDescription>
              Monitor task state, proof validation, and payout outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="gap-6">
              <TabsList className="bg-white/5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="approval">Needs Approval</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <TaskPanels
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                  selectedTask={selectedTask}
                />
              </TabsContent>
              <TabsContent value="open">
                <TaskPanels
                  tasks={tasks.filter((task) => task.status === "open")}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                  selectedTask={selectedTask}
                />
              </TabsContent>
              <TabsContent value="approval">
                <TaskPanels
                  tasks={pendingApprovalTasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                  selectedTask={selectedTask}
                />
              </TabsContent>
              <TabsContent value="paid">
                <TaskPanels
                  tasks={tasks.filter((task) => task.status === "paid")}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                  selectedTask={selectedTask}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function TaskPanels({
  tasks,
  selectedTaskId,
  onSelectTask,
  selectedTask,
}: {
  tasks: TaskView[]
  selectedTaskId: string | null
  onSelectTask: (taskId: string) => void
  selectedTask: TaskView | null
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-sm text-white/50">
            No tasks in this segment yet.
          </div>
        ) : (
          tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                task.id === selectedTaskId
                  ? "border-[#D21056]/60 bg-[#D21056]/10"
                  : "border-white/10 bg-black/20 hover:border-white/30"
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} />
                    <span className="text-xs text-white/40">{task.agentRef}</span>
                  </div>
                  <div className="text-base font-semibold">{task.title}</div>
                  <p className="text-sm leading-6 text-white/60">{task.description}</p>
                </div>
                <div className="space-y-1 text-right text-sm text-white/60">
                  <div>
                    {task.rewardAmount} {task.rewardCurrency}
                  </div>
                  <div>Due {formatDate(task.deadline)}</div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <TaskDetailCard task={selectedTask} />
    </div>
  )
}

function TaskDetailCard({ task }: { task: TaskView | null }) {
  if (!task) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-sm text-white/50">
        Select a task to inspect proof and payout details.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">
            Task detail
          </div>
          <h3 className="mt-2 text-2xl font-semibold">{task.title}</h3>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="mt-5 space-y-3 text-sm text-white/70">
        <DetailRow label="Owner" value={task.owner.name} />
        <DetailRow label="Agent" value={task.agentRef} />
        <DetailRow
          label="Reward"
          value={`${task.rewardAmount} ${task.rewardCurrency}`}
        />
        <DetailRow label="Proof type" value={task.proofType.replaceAll("_", " + ")} />
        <DetailRow label="Request code" value={task.requestCode} mono />
        <DetailRow label="Deadline" value={formatDate(task.deadline)} />
        <DetailRow
          label="Worker"
          value={task.worker ? task.worker.name : "Unassigned"}
        />
        <DetailRow
          label="Location"
          value={
            task.locationRequirement
              ? `${task.locationRequirement.label ?? "Pinned location"} • ${task.locationRequirement.radiusMeters}m`
              : "Not required"
          }
        />
      </div>

      <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-white/40">
          Validation
        </div>
        <p className="text-sm leading-6 text-white/70">
          {task.validation?.reason ?? "No submission received yet."}
        </p>
        <DetailRow
          label="Requires approval"
          value={task.validation?.requiresApproval ? "Yes" : "No"}
        />
        <DetailRow
          label="Payment status"
          value={task.payout?.status ?? "Not started"}
        />
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardContent className="space-y-2 pt-6">
        <div className="text-xs uppercase tracking-[0.18em] text-white/40">
          {label}
        </div>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  input,
}: {
  label: string
  input: ReactNode
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </span>
      {input}
    </label>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2 last:border-b-0">
      <span className="text-white/40">{label}</span>
      <span className={mono ? "font-mono text-xs text-white" : "text-right text-white"}>
        {value}
      </span>
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function addHoursToLocalInput(hours: number) {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  const hour = `${date.getHours()}`.padStart(2, "0")
  const minute = `${date.getMinutes()}`.padStart(2, "0")
  return `${year}-${month}-${day}T${hour}:${minute}`
}
