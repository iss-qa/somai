'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Coins, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useCreditsStore } from '@/store/creditsStore'
import { cn } from '@/lib/utils'

interface GamState {
  creditos: number
  creditosPlano?: number
  creditosExtras?: number
  limitePlano?: number
  plano?: string
}

interface Props {
  variant?: 'compact' | 'full'
  className?: string
}

export function CreditBalance({ variant = 'compact', className }: Props) {
  const companyId = useAuthStore((s) => s.user?.companyId)
  const { creditos: creditosStore, setCreditos } = useCreditsStore()
  const [state, setState] = useState<GamState | null>(null)

  useEffect(() => {
    if (!companyId) return
    api
      .get<GamState>('/api/gamificacao/state')
      .then((s) => {
        setState(s)
        setCreditos(s.creditos)
      })
      .catch(() => {})
  }, [companyId])

  if (variant === 'compact') {
    return (
      <Link
        href="/app/assinatura"
        className={cn(
          'group inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-700 transition hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50',
          className,
        )}
        title="Ver créditos e plano"
      >
        <Coins className="h-4 w-4" />
        <span className="font-medium">{creditosStore ?? state?.creditos ?? '—'}</span>
      </Link>
    )
  }

  const total = state?.creditos ?? 0
  const plano = state?.creditosPlano ?? 0
  const extras = state?.creditosExtras ?? 0
  const limite = state?.limitePlano ?? 15
  const usados = Math.max(0, limite - plano)
  const pct = limite > 0 ? Math.min(100, (usados / limite) * 100) : 0

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">
          Seus Créditos
        </div>
        <Link
          href="/app/assinatura"
          className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700"
        >
          <Plus className="h-3 w-3" />
          Recarregar
        </Link>
      </div>

      <div className="mt-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:from-purple-950/40 dark:to-pink-950/40">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
          Total Disponível
        </div>
        <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
          {total}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
          <div className="text-[10px] font-medium uppercase text-gray-500">
            Créditos do Plano
          </div>
          <div className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">
            {plano}
            <span className="text-xs font-normal text-gray-500"> / {limite}</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full bg-purple-600"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
          <div className="text-[10px] font-medium uppercase text-gray-500">
            Créditos Extras
          </div>
          <div className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">
            {extras}
          </div>
          <div className="mt-1.5 text-[10px] text-gray-500">Nunca expiram</div>
        </div>
      </div>
    </div>
  )
}
