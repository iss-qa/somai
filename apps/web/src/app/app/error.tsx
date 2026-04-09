'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app-error]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Algo deu errado
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Ocorreu um erro inesperado. Tente recarregar a pagina.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/app/dashboard')}
          >
            Voltar ao Dashboard
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-600 mt-4">
            Codigo: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
