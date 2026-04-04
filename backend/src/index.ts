import { createApp } from "./app"
import { env } from "./config/env"
import { logger } from "./utils/logger"

const app = createApp()

app.listen(env.PORT, () => {
  logger.info(`backend listening on http://localhost:${env.PORT}`)
})
