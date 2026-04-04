export type UserRole = "owner" | "worker" | "admin"

export type ProofType = "photo" | "location" | "photo_location"

export type TaskStatus =
  | "open"
  | "accepted"
  | "submitted"
  | "pending_approval"
  | "paid"
  | "rejected"
  | "expired"

export type SubmissionStatus = "submitted" | "valid" | "invalid" | "approved"

export type PayoutStatus = "pending_approval" | "released" | "cancelled"

export type AgentDecision = "auto_pay" | "requires_approval"

export type UserSummary = {
  id: string
  name: string
  role: UserRole
  isHumanVerified: boolean
  payoutAccountId?: string | null
}

export type LocationRequirement = {
  label?: string | null
  latitude: number
  longitude: number
  radiusMeters: number
}

export type TaskRecord = {
  id: string
  title: string
  description: string
  rewardAmount: number
  rewardCurrency: string
  deadline: string
  proofType: ProofType
  locationRequirement: LocationRequirement | null
  status: TaskStatus
  ownerId: string
  agentRef: string
  workerId: string | null
  requestCode: string
  approvalThresholdAmount: number
  acceptedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SubmissionRecord = {
  id: string
  taskId: string
  workerId: string
  submittedAt: string
  imageUrl: string | null
  location:
    | {
        latitude: number
        longitude: number
        accuracyMeters: number | null
      }
    | null
  requestCode: string
  status: SubmissionStatus
  createdAt: string
}

export type ValidationRecord = {
  id: string
  submissionId: string
  valid: boolean
  reason: string
  requiresApproval: boolean
  agentDecision: AgentDecision | null
  createdAt: string
}

export type PayoutRecord = {
  id: string
  taskId: string
  status: PayoutStatus
  amount: number
  currency: string
  rail: "internal" | "hedera"
  reference: string | null
  releasedAt: string | null
  approvedBy: string | null
  approvalNote: string | null
  createdAt: string
  updatedAt: string
}

export type TaskView = {
  id: string
  title: string
  description: string
  rewardAmount: number
  rewardCurrency: string
  deadline: string
  proofType: ProofType
  locationRequirement: LocationRequirement | null
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
  latestSubmission:
    | {
        id: string
        workerId: string
        submittedAt: string
        imageUrl: string | null
        location: SubmissionRecord["location"]
        requestCode: string
        status: SubmissionStatus
      }
    | null
  validation:
    | {
        valid: boolean
        reason: string
        requiresApproval: boolean
        agentDecision: AgentDecision | null
        createdAt: string
      }
    | null
  payout:
    | {
        status: PayoutStatus
      amount: number
      currency: string
      rail: PayoutRecord["rail"]
      reference: string | null
      releasedAt: string | null
      approvedBy: string | null
      approvalNote: string | null
    }
    | null
}

export type DemoStore = {
  users: UserSummary[]
  tasks: TaskRecord[]
  submissions: SubmissionRecord[]
  validations: ValidationRecord[]
  payouts: PayoutRecord[]
}
