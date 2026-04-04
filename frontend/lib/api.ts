const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`
    let message = fallback

    try {
      const data = (await response.json()) as { error?: string }
      message = data.error ?? fallback
    } catch {
      message = fallback
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}
