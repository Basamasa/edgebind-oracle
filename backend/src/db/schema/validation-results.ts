import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const validationResults = sqliteTable("validation_results", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id").notNull(),
  valid: integer("valid", { mode: "boolean" }).notNull(),
  reason: text("reason").notNull(),
  requiresApproval: integer("requires_approval", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
})
