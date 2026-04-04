export type UserSummary = {
  id: string
  name: string
  role: "owner" | "worker" | "admin"
  isHumanVerified: boolean
}

export type TaskStatus =
  | "open"
  | "accepted"
  | "submitted"
  | "pending_approval"
  | "paid"
  | "rejected"
  | "expired"

export type ProofType = "photo" | "location" | "photo_location"

export type TaskView = {
  id: string
  title: string
  description: string
  rewardAmount: number
  rewardCurrency: string
  deadline: string
  proofType: ProofType
  locationRequirement: {
    label?: string | null
    latitude: number
    longitude: number
    radiusMeters: number
  } | null
  status: TaskStatus
  owner: UserSummary
  agentRef: string
  worker: UserSummary | null
  requestCode: string
  approvalThresholdAmount: number
  acceptedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  latestSubmission: {
    id: string
    workerId: string
    submittedAt: string
    imageUrl: string | null
    location: {
      latitude: number
      longitude: number
      accuracyMeters?: number | null
    } | null
    requestCode: string
    status: string
  } | null
  validation: {
    valid: boolean
    reason: string
    requiresApproval: boolean
    createdAt: string
  } | null
  payout: {
    status: "pending_approval" | "released" | "cancelled"
    amount: number
    currency: string
    releasedAt: string | null
    approvedBy: string | null
    approvalNote: string | null
  } | null
}
