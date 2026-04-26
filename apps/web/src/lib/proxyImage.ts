// Proxy de imagens via /api/storage/proxy.
//
// Existe pra resolver de uma vez o problema de imagens cross-origin que
// quebram silenciosamente no <img> (R2 sem CORS, COEP/CORP do navegador,
// objetos com 403 intermitente). Servir via mesma origem elimina esses
// casos: o servidor faz o fetch e retorna o binario.

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export function proxyImageUrl(url?: string | null): string {
  if (!url) return ''
  // dataURL e blob nao precisam de proxy
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  // mesma origem nao precisa de proxy (ja vem do nosso dominio)
  if (typeof window !== 'undefined') {
    try {
      const u = new URL(url, window.location.origin)
      if (u.origin === window.location.origin) return url
    } catch {
      return url
    }
  }
  const base = API_URL.replace(/\/$/, '')
  return `${base}/api/storage/proxy?url=${encodeURIComponent(url)}`
}
