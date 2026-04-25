'use client'

/**
 * Callback do OAuth do Facebook/Instagram (abre no popup).
 * Pega ?code / ?state e posta pra janela pai, depois fecha.
 */
import { useEffect } from 'react'

export default function MetaCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state') || ''
    const error = params.get('error_description') || params.get('error')

    try {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'soma-meta-oauth',
            code,
            state,
            error: error || null,
          },
          window.location.origin,
        )
      }
    } catch {
      /* noop */
    }
    setTimeout(() => window.close(), 300)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
        <p className="text-sm text-gray-600">Conectando ao Instagram...</p>
      </div>
    </div>
  )
}
