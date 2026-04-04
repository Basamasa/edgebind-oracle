import { real, sqliteTable, text } from "drizzle-orm/sqlite-core"

export type SubmissionStatus = "submitted" | "valid" | "invalid" | "approved"

export const taskSubmissions = sqliteTable("task_submissions", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  workerId: text("worker_id").notNull(),
  submittedAt: text("submitted_at").notNull(),
  imageUrl: text("image_url"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  locationAccuracyMeters: real("location_accuracy_meters"),
  requestCode: text("request_code").notNull(),
  status: text("status").$type<SubmissionStatus>().notNull(),
  createdAt: text("created_at").notNull(),
})
