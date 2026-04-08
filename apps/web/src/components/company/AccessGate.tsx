'use client'

import { useState, useEffect } from 'react'
import { Clock, Lock, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

/**
 * AccessGate — blocks ALL content for users without access.
 * Shows a setup-pending or trial-expired overlay.
 * Admin users always pass through.
 */
export function AccessGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Before hydration or if admin, render children
  if (!mounted || !user || isAdmin()) {
    return <>{children}</>
  }

  // User has access (enabled or within trial)
  if (hasAccess()) {
    return <>{children}</>
  }

  // Check if trial expired or never had access
  const trialExpired =
    user.trialExpiresAt && new Date(user.trialExpiresAt) <= new Date()

  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred content behind */}
      <div className="blur-md pointer-events-none select-none opacity-20">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="text-center p-10 rounded-2xl bg-brand-card/95 backdrop-blur-sm border border-brand-border max-w-md mx-4 shadow-2xl animate-form-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/15 flex items-center justify-center mx-auto mb-5">
            {trialExpired ? (
              <Clock className="w-8 h-8 text-yellow-400" />
            ) : (
              <Lock className="w-8 h-8 text-primary-400" />
            )}
          </div>

          {trialExpired ? (
            <>
              <h3 className="text-xl font-bold text-white mb-2">
                Periodo de teste encerrado
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Seu periodo de teste gratuito expirou. Para continuar
                utilizando o Soma.ai, entre em contato com nossa equipe para
                ativar seu plano.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white mb-2">
                Estamos preparando tudo para voce!
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Sua conta esta sendo configurada pela nossa equipe. Em ate{' '}
                <span className="text-primary-300 font-medium">24 horas</span>{' '}
                seu acesso sera liberado e voce podera comecar a criar
                conteudo incrivel com IA.
              </p>
            </>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span>
              Plano{' '}
              <span className="text-white font-medium capitalize">
                {user.plan || 'Starter'}
              </span>
            </span>
          </div>

          {user.trialExpiresAt && !trialExpired && (
            <TrialCountdown expiresAt={user.trialExpiresAt} />
          )}
        </div>
      </div>
    </div>
  )
}

function TrialCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Expirado')
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h restantes`)
      } else {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}h ${mins}m restantes`)
      }
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [expiresAt])

  if (!timeLeft) return null

  return (
    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
      <Clock className="w-3.5 h-3.5 text-yellow-400" />
      <span className="text-xs text-yellow-300 font-medium">{timeLeft}</span>
    </div>
  )
}
