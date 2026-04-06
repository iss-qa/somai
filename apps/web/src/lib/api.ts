const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function fetcher<T = any>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...options?.headers as Record<string, string>,
  }
  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers,
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erro de rede' }))
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
