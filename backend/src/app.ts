import express from "express"

import { env } from "./config/env"
import { initializeDatabase } from "./db"
import { errorHandler, notFoundHandler } from "./middleware/error.middleware"
import { apiRouter } from "./routes"
import { logger } from "./utils/logger"

initializeDatabase()

export function createApp() {
  const app = express()

  app.use((req, res, next) => {
    const origin = env.FRONTEND_ORIGIN
    res.header("Access-Control-Allow-Origin", origin === "*" ? "*" : origin)
    res.header("Access-Control-Allow-Headers", "Content-Type")
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")

    if (req.method === "OPTIONS") {
      res.sendStatus(204)
      return
    }

    next()
  })

  app.use(express.json({ limit: "12mb" }))

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "edgebind-backend",
      timestamp: new Date().toISOString(),
    })
  })

  app.use("/api", apiRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)

  logger.info(`configured backend for ${env.NODE_ENV}`)

  return app
}
