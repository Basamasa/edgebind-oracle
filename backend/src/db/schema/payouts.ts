import { real, sqliteTable, text } from "drizzle-orm/sqlite-core"

export type PayoutStatus = "pending_approval" | "released" | "cancelled"

export const payouts = sqliteTable("payouts", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  status: text("status").$type<PayoutStatus>().notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  releasedAt: text("released_at"),
  approvedBy: text("approved_by"),
  approvalNote: text("approval_note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})
