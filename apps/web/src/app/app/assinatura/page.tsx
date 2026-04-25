'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  Zap,
  Crown,
  Check,
  Coins,
  RefreshCw,
  Calendar,
  PenSquare,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Wand2,
  BookOpen,
  Loader2,
  Rocket,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { UpgradeProModal } from '@/components/v2/UpgradeProModal'

interface GamState {
  creditos: number
  creditosPlano?: number
  creditosExtras?: number
  limitePlano?: number
  plano?: string
  usadosPeriodo?: number
  postsCriados?: number
  postsLimite?: number
  inspiracoesUsadas?: number
  inspiracoesLimite?: number
  calendariosUsados?: number
  calendariosLimite?: number
  inicioPlano?: string
}

const CUSTO_ACOES = [
  { icon: PenSquare, label: 'Gerar Post', custo: '15 créditos' },
  { icon: Lightbulb, label: 'Gerar Inspiração', custo: '0 créditos' },
  { icon: Calendar, label: 'Gerar Calendário', custo: '0 créditos' },
  { icon: MessageCircle, label: 'Conversa no Editor', custo: '0-1 créditos' },
  { icon: Wand2, label: 'Editar Imagem (IA)', custo: '6 créditos' },
  { icon: Sparkles, label: 'Melhorar Prompt', custo: '0 créditos' },
  { icon: BookOpen, label: 'Soci Chat', custo: '0 créditos' },
]

export default function AssinaturaPage() {
  const user = useAuthStore((s) => s.user)
  const [gam, setGam] = useState<GamState | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (!user?.companyId) return
    api
      .get<GamState>('/api/gamificacao/state')
      .then(setGam)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.companyId])

  const planoLabel =
    user?.plan === 'pro'
      ? 'Pro'
      : user?.plan === 'enterprise'
        ? 'Enterprise'
        : 'Freemium'
  const isPago = user?.plan === 'pro' || user?.plan === 'enterprise'

  const total = gam?.creditos ?? 0
  const plano = gam?.creditosPlano ?? total
  const extras = gam?.creditosExtras ?? 0
  const limite = gam?.limitePlano ?? 15
  const usados = gam?.usadosPeriodo ?? 0

  const postsFeitos = gam?.postsCriados ?? 0
  const postsLimite = gam?.postsLimite ?? 3
  const inspiracoesFeitas = gam?.inspiracoesUsadas ?? 0
  const inspiracoesLimite = gam?.inspiracoesLimite ?? 1
  const calendariosFeitos = gam?.calendariosUsados ?? 0
  const calendariosLimite = gam?.calendariosLimite ?? 1

  const inicio = gam?.inicioPlano
    ? new Date(gam.inicioPlano).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CreditCard className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Minha Assinatura
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Seu Plano
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isPago
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <Zap className="h-3 w-3" />
              {planoLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isPago
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  : 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
              }`}
            >
              {isPago ? (
                <Crown className="h-6 w-6" />
              ) : (
                <Zap className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {planoLabel}
              </div>
              <div className="text-xs text-gray-500">Mensal</div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 text-sm">
            <Row label="Início do plano" value={inicio} />
            <Row label="Agendamento" value={isPago ? 'Ativo' : 'Disponível'} valueClass="text-emerald-600 dark:text-emerald-400" />
          </div>
          {!isPago && (
            <Button
              onClick={() => setShowUpgrade(true)}
              className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            >
              <Crown className="mr-2 h-4 w-4" />
              Fazer Upgrade para Pro
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
            Seus Créditos
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:from-purple-950/40 dark:to-pink-950/40">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              Total Disponível
            </div>
            <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {total}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400">
                <RefreshCw className="h-3 w-3" />
                Créditos do Plano
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {plano}
                <span className="text-xs font-normal text-gray-500"> / {limite}</span>
              </div>
              <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                ♻ Renovam mensalmente
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400">
                <Coins className="h-3 w-3" />
                Créditos Extras
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {extras}
              </div>
              <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                🎁 Nunca expiram
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">
              Usados neste período
            </span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {usados} créditos
            </span>
          </div>
        </div>
      </div>

      {!isPago && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
            Limites do Plano Gratuito
          </div>
          <p className="mb-4 text-xs text-gray-500">
            Seu uso atual das funcionalidades gratuitas
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <UsageBar label="Posts criados" used={postsFeitos} total={postsLimite} />
            <UsageBar label="Inspirações" used={inspiracoesFeitas} total={inspiracoesLimite} />
            <UsageBar label="Calendários" used={calendariosFeitos} total={calendariosLimite} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
          Custo de Ações
        </div>
        <p className="mb-4 text-xs text-gray-500">
          Quantos créditos cada ação consome (pode variar por modelo de IA)
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          {CUSTO_ACOES.map((a) => {
            const Icon = a.icon
            return (
              <div
                key={a.label}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {a.label}
                  </div>
                  <div className="text-xs text-gray-500">{a.custo}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {!isPago && (
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-5 dark:border-purple-900/40 dark:from-purple-950/40 dark:to-pink-950/40">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Crown className="h-4 w-4 text-amber-500" />
            Faça Upgrade
          </div>
          <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
            Desbloqueie mais créditos e funcionalidades avançadas
          </p>
          <div className="relative mx-auto max-w-md rounded-2xl border-2 border-purple-300 bg-white p-5 shadow-md dark:border-purple-700 dark:bg-gray-900">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-[10px] font-bold text-white">
              Mais Popular
            </span>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Pro
                </div>
                <div className="text-xs text-gray-500">
                  Para criadores profissionais
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <Bullet>600 créditos/mês</Bullet>
              <Bullet>Agendamento de posts</Bullet>
              <Bullet>Suporte prioritário</Bullet>
              <Bullet>Todas as funcionalidades</Bullet>
            </ul>
            <Button
              onClick={() => setShowUpgrade(true)}
              className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Assinar Pro
            </Button>
          </div>
        </div>
      )}

      <UpgradeProModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={valueClass || 'font-medium text-gray-900 dark:text-white'}>
        {value}
      </span>
    </div>
  )
}

function UsageBar({
  label,
  used,
  total,
}: {
  label: string
  used: number
  total: number
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {used} / {total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
      {children}
    </li>
  )
}
