export function formatMoney(amount: number, currency: string) {
  return `${amount.toFixed(amount % 1 === 0 ? 0 : 2)} ${currency}`
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function toQueryString(params: Record<string, string | undefined | null>) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value)
    }
  }

  const rendered = query.toString()
  return rendered ? `?${rendered}` : ""
}
