const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)soma-token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

async function fetcher<T = any>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...options?.headers as Record<string, string>,
  }
  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getTokenFromCookie()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers,
    signal: controller.signal,
    ...options,
  }).finally(() => clearTimeout(timeout))

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erro de rede' }))

    // Token expired or invalid — redirect to login
    if (res.status === 401 && typeof window !== 'undefined') {
      document.cookie = 'soma-token=; path=/; max-age=0'
      window.location.href = '/login'
      throw new Error('Sessao expirada. Redirecionando para login...')
    }

    throw new Error(error.error || error.message || 'Erro na requisição')
  }

  return res.json()
}

export const api = {
  get: <T = any>(path: string) => fetcher<T>(path),
  post: <T = any>(path: string, data?: any) =>
    fetcher<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T = any>(path: string, data?: any) =>
    fetcher<T>(path, { method: 'PUT', body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T = any>(path: string, data?: any) =>
    fetcher<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T = any>(path: string) =>
    fetcher<T>(path, { method: 'DELETE' }),
}
