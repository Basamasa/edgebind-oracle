export const logger = {
  info(message: string, details?: unknown) {
    console.log(`[info] ${message}`, details ?? "")
  },
  error(message: string, details?: unknown) {
    console.error(`[error] ${message}`, details ?? "")
  },
}
