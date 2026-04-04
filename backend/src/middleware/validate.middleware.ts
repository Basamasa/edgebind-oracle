import type { NextFunction, Request, Response } from "express"
import type { ZodTypeAny } from "zod"

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req.body)
    req.body = parsed
    next()
  }
}
