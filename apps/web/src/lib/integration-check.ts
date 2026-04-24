import { api } from './api'

const CACHE_KEY = 'soma-integration-status'
const CACHE_TTL = 5 * 60 * 1000

interface CachedStatus {
  connected: boolean
  timestamp: number
}

export async function checkIntegrationStatus(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const cached: CachedStatus = JSON.parse(raw)
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.connected
      }
    }
  } catch {}

  try {
    const data = await api.get<{ connected: boolean }>('/api/integrations/meta')
    const connected = data?.connected === true
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ connected, timestamp: Date.now() }))
    } catch {}
    return connected
  } catch {
    return false
  }
}

export function invalidateIntegrationCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {}
}
