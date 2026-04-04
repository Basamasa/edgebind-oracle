import { Router } from "express"

import { listUsersHandler } from "../controllers/user.controller"

export const userRouter = Router()

userRouter.get("/", listUsersHandler)
