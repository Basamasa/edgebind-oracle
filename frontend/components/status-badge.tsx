"use client"

import { Badge } from "@/components/ui/badge"

type Status =
  | "open"
  | "accepted"
  | "submitted"
  | "pending_approval"
  | "paid"
  | "rejected"
  | "expired"

const variantByStatus: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  accepted: "secondary",
  submitted: "secondary",
  pending_approval: "default",
  paid: "default",
  rejected: "destructive",
  expired: "outline",
}

const labelByStatus: Record<Status, string> = {
  open: "Open",
  accepted: "Accepted",
  submitted: "Submitted",
  pending_approval: "Pending Approval",
  paid: "Paid",
  rejected: "Rejected",
  expired: "Expired",
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant={variantByStatus[status]}
      className={status === "paid" || status === "pending_approval" ? "bg-accent text-accent-foreground border-transparent" : ""}
    >
      {labelByStatus[status]}
    </Badge>
  )
}
