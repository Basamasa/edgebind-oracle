import { db } from "../db"
import { payouts } from "../db/schema/payouts"
import { taskSubmissions } from "../db/schema/task-submissions"
import { tasks } from "../db/schema/tasks"
import { users } from "../db/schema/users"
import { validationResults } from "../db/schema/validation-results"

const now = new Date()
const iso = (offsetHours: number) =>
  new Date(now.getTime() + offsetHours * 60 * 60 * 1000).toISOString()

export function seedDemoData() {
  const existingUsers = db.select().from(users).all()

  if (existingUsers.length > 0) {
    return
  }

  const timestamp = new Date().toISOString()

  db.insert(users)
    .values([
      {
        id: "owner-ava",
        name: "Ava Agent Ops",
        role: "owner",
        isHumanVerified: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "owner-jules",
        name: "Jules Dispatch",
        role: "owner",
        isHumanVerified: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "worker-lina",
        name: "Lina Verified",
        role: "worker",
        isHumanVerified: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "worker-marcus",
        name: "Marcus Runner",
        role: "worker",
        isHumanVerified: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "admin-rhea",
        name: "Rhea Approver",
        role: "admin",
        isHumanVerified: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ])
    .run()

  db.insert(tasks)
    .values([
      {
        id: "task-open-cannes",
        title: "Take a live photo at the station entrance",
        description:
          "Capture a fresh photo at the main entrance to Cannes station and include the request code in frame notes.",
        rewardAmount: 5,
        rewardCurrency: "USD",
        deadline: iso(6),
        proofType: "photo_location",
        locationLabel: "Cannes Station",
        locationLat: 43.5534,
        locationLng: 7.0174,
        locationRadiusMeters: 120,
        status: "open",
        ownerId: "owner-ava",
        agentRef: "concierge-scout",
        workerId: null,
        requestCode: "CANNES-4832",
        approvalThresholdAmount: 25,
        acceptedAt: null,
        completedAt: null,
        createdAt: iso(-3),
        updatedAt: iso(-3),
      },
      {
        id: "task-accepted-bakery",
        title: "Confirm bakery queue length",
        description:
          "Check the bakery on Rue Meynadier and report whether the queue is under ten people.",
        rewardAmount: 12,
        rewardCurrency: "USD",
        deadline: iso(3),
        proofType: "photo_location",
        locationLabel: "Rue Meynadier",
        locationLat: 43.5518,
        locationLng: 7.0132,
        locationRadiusMeters: 80,
        status: "accepted",
        ownerId: "owner-ava",
        agentRef: "queue-scout",
        workerId: "worker-lina",
        requestCode: "QUEUE-1188",
        approvalThresholdAmount: 25,
        acceptedAt: iso(-1),
        completedAt: null,
        createdAt: iso(-4),
        updatedAt: iso(-1),
      },
      {
        id: "task-pending-approval-market",
        title: "Photograph the farmers market setup",
        description:
          "Submit a location-tagged image showing stalls fully set up before noon.",
        rewardAmount: 75,
        rewardCurrency: "USD",
        deadline: iso(12),
        proofType: "photo_location",
        locationLabel: "Forville Market",
        locationLat: 43.5524,
        locationLng: 7.0101,
        locationRadiusMeters: 100,
        status: "pending_approval",
        ownerId: "owner-ava",
        agentRef: "market-monitor",
        workerId: "worker-marcus",
        requestCode: "MARKET-5501",
        approvalThresholdAmount: 25,
        acceptedAt: iso(-8),
        completedAt: iso(-6),
        createdAt: iso(-12),
        updatedAt: iso(-6),
      },
      {
        id: "task-paid-banner",
        title: "Confirm conference banner placement",
        description:
          "Provide proof that the event banner is still mounted near the beachfront entrance.",
        rewardAmount: 8,
        rewardCurrency: "USD",
        deadline: iso(18),
        proofType: "photo_location",
        locationLabel: "Beachfront entrance",
        locationLat: 43.5499,
        locationLng: 7.0157,
        locationRadiusMeters: 150,
        status: "paid",
        ownerId: "owner-jules",
        agentRef: "banner-checker",
        workerId: "worker-lina",
        requestCode: "BANNER-2744",
        approvalThresholdAmount: 25,
        acceptedAt: iso(-24),
        completedAt: iso(-22),
        createdAt: iso(-30),
        updatedAt: iso(-22),
      },
      {
        id: "task-rejected-kiosk",
        title: "Verify kiosk menu board update",
        description:
          "Capture the new menu board and submit the task request code with the proof.",
        rewardAmount: 15,
        rewardCurrency: "USD",
        deadline: iso(10),
        proofType: "photo",
        locationLabel: null,
        locationLat: null,
        locationLng: null,
        locationRadiusMeters: null,
        status: "rejected",
        ownerId: "owner-jules",
        agentRef: "menu-auditor",
        workerId: "worker-marcus",
        requestCode: "MENU-8410",
        approvalThresholdAmount: 25,
        acceptedAt: iso(-10),
        completedAt: iso(-9),
        createdAt: iso(-14),
        updatedAt: iso(-9),
      },
    ])
    .run()

  db.insert(taskSubmissions)
    .values([
      {
        id: "submission-market",
        taskId: "task-pending-approval-market",
        workerId: "worker-marcus",
        submittedAt: iso(-6),
        imageUrl: "demo://market-proof",
        locationLat: 43.5524,
        locationLng: 7.0102,
        locationAccuracyMeters: 14,
        requestCode: "MARKET-5501",
        status: "valid",
        createdAt: iso(-6),
      },
      {
        id: "submission-banner",
        taskId: "task-paid-banner",
        workerId: "worker-lina",
        submittedAt: iso(-22),
        imageUrl: "demo://banner-proof",
        locationLat: 43.55,
        locationLng: 7.0158,
        locationAccuracyMeters: 9,
        requestCode: "BANNER-2744",
        status: "approved",
        createdAt: iso(-22),
      },
      {
        id: "submission-kiosk",
        taskId: "task-rejected-kiosk",
        workerId: "worker-marcus",
        submittedAt: iso(-9),
        imageUrl: "demo://kiosk-proof",
        locationLat: null,
        locationLng: null,
        locationAccuracyMeters: null,
        requestCode: "WRONG-CODE",
        status: "invalid",
        createdAt: iso(-9),
      },
    ])
    .run()

  db.insert(validationResults)
    .values([
      {
        id: "validation-market",
        submissionId: "submission-market",
        valid: true,
        reason: "Proof matched the task request code and location requirement.",
        requiresApproval: true,
        createdAt: iso(-6),
      },
      {
        id: "validation-banner",
        submissionId: "submission-banner",
        valid: true,
        reason: "Proof met all automatic validation rules.",
        requiresApproval: false,
        createdAt: iso(-22),
      },
      {
        id: "validation-kiosk",
        submissionId: "submission-kiosk",
        valid: false,
        reason: "Request code mismatch.",
        requiresApproval: false,
        createdAt: iso(-9),
      },
    ])
    .run()

  db.insert(payouts)
    .values([
      {
        id: "payout-market",
        taskId: "task-pending-approval-market",
        status: "pending_approval",
        amount: 75,
        currency: "USD",
        releasedAt: null,
        approvedBy: null,
        approvalNote: null,
        createdAt: iso(-6),
        updatedAt: iso(-6),
      },
      {
        id: "payout-banner",
        taskId: "task-paid-banner",
        status: "released",
        amount: 8,
        currency: "USD",
        releasedAt: iso(-22),
        approvedBy: null,
        approvalNote: "Auto-approved below threshold.",
        createdAt: iso(-22),
        updatedAt: iso(-22),
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
        createdAt: iso(-9),
        updatedAt: iso(-9),
      },
    ])
    .run()
}
