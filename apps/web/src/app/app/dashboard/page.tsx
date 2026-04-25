'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Trophy,
  Flame,
  Zap,
  Calendar,
  CalendarPlus,
  Plus,
  Sparkles,
  Lightbulb,
  MessageCircle,
  Gift,
  ChevronRight,
  TrendingUp,
  Clock,
  Coins,
  Image as ImageIcon,
  ArrowRight,
  Settings,
  Instagram,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { CriarChoiceModal } from '@/components/v2/CriarChoiceModal'

interface DashboardV2 {
  empresa: {
    id: string
    nome: string
    logo: string
    niche: string
    instagramHandle: string
    onboardingCompleto?: boolean
  }
  metricas: {
    totalPosts: number
    variacaoTotal: number
    pautasPara30d: number
    agendadosSemana: number
    creditos: number
    plano: string
  }
  gamificacao: {
    xp: number
    nivel: string
    nivelProgresso: { atual: number; proximo: number; faltam: number }
    creditosMes: number
    ofensiva: number
  }
  missoes: Array<{
    _id: string
    titulo: string
    tipo: string
    icone: string
    recompensaXP: number
    progresso: number
    meta: number
  }>
  proximoPasso: {
    key: string
    label: string
    completos: number
    total: number
  }
  ultimasCriacoes: Array<{
    id: string
    headline: string
    imageUrl: string
    status: string
    createdAt: string
  }>
  posts: {
    comunidade: Array<{
      id: string
      thumb: string
      segmento: string
      formato: string
    }>
  }
  comunidade: Array<{
    id: string
    titulo: string
    tags: string[]
    upvotes: number
  }>
  datasProximas: Array<{
    date: string
    name: string
    description: string
    dateISO: string
    suggested_headline: string
  }>
  dicaRapida: string
}

export default function DashboardV2Page() {
  const router = useRouter()
  const [data, setData] = useState<DashboardV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCriarModal, setShowCriarModal] = useState(false)

  useEffect(() => {
    api
      .get<DashboardV2>('/api/dashboard/v2')
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
      </div>
    )
  }

  const progressoPct =
    data.gamificacao.nivelProgresso.proximo === Infinity
      ? 100
      : Math.min(
          100,
          Math.round(
            ((data.gamificacao.xp - data.gamificacao.nivelProgresso.atual) /
              (data.gamificacao.nivelProgresso.proximo -
                data.gamificacao.nivelProgresso.atual)) *
              100,
          ),
        )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_280px]">
      {/* ─── Coluna esquerda — Gamificação ─── */}
      <aside className="space-y-4">
        <div className="rounded-2xl bg-gray-900 p-4 text-white">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-gray-400">Ranking</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-300">
            {data.gamificacao.nivel.replace('INTERMEDIARIO', 'INTERMEDIÁRIO')}
          </div>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="text-gray-400">Progresso</span>
            <span className="font-semibold">
              {data.gamificacao.xp}/
              {data.gamificacao.nivelProgresso.proximo === Infinity
                ? '∞'
                : data.gamificacao.nivelProgresso.proximo}{' '}
              XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: `${progressoPct}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            {data.gamificacao.nivelProgresso.faltam > 0
              ? `Faltam ${data.gamificacao.nivelProgresso.faltam} XP para o proximo nivel`
              : 'Nivel maximo!'}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-orange-700">
            <Flame className="h-4 w-4" />
            Ofensiva
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {data.gamificacao.ofensiva}
          </div>
          <div className="text-xs text-gray-600">
            {data.gamificacao.ofensiva === 0
              ? 'Comece sua ofensiva hoje!'
              : `${data.gamificacao.ofensiva} dia${data.gamificacao.ofensiva > 1 ? 's' : ''} seguido${data.gamificacao.ofensiva > 1 ? 's' : ''}!`}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
              MISSOES {data.missoes.filter((m) => m.progresso >= m.meta).length}/
              {data.missoes.length}
            </div>
            <Link
              href="/app/jornada"
              className="text-xs text-purple-600 hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {data.missoes.length === 0 && (
              <p className="text-xs text-gray-500">
                Nenhuma missao ativa agora.
              </p>
            )}
            {data.missoes.map((m) => (
              <div
                key={m._id}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <Zap className="h-4 w-4 flex-shrink-0 text-purple-500" />
                <div className="flex-1 truncate text-xs">
                  <div className="truncate font-medium text-gray-900">
                    {m.titulo}
                  </div>
                  <div className="text-gray-500">+{m.recompensaXP} XP</div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── Coluna central — Área principal ─── */}
      <section className="space-y-4">
        {/* Banner "Vamos agilizar!" — marca sem setup completo */}
        {!data.empresa.onboardingCompleto && (
          <div className="flex items-center gap-4 rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 p-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-gray-900">
                Vamos agilizar!
              </div>
              <div className="text-sm text-gray-700">
                Podemos preencher quase tudo de <b>{data.empresa.nome}</b>{' '}
                automaticamente usando IA.
              </div>
            </div>
            <Button
              onClick={() => router.push('/onboarding')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Configurar
            </Button>
          </div>
        )}

        {data.empresa.onboardingCompleto &&
          data.proximoPasso.completos < data.proximoPasso.total && (
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 p-4 text-white shadow-lg">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                Proximo passo
              </div>
              <div className="text-lg font-semibold">
                {data.proximoPasso.label}
              </div>
              <div className="text-xs text-white/80">
                Crie conteudo incrivel com ajuda da IA
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="text-right">
                <div className="text-xs text-white/80">Completas</div>
                <div className="font-semibold">
                  {data.proximoPasso.completos}/{data.proximoPasso.total}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCriarModal(true)}
                className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-purple-700 hover:bg-gray-50"
              >
                Ir
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Ultimos posts da comunidade
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.posts.comunidade.length === 0 && (
              <div className="flex h-16 w-full items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-500">
                Ainda nao ha posts na comunidade
              </div>
            )}
            {data.posts.comunidade.map((p) => (
              <div
                key={p.id}
                className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-purple-200"
              >
                {p.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.thumb}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-purple-200 to-pink-200" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricTile
            label="Total de posts"
            value={String(data.metricas.totalPosts)}
            hint={
              data.metricas.variacaoTotal !== 0
                ? `${data.metricas.variacaoTotal > 0 ? '+' : ''}${data.metricas.variacaoTotal}%`
                : undefined
            }
            tone="dark"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricTile
            label="Pautas para criar"
            value={String(data.metricas.pautasPara30d)}
            hint="Proximos 30 dias"
            icon={<Calendar className="h-4 w-4 text-purple-500" />}
          />
          <MetricTile
            label="Agendados"
            value={String(data.metricas.agendadosSemana)}
            hint="Para esta semana"
            icon={<Clock className="h-4 w-4 text-blue-500" />}
          />
          <MetricTile
            label="Creditos IA"
            value={String(data.metricas.creditos)}
            hint={data.metricas.plano}
            icon={<Coins className="h-4 w-4 text-amber-500" />}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
              <div>
                <div className="font-semibold text-gray-900">Dashboard</div>
                <div className="text-xs text-gray-500">
                  Trabalhando em {data.empresa.nome}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/app/calendar"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4" />
                Agendamento
              </Link>
              <button
                type="button"
                onClick={() => setShowCriarModal(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="h-4 w-4" />
                Criar Post
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Suas ultimas criacoes
            </h3>
            <Link
              href="/app/biblioteca"
              className="text-xs text-purple-600 hover:underline"
            >
              Ver biblioteca →
            </Link>
          </div>
          {data.ultimasCriacoes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
              <ImageIcon className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-600">
                Voce ainda nao criou nenhum post
              </p>
              <Button size="sm" onClick={() => setShowCriarModal(true)}>
                Criar primeiro post
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {data.ultimasCriacoes.map((c) => (
                <Link
                  key={c.id}
                  href={`/app/biblioteca`}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-gray-800 shadow-sm backdrop-blur dark:bg-gray-900/90 dark:text-gray-100">
                    <Instagram className="h-3 w-3" />
                    Instagram
                  </span>
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt={c.headline}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="truncate text-xs font-medium text-gray-900 dark:text-white">
                      {c.headline || 'Sem titulo'}
                    </div>
                    <div className="text-[10px] uppercase text-gray-500">
                      {c.status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-xl">
            🤖
          </div>
          <div className="text-sm text-gray-700">
            A IA esta buscando sugestoes para voce!
          </div>
          <Link href="/app/inspiracao">
            <Button variant="outline" size="sm">
              Ver inspiracoes
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Coluna direita — Comunidade e dicas ─── */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-900">
                Comunidade
              </span>
            </div>
            <Link
              href="/app/comunidade"
              className="text-xs text-purple-600 hover:underline"
            >
              Ver mais →
            </Link>
          </div>
          {data.comunidade.length === 0 ? (
            <p className="text-xs text-gray-500">Ainda nao ha perguntas.</p>
          ) : (
            data.comunidade.map((p) => (
              <Link
                key={p.id}
                href={`/app/comunidade`}
                className="block rounded-lg border border-gray-100 bg-gray-50 p-2 hover:bg-purple-50"
              >
                <div className="mb-1 flex items-center gap-1">
                  {p.tags.slice(0, 1).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="truncate text-xs text-gray-800">
                  {p.titulo}
                </div>
              </Link>
            ))
          )}
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 py-2 text-xs font-medium text-amber-700 hover:from-amber-100 hover:to-orange-100"
          >
            <Gift className="h-4 w-4" />
            Ganhe 100 Creditos
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-semibold text-gray-900">
              Proximas Datas
            </span>
          </div>
          <p className="text-xs text-gray-500">Nao perca nenhuma</p>
          <div className="mt-3 space-y-2">
            {(!data.datasProximas || data.datasProximas.length === 0) && (
              <div className="rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-500">
                Nenhuma data comemorativa encontrada
              </div>
            )}
            {data.datasProximas?.slice(0, 4).map((d, i) => {
              const date = new Date(d.dateISO)
              const dia = date.getDate()
              const mes = date
                .toLocaleDateString('pt-BR', { month: 'short' })
                .replace('.', '')
                .toUpperCase()
              const diasFalta = Math.max(
                0,
                Math.ceil(
                  (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                ),
              )
              const labelDias =
                diasFalta === 0
                  ? 'Hoje'
                  : diasFalta === 1
                    ? 'Amanha'
                    : `Em ${diasFalta} dias`
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 p-2 dark:border-gray-800"
                >
                  <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 text-[11px] font-bold text-purple-700 dark:from-purple-900/40 dark:to-pink-900/40 dark:text-purple-200">
                    <span className="leading-none">{dia}</span>
                    <span className="mt-0.5 text-[9px] font-semibold">
                      {mes}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs font-medium text-gray-900 dark:text-white">
                      {d.name}
                    </div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">
                      {labelDias}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-gray-900">
              Dica Rapida
            </span>
          </div>
          <p className="text-sm text-gray-700">{data.dicaRapida}</p>
        </div>
      </aside>

      <CriarChoiceModal
        open={showCriarModal}
        onClose={() => setShowCriarModal(false)}
      />
    </div>
  )
}

function MetricTile({
  label,
  value,
  hint,
  icon,
  tone = 'light',
}: {
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
  tone?: 'light' | 'dark'
}) {
  return (
    <div
      className={
        tone === 'dark'
          ? 'rounded-2xl bg-gray-900 p-4 text-white'
          : 'rounded-2xl border border-gray-200 bg-white p-4'
      }
    >
      <div
        className={`mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide ${
          tone === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && (
        <div
          className={`text-xs ${tone === 'dark' ? 'text-green-400' : 'text-gray-500'}`}
        >
          {hint}
        </div>
      )}
    </div>
  )
}
