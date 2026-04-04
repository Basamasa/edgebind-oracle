import { Router } from "express"

import { listOwnerTasksHandler } from "../controllers/task.controller"
import { taskRouter } from "./task.routes"
import { userRouter } from "./user.routes"

export const apiRouter = Router()

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
})

apiRouter.use("/tasks", taskRouter)
apiRouter.use("/users", userRouter)
apiRouter.get("/owners/:ownerId/tasks", listOwnerTasksHandler)
