// app settings persisted in localStorage

export type AppMode = 'demo' | 'live'

export interface Settings {
  mode: AppMode
  backendUrl: string
}

const KEY = 'edgebind_settings'

function isHostedRuntime() {
  if (typeof window === 'undefined') {
    return false
  }

  const host = window.location.hostname
  return host !== 'localhost' && host !== '127.0.0.1'
}

export const DEFAULT_SETTINGS: Settings = {
  mode: 'live',
  backendUrl: 'https://edgebind-web.vercel.app',
}

export const loadSettings = (): Settings => {
  try {
    const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } as Settings

    if (isHostedRuntime()) {
      return {
        ...merged,
        mode: 'live',
        backendUrl: DEFAULT_SETTINGS.backendUrl,
      }
    }

    return merged
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const saveSettings = (s: Partial<Settings>) => {
  const current = loadSettings()
  const next = { ...current, ...s }

  if (isHostedRuntime()) {
    next.mode = 'live'
    next.backendUrl = DEFAULT_SETTINGS.backendUrl
  }

  localStorage.setItem(KEY, JSON.stringify(next))
}

// ping the backend to check if it's reachable
export const pingBackend = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}
