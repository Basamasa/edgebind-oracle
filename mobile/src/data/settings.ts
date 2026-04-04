// app settings persisted in localStorage

export type AppMode = 'demo' | 'live'

export interface Settings {
  mode: AppMode
  backendUrl: string
}

const KEY = 'edgebind_settings'

export const DEFAULT_SETTINGS: Settings = {
  mode: 'demo',
  backendUrl: 'https://frontend-wheat-one-84.vercel.app',
}

export const loadSettings = (): Settings => {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const saveSettings = (s: Partial<Settings>) => {
  const current = loadSettings()
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...s }))
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
