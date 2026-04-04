import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"

import { logger } from "../utils/logger"

export class AppError extends Error {
  statusCode: number
  details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.details = details
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`))
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request payload",
      issues: error.issues,
    })
    return
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error.message, error.details)
    }

    res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    })
    return
  }

  logger.error(error.message)

  res.status(500).json({
    error: "Internal server error",
  })
}
