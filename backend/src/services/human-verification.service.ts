import { eq } from "drizzle-orm"

import { db } from "../db"
import { users } from "../db/schema/users"
import { AppError } from "../middleware/error.middleware"

class HumanVerificationService {
  assertVerifiedWorker(workerId: string) {
    const worker = db.select().from(users).where(eq(users.id, workerId)).get()

    if (!worker) {
      throw new AppError(404, `Worker ${workerId} was not found`)
    }

    if (worker.role !== "worker") {
      throw new AppError(400, `${worker.name} is not a worker`)
    }

    if (!worker.isHumanVerified) {
      throw new AppError(403, `${worker.name} is not human-verified`)
    }

    return worker
  }
}

export const humanVerificationService = new HumanVerificationService()
