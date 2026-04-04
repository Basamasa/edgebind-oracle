import dotenv from "dotenv"
import { z } from "zod"

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_URL: z.string().min(1).default("./edgebind.db"),
  FRONTEND_ORIGIN: z.string().default("*"),
  APPROVAL_THRESHOLD_AMOUNT: z.coerce.number().positive().default(25),
  CONTRACT_ADDRESS: z.string().optional().default(""),
  RPC_URL: z.string().optional().default(""),
  ZG_ENDPOINT: z.string().optional().default(""),
  ZG_PRIVATE_KEY: z.string().optional().default(""),
  WORLD_ID_APP_ID: z.string().optional().default(""),
})

export const env = envSchema.parse(process.env)
