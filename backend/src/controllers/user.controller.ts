import type { Request, Response } from "express"

import { userService } from "../services/user.service"

export function listUsersHandler(req: Request, res: Response) {
  const role = typeof req.query.role === "string" ? req.query.role : undefined
  const users = userService.listUsers(role)
  res.json(users)
}
