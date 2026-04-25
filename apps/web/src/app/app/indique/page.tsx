'use client'

import { useEffect, useState } from 'react'
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  Loader2,
  Calendar,
  Mail,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface ReferralState {
  code: string
  shareUrl: string
  totalSignups: number
  totalConversions: number
  totalCreditosGanhos: number
  bonusInviter: number
  bonusInvitee: number
}

interface ReferralUse {
  inviteeName: string
  inviteeEmail: string
  signedUpAt: string
  convertedAt?: string | null
  creditadoInviter: boolean
}

export default function IndiquePage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<ReferralState | null>(null)
  const [history, setHistory] = useState<ReferralUse[]>([])
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      api.get<ReferralState>('/api/referrals/me'),
      api.get<{ uses: ReferralUse[] }>('/api/referrals/me/history'),
    ])
      .then(([s, h]) => {
        setState(s)
        setHistory(h.uses || [])
      })
      .catch(() => toast.error('Erro ao carregar indicações'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const copy = async (value: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value)
      if (kind === 'code') {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } else {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      }
      toast.success('Copiado!')
    } catch {
      toast.error('Não foi possível copiar')
    }
  }

  const shareNative = async () => {
    if (!state) return
    const text = `Crie conteúdo profissional com IA na Soma.ai e ganhe ${state.bonusInvitee} créditos bônus usando meu código: ${state.code}`
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'Soma.ai — Indicação',
          text,
          url: state.shareUrl,
        })
      } catch {
        /* cancelado */
      }
    } else {
      copy(`${text}\n${state.shareUrl}`, 'link')
    }
  }

  if (loading || !state) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Indique e Ganhe
          </h1>
          <p className="text-sm text-gray-500">
            Convide amigos e ganhe créditos para criar mais conteúdo
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-6 dark:border-amber-900/40 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-pink-950/40">
        <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-amber-300/30 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-white/10 dark:text-amber-300">
            <Coins className="h-3 w-3" />
            Programa de indicação
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            Ganhe{' '}
            <span className="text-amber-600 dark:text-amber-400">
              +{state.bonusInviter} créditos
            </span>{' '}
            por amigo
          </h2>
          <p className="mt-1 max-w-md text-sm text-gray-700 dark:text-gray-300">
            Seu amigo ganha +{state.bonusInvitee} créditos ao se cadastrar e
            você recebe +{state.bonusInviter} — créditos extras que nunca
            expiram.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">
          Seu código de indicação
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/60 px-4 py-3 dark:border-purple-800 dark:bg-purple-950/30">
          <code className="flex-1 text-lg font-bold tracking-wider text-purple-700 dark:text-purple-300">
            {state.code}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copy(state.code, 'code')}
          >
            {copiedCode ? (
              <>
                <Check className="mr-2 h-4 w-4 text-emerald-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            Ou compartilhe o link direto
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/50">
            <span className="flex-1 truncate text-xs text-gray-600 dark:text-gray-400">
              {state.shareUrl}
            </span>
            <button
              type="button"
              onClick={() => copy(state.shareUrl, 'link')}
              className="text-xs font-medium text-purple-600 hover:underline dark:text-purple-300"
            >
              {copiedLink ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        <Button
          onClick={shareNative}
          className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar convite
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Stat
          icon={<Users className="h-4 w-4" />}
          label="Amigos cadastrados"
          value={state.totalSignups.toString()}
          color="from-purple-500 to-pink-500"
        />
        <Stat
          icon={<Check className="h-4 w-4" />}
          label="Convertidos em Pro"
          value={state.totalConversions.toString()}
          color="from-emerald-500 to-teal-500"
        />
        <Stat
          icon={<Coins className="h-4 w-4" />}
          label="Créditos ganhos"
          value={state.totalCreditosGanhos.toString()}
          color="from-amber-500 to-orange-500"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Histórico de indicações
          </h2>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Ninguém se cadastrou com seu código ainda.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Compartilhe o código acima para começar a ganhar créditos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {history.map((u, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-xs font-semibold text-white">
                  {u.inviteeName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {u.inviteeName || u.inviteeEmail}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{u.inviteeEmail}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    {u.creditadoInviter ? `+${state.bonusInviter} 🪙` : 'Pendente'}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(u.signedUpAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Como funciona
        </div>
        <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <Step num={1} title="Compartilhe seu código">
            Envie o código ou link para amigos que criam conteúdo.
          </Step>
          <Step num={2} title="Amigo se cadastra">
            Ao se inscrever usando seu código, ele ganha {state.bonusInvitee}{' '}
            créditos bônus imediatamente.
          </Step>
          <Step num={3} title="Vocês dois ganham">
            Assim que o cadastro é confirmado, você recebe +{state.bonusInviter}{' '}
            créditos extras que nunca expiram.
          </Step>
        </ol>
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white`}
      >
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function Step({
  num,
  title,
  children,
}: {
  num: number
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold text-white">
        {num}
      </div>
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{title}</div>
        <p className="text-xs text-gray-600 dark:text-gray-400">{children}</p>
      </div>
    </li>
  )
}
