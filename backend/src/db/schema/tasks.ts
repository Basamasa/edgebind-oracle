import { real, sqliteTable, text } from "drizzle-orm/sqlite-core"

export type ProofType = "photo" | "location" | "photo_location"
export type TaskStatus =
  | "open"
  | "accepted"
  | "submitted"
  | "pending_approval"
  | "paid"
  | "rejected"
  | "expired"

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rewardAmount: real("reward_amount").notNull(),
  rewardCurrency: text("reward_currency").notNull(),
  deadline: text("deadline").notNull(),
  proofType: text("proof_type").$type<ProofType>().notNull(),
  locationLabel: text("location_label"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  locationRadiusMeters: real("location_radius_meters"),
  status: text("status").$type<TaskStatus>().notNull(),
  ownerId: text("owner_id").notNull(),
  agentRef: text("agent_ref").notNull(),
  workerId: text("worker_id"),
  requestCode: text("request_code").notNull(),
  approvalThresholdAmount: real("approval_threshold_amount").notNull(),
  acceptedAt: text("accepted_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})
