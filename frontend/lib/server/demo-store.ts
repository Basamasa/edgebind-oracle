import "server-only"

import type {
  DemoStore,
  LocationRequirement,
  PayoutRecord,
  SubmissionRecord,
  TaskRecord,
  UserSummary,
  ValidationRecord,
} from "@/lib/domain"

const approvalThresholdAmount = 25
const now = Date.now()

const isoAfterHours = (hours: number) =>
  new Date(now + hours * 60 * 60 * 1000).toISOString()

function createSeedStore(): DemoStore {
  const users: UserSummary[] = [
    { id: "owner-ava", name: "Ava Agent Ops", role: "owner", isHumanVerified: false },
    { id: "owner-jules", name: "Jules Dispatch", role: "owner", isHumanVerified: false },
    { id: "worker-lina", name: "Lina Verified", role: "worker", isHumanVerified: true },
    { id: "worker-marcus", name: "Marcus Runner", role: "worker", isHumanVerified: true },
    { id: "admin-rhea", name: "Rhea Approver", role: "admin", isHumanVerified: true },
  ]

  const cannesStation: LocationRequirement = {
    label: "Cannes Station",
    latitude: 43.5534,
    longitude: 7.0174,
    radiusMeters: 120,
  }

  const tasks: TaskRecord[] = [
    {
      id: "task-open-cannes",
      title: "Take a live photo at the station entrance",
      description:
        "Capture a fresh photo at the main entrance to Cannes station and include the request code in your proof.",
      rewardAmount: 5,
      rewardCurrency: "USD",
      deadline: isoAfterHours(6),
      proofType: "photo_location",
      locationRequirement: cannesStation,
      status: "open",
      ownerId: "owner-ava",
      agentRef: "concierge-scout",
      workerId: null,
      requestCode: "CANNES-4832",
      approvalThresholdAmount,
      acceptedAt: null,
      completedAt: null,
      createdAt: isoAfterHours(-3),
      updatedAt: isoAfterHours(-3),
    },
    {
      id: "task-accepted-bakery",
      title: "Confirm bakery queue length",
      description:
        "Check the bakery on Rue Meynadier and report whether the queue is under ten people.",
      rewardAmount: 12,
      rewardCurrency: "USD",
      deadline: isoAfterHours(3),
      proofType: "photo_location",
      locationRequirement: {
        label: "Rue Meynadier",
        latitude: 43.5518,
        longitude: 7.0132,
        radiusMeters: 80,
      },
      status: "accepted",
      ownerId: "owner-ava",
      agentRef: "queue-scout",
      workerId: "worker-lina",
      requestCode: "QUEUE-1188",
      approvalThresholdAmount,
      acceptedAt: isoAfterHours(-1),
      completedAt: null,
      createdAt: isoAfterHours(-4),
      updatedAt: isoAfterHours(-1),
    },
    {
      id: "task-pending-approval-market",
      title: "Photograph the farmers market setup",
      description:
        "Submit a location-tagged image showing stalls fully set up before noon.",
      rewardAmount: 75,
      rewardCurrency: "USD",
      deadline: isoAfterHours(12),
      proofType: "photo_location",
      locationRequirement: {
        label: "Forville Market",
        latitude: 43.5524,
        longitude: 7.0101,
        radiusMeters: 100,
      },
      status: "pending_approval",
      ownerId: "owner-ava",
      agentRef: "market-monitor",
      workerId: "worker-marcus",
      requestCode: "MARKET-5501",
      approvalThresholdAmount,
      acceptedAt: isoAfterHours(-8),
      completedAt: isoAfterHours(-6),
      createdAt: isoAfterHours(-12),
      updatedAt: isoAfterHours(-6),
    },
    {
      id: "task-paid-banner",
      title: "Confirm conference banner placement",
      description:
        "Provide proof that the event banner is still mounted near the beachfront entrance.",
      rewardAmount: 8,
      rewardCurrency: "USD",
      deadline: isoAfterHours(18),
      proofType: "photo_location",
      locationRequirement: {
        label: "Beachfront entrance",
        latitude: 43.5499,
        longitude: 7.0157,
        radiusMeters: 150,
      },
      status: "paid",
      ownerId: "owner-jules",
      agentRef: "banner-checker",
      workerId: "worker-lina",
      requestCode: "BANNER-2744",
      approvalThresholdAmount,
      acceptedAt: isoAfterHours(-24),
      completedAt: isoAfterHours(-22),
      createdAt: isoAfterHours(-30),
      updatedAt: isoAfterHours(-22),
    },
    {
      id: "task-rejected-kiosk",
      title: "Verify kiosk menu board update",
      description:
        "Capture the new menu board and submit the task request code with the proof.",
      rewardAmount: 15,
      rewardCurrency: "USD",
      deadline: isoAfterHours(10),
      proofType: "photo",
      locationRequirement: null,
      status: "rejected",
      ownerId: "owner-jules",
      agentRef: "menu-auditor",
      workerId: "worker-marcus",
      requestCode: "MENU-8410",
      approvalThresholdAmount,
      acceptedAt: isoAfterHours(-10),
      completedAt: isoAfterHours(-9),
      createdAt: isoAfterHours(-14),
      updatedAt: isoAfterHours(-9),
    },
  ]

  const submissions: SubmissionRecord[] = [
    {
      id: "submission-market",
      taskId: "task-pending-approval-market",
      workerId: "worker-marcus",
      submittedAt: isoAfterHours(-6),
      imageUrl: "demo://market-proof",
      location: { latitude: 43.5524, longitude: 7.0102, accuracyMeters: 14 },
      requestCode: "MARKET-5501",
      status: "valid",
      createdAt: isoAfterHours(-6),
    },
    {
      id: "submission-banner",
      taskId: "task-paid-banner",
      workerId: "worker-lina",
      submittedAt: isoAfterHours(-22),
      imageUrl: "demo://banner-proof",
      location: { latitude: 43.55, longitude: 7.0158, accuracyMeters: 9 },
      requestCode: "BANNER-2744",
      status: "approved",
      createdAt: isoAfterHours(-22),
    },
    {
      id: "submission-kiosk",
      taskId: "task-rejected-kiosk",
      workerId: "worker-marcus",
      submittedAt: isoAfterHours(-9),
      imageUrl: "demo://kiosk-proof",
      location: null,
      requestCode: "WRONG-CODE",
      status: "invalid",
      createdAt: isoAfterHours(-9),
    },
  ]

  const validations: ValidationRecord[] = [
    {
      id: "validation-market",
      submissionId: "submission-market",
      valid: true,
      reason: "Proof matched the request code and location requirement.",
      requiresApproval: true,
      agentDecision: "requires_approval",
      createdAt: isoAfterHours(-6),
    },
    {
      id: "validation-banner",
      submissionId: "submission-banner",
      valid: true,
      reason: "Proof met all automatic validation rules.",
      requiresApproval: false,
      agentDecision: "auto_pay",
      createdAt: isoAfterHours(-22),
    },
    {
      id: "validation-kiosk",
      submissionId: "submission-kiosk",
      valid: false,
      reason: "Request code mismatch.",
      requiresApproval: false,
      agentDecision: null,
      createdAt: isoAfterHours(-9),
    },
  ]

  const payouts: PayoutRecord[] = [
    {
      id: "payout-market",
      taskId: "task-pending-approval-market",
      status: "pending_approval",
      amount: 75,
      currency: "USD",
      releasedAt: null,
      approvedBy: null,
      approvalNote: "Awaiting manual approval above threshold.",
      createdAt: isoAfterHours(-6),
      updatedAt: isoAfterHours(-6),
    },
    {
      id: "payout-banner",
      taskId: "task-paid-banner",
      status: "released",
      amount: 8,
      currency: "USD",
      releasedAt: isoAfterHours(-22),
      approvedBy: null,
      approvalNote: "Auto-approved below threshold.",
      createdAt: isoAfterHours(-22),
      updatedAt: isoAfterHours(-22),
    },
    {
      id: "payout-kiosk",
      taskId: "task-rejected-kiosk",
      status: "cancelled",
      amount: 15,
      currency: "USD",
      releasedAt: null,
      approvedBy: null,
      approvalNote: "Submission failed validation.",
      createdAt: isoAfterHours(-9),
      updatedAt: isoAfterHours(-9),
    },
  ]

  return { users, tasks, submissions, validations, payouts }
}

declare global {
  var __edgebindDemoStore: DemoStore | undefined
}

export function getDemoStore() {
  if (!globalThis.__edgebindDemoStore) {
    globalThis.__edgebindDemoStore = createSeedStore()
  }

  return globalThis.__edgebindDemoStore
}
