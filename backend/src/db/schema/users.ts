import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export type UserRole = "owner" | "worker" | "admin"

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").$type<UserRole>().notNull(),
  isHumanVerified: integer("is_human_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})
