import { Router } from "express"

import {
  acceptTaskHandler,
  approveTaskHandler,
  createTaskHandler,
  getTaskByIdHandler,
  listTasksHandler,
  submitTaskHandler,
} from "../controllers/task.controller"
import { validateBody } from "../middleware/validate.middleware"
import {
  acceptTaskSchema,
  approveTaskSchema,
  createTaskSchema,
  submitTaskSchema,
} from "../validators/task.validator"

export const taskRouter = Router()

taskRouter.get("/", listTasksHandler)
taskRouter.post("/", validateBody(createTaskSchema), createTaskHandler)
taskRouter.get("/:taskId", getTaskByIdHandler)
taskRouter.post("/:taskId/accept", validateBody(acceptTaskSchema), acceptTaskHandler)
taskRouter.post(
  "/:taskId/submissions",
  validateBody(submitTaskSchema),
  submitTaskHandler,
)
taskRouter.post("/:taskId/approve", validateBody(approveTaskSchema), approveTaskHandler)
