'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Clock, Lock, Sparkles, MessageCircle, Mail } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { SUPPORT_CONTACT } from '@/lib/contact'

// Rotas liberadas mesmo quando o trial expirou
const TRIAL_ALLOWED_PATHS = ['/app/dashboard', '/app/settings/integrations']

export function AccessGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const hasAccess = useAuthStore((s) => s.hasAccess)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const isInTrial = useAuthStore((s) => s.isInTrial)
  const isTrialExpired = useAuthStore((s) => s.isTrialExpired)
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !user || isAdmin()) {
    return <>{children}</>
  }

  const onAllowedPath = TRIAL_ALLOWED_PATHS.some((p) => pathname?.startsWith(p))

  // Trial encerrado: bloqueia tudo exceto dashboard/integracoes
  if (isTrialExpired() && !onAllowedPath) {
    return <TrialExpiredLock plan={user.plan} />
  }

  // Setup pendente (sem acesso liberado) - libera integracoes
  if (pathname?.startsWith('/app/settings/integrations')) {
    return <>{children}</>
  }

  if (hasAccess()) {
    return <>{children}</>
  }

  const trialActive = isInTrial()
  const trialExpired =
    user.trialExpiresAt && new Date(user.trialExpiresAt) <= new Date()

  return (
    <div className="relative min-h-[60vh]">
      <div className="blur-md pointer-events-none select-none opacity-20">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="text-center p-10 rounded-2xl bg-brand-card/95 backdrop-blur-sm border border-brand-border max-w-md mx-4 shadow-2xl animate-form-fade-in">

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary-500/15 flex items-center justify-center mx-auto mb-5">
            {trialExpired ? (
              <Clock className="w-7 h-7 text-yellow-400" />
            ) : (
              <Lock className="w-7 h-7 text-primary-400" />
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
              <ContactButtons />
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white mb-2">
                Estamos preparando tudo para voce!
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Sua conta esta sendo configurada pela nossa equipe. Apos a
                confirmacao do pagamento do setup, seu acesso sera liberado e
                voce podera comecar a criar conteudo incrivel com IA.
              </p>
              <ContactButtons />
            </>
          )}

          {/* Trial countdown */}
          {user.trialExpiresAt && trialActive && (
            <TrialCountdown expiresAt={user.trialExpiresAt} />
          )}

          {/* Plan badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-5">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span>
              Plano{' '}
              <span className="text-white font-medium capitalize">
                {user.plan || 'Starter'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tela de bloqueio para trial expirado ─────────────────────────────────────

function TrialExpiredLock({ plan }: { plan?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-brand-card border border-red-500/20 p-8 shadow-2xl">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Periodo de teste encerrado</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Para continuar criando cards, videos e agendamentos, ative seu plano
              com nosso time.
            </p>
          </div>
        </div>

        <ContactButtons fullWidth />

        <div className="mt-5 pt-5 border-t border-brand-border text-[11px] text-gray-500 flex items-center justify-between">
          <span>Dashboard e Integracoes continuam disponiveis.</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary-500" />
            Plano <span className="text-gray-300 capitalize">{plan || 'Starter'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Botoes de contato WhatsApp / Email ──────────────────────────────────────

function ContactButtons({ fullWidth = false }: { fullWidth?: boolean }) {
  const waMsg = 'Ola, meu periodo de teste do Soma.ai encerrou e quero ativar meu plano.'
  const mailSubject = 'Ativar plano Soma.ai'
  return (
    <div className={`grid ${fullWidth ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
      <a
        href={SUPPORT_CONTACT.whatsappUrl(waMsg)}
        target="_blank"
        rel="noopener"
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp {SUPPORT_CONTACT.phoneDisplay}
      </a>
      <a
        href={SUPPORT_CONTACT.mailtoUrl(mailSubject)}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-surface border border-brand-border hover:border-gray-600 text-gray-200 text-sm font-medium transition-colors"
      >
        <Mail className="w-4 h-4" />
        {SUPPORT_CONTACT.email}
      </a>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null

  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1_000)

  return { days, hours, minutes, seconds }
}

// ─── Countdown display ───────────────────────────────────────────────────────

function TrialCountdown({ expiresAt }: { expiresAt: string }) {
  const [time, setTime] = useState(() => getTimeLeft(expiresAt))
  const [colonVisible, setColonVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeLeft(expiresAt))
      setColonVisible((v) => !v)
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  if (!time) {
    return (
      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
        <Clock className="w-3.5 h-3.5 text-red-400" />
        <span className="text-xs text-red-300 font-medium">Expirado</span>
      </div>
    )
  }

  const showDays = time.days > 0

  return (
    <div className="mt-2 mb-1">
      {/* Label */}
      <p className="text-xs text-gray-500 mb-3 tracking-wide uppercase">
        Tempo restante
      </p>

      {/* Digit blocks */}
      <div className="flex items-end justify-center gap-1.5">
        {showDays && (
          <>
            <DigitBlock value={pad(time.days)} label="dias" />
            <Separator visible={colonVisible} />
          </>
        )}
        <DigitBlock value={pad(time.hours)} label="horas" />
        <Separator visible={colonVisible} />
        <DigitBlock value={pad(time.minutes)} label="minutos" />
        <Separator visible={colonVisible} />
        <DigitBlock value={pad(time.seconds)} label="segundos" accent />
      </div>
    </div>
  )
}

function DigitBlock({
  value,
  label,
  accent = false,
}: {
  value: string
  label: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Card with mid-line divider */}
      <div
        className={[
          'relative font-mono text-[38px] font-bold leading-none tracking-tight',
          'rounded-xl px-3.5 py-2.5 min-w-[68px] text-center',
          'border border-white/10 bg-white/5',
          accent ? 'text-yellow-300' : 'text-white',
        ].join(' ')}
      >
        {value}
        {/* Horizontal mid-line */}
        <span className="absolute inset-x-0 top-1/2 -translate-y-px h-px bg-white/[0.07] pointer-events-none" />
      </div>
      <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-gray-500">
        {label}
      </span>
    </div>
  )
}

function Separator({ visible }: { visible: boolean }) {
  return (
    <span
      className={[
        'text-3xl font-bold pb-6 text-yellow-400/40 transition-opacity duration-150 select-none',
        visible ? 'opacity-100' : 'opacity-20',
      ].join(' ')}
    >
      :
    </span>
  )
}



