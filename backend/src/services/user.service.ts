import { eq } from "drizzle-orm"

import { db } from "../db"
import { users, type UserRole } from "../db/schema/users"

class UserService {
  listUsers(role?: string) {
    const rows = role
      ? db.select().from(users).where(eq(users.role, role as UserRole)).all()
      : db.select().from(users).all()

    return rows.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      isHumanVerified: user.isHumanVerified,
    }))
  }
}

export const userService = new UserService()
