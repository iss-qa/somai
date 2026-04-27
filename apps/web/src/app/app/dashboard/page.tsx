'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CalendarPlus,
  Plus,
  Sparkles,
  Lightbulb,
  Clock,
  Coins,
  Image as ImageIcon,
  ArrowRight,
  Instagram,
  Facebook,
  Send,
  CheckCircle2,
  Video as VideoIcon,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { CriarChoiceModal } from '@/components/v2/CriarChoiceModal'
import { useAuthStore } from '@/store/authStore'
import { getGreeting } from '@/lib/utils'
import { FEATURES } from '@/lib/features'

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
    postsEsteMes: number
    variacaoTotal: number
    pautasPara30d: number
    agendadosSemana: number
    agendadosHoje: number
    cardsAprovados: number
    videosGerados: number
    creditos: number
    plano: string
  }
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
  proximasPostagens: Array<{
    id: string
    cardId: string | null
    headline: string
    imageUrl: string
    platforms: string[]
    scheduledAt: string
    status: string
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

interface DataComemorativa {
  date: string
  name: string
  description: string
  dateISO: string
  suggested_headline: string
}

export default function DashboardV2Page() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<DashboardV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCriarModal, setShowCriarModal] = useState(false)
  const [calendarioOpen, setCalendarioOpen] = useState(false)
  const [todasDatas, setTodasDatas] = useState<DataComemorativa[]>([])
  const [datasLoading, setDatasLoading] = useState(false)

  useEffect(() => {
    api
      .get<DashboardV2>('/api/dashboard/v2')
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const abrirCalendario = () => {
    setCalendarioOpen(true)
    if (todasDatas.length === 0) {
      setDatasLoading(true)
      api
        .get<{ datas: DataComemorativa[] }>('/api/dashboard/datas-comemorativas')
        .then((d) => setTodasDatas(d.datas || []))
        .catch(() => {})
        .finally(() => setDatasLoading(false))
    }
  }

  useEffect(() => {
    if (typeof document === 'undefined') return
    const original = document.body.style.overflow
    if (calendarioOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [calendarioOpen])

  useEffect(() => {
    if (!calendarioOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCalendarioOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [calendarioOpen])

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
      </div>
    )
  }

  const nomeUsuario =
    data.empresa.nome || user?.companyName || user?.name || 'bem-vindo'

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Banner "Vamos agilizar" — marca sem onboarding */}
      {!data.empresa.onboardingCompleto && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 p-4 dark:border-purple-900/40 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-rose-950/20">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-gray-900 dark:text-white md:text-lg">
              Vamos agilizar!
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
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

      {/* Header — saudacao + CTA principal (foco em postagens) */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            {getGreeting()}, {nomeUsuario}!
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Aqui esta o resumo do seu marketing hoje.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/app/calendar">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Agendamento</span>
              <span className="sm:hidden">Agenda</span>
            </Button>
          </Link>
          <Button
            onClick={() => setShowCriarModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Criar Post</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>
      </div>

      {/* Banner Proximo Passo — gamificado, oculto pos-MVP */}
      {FEATURES.proximoPassoBanner &&
        data.empresa.onboardingCompleto &&
        data.proximoPasso.completos < data.proximoPasso.total && (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 p-4 text-white shadow-lg">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
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
            <button
              type="button"
              onClick={() => setShowCriarModal(true)}
              className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-purple-700 hover:bg-gray-50"
            >
              Ir
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

      {/* Metricas — v1 + creditos */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
        <MetricTile
          label="Posts este mes"
          value={String(data.metricas.postsEsteMes)}
          hint={
            data.metricas.variacaoTotal !== 0
              ? `${data.metricas.variacaoTotal > 0 ? '+' : ''}${data.metricas.variacaoTotal}%`
              : 'vs mes anterior'
          }
          tone="dark"
          icon={<Send className="h-4 w-4" />}
        />
        <MetricTile
          label="Cards aprovados"
          value={String(data.metricas.cardsAprovados)}
          hint="Prontos para agendar"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
        <MetricTile
          label="Agendados hoje"
          value={String(data.metricas.agendadosHoje)}
          hint={`${data.metricas.agendadosSemana} esta semana`}
          icon={<Clock className="h-4 w-4 text-blue-500" />}
        />
        <MetricTile
          label="Videos gerados"
          value={String(data.metricas.videosGerados)}
          hint="Total"
          icon={<VideoIcon className="h-4 w-4 text-purple-500" />}
        />
        {FEATURES.creditos && (
          <MetricTile
            label="Creditos IA"
            value={String(data.metricas.creditos)}
            hint={data.metricas.plano}
            icon={<Coins className="h-4 w-4 text-amber-500" />}
            className="col-span-2 md:col-span-4 xl:col-span-1"
          />
        )}
      </div>

      {/* Conteudo principal — 1 coluna mobile / 2 colunas desktop */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:gap-6">
        <section className="space-y-4 min-w-0">
          {/* Proximas postagens (foco do MVP) */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <div className="flex min-w-0 items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-purple-500" />
                <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  Proximas postagens
                </h2>
              </div>
              <Link
                href="/app/calendar"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-purple-600 hover:underline dark:text-purple-400"
              >
                Ver todas
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="p-3 sm:p-4">
              {data.proximasPostagens.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nenhuma postagem agendada
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Gere um card e agende sua primeira postagem
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {data.proximasPostagens.map((p) => (
                    <ProximaPostagemItem
                      key={p.id}
                      post={p}
                      onClick={() => router.push('/app/calendar')}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Suas ultimas criacoes */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <div className="flex min-w-0 items-center gap-2">
                <ImageIcon className="h-4 w-4 shrink-0 text-purple-500" />
                <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  Suas ultimas criacoes
                </h2>
              </div>
              <Link
                href="/app/biblioteca"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-purple-600 hover:underline dark:text-purple-400"
              >
                Ver biblioteca
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="p-3 sm:p-4">
              {data.ultimasCriacoes.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <ImageIcon className="h-10 w-10 text-gray-300 dark:text-gray-700" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Voce ainda nao criou nenhum post
                  </p>
                  <Button size="sm" onClick={() => setShowCriarModal(true)}>
                    Criar primeiro post
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {data.ultimasCriacoes.slice(0, 6).map((c) => (
                    <Link
                      key={c.id}
                      href="/app/biblioteca"
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
          </div>
        </section>

        {/* Aside lateral — Datas, Dica */}
        <aside className="space-y-4">
          {/* Proximas Datas */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <CalendarPlus className="h-4 w-4 shrink-0 text-purple-500" />
                <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  Proximas Datas
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nao perca nenhuma
            </p>
            <div className="mt-3 space-y-2">
              {(!data.datasProximas || data.datasProximas.length === 0) && (
                <div className="rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Nenhuma data comemorativa encontrada
                </div>
              )}
              {data.datasProximas?.slice(0, 3).map((d, i) => (
                <DataComemorativaItem key={i} data={d} />
              ))}
            </div>
            {data.datasProximas && data.datasProximas.length > 0 && (
              <button
                type="button"
                onClick={abrirCalendario}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-purple-600 transition hover:bg-purple-50 dark:border-gray-700 dark:text-purple-400 dark:hover:bg-purple-950/30"
              >
                Ver calendario
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Dica Rapida */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-orange-950/30">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Dica Rapida
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-amber-100">
              {data.dicaRapida}
            </p>
          </div>
        </aside>
      </div>

      <CalendarioDatasDrawer
        open={calendarioOpen}
        loading={datasLoading}
        datas={todasDatas}
        onClose={() => setCalendarioOpen(false)}
      />

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
  className = '',
}: {
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
  tone?: 'light' | 'dark'
  className?: string
}) {
  const base =
    tone === 'dark'
      ? 'rounded-2xl bg-gray-900 p-4 text-white dark:bg-gray-800'
      : 'rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900'
  return (
    <div className={`${base} ${className}`}>
      <div
        className={`mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide ${
          tone === 'dark' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0">{icon}</span>
      </div>
      <div
        className={`text-2xl font-bold ${
          tone === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}
      >
        {value}
      </div>
      {hint && (
        <div
          className={`text-xs ${
            tone === 'dark'
              ? 'text-emerald-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {hint}
        </div>
      )}
    </div>
  )
}

function ProximaPostagemItem({
  post,
  onClick,
}: {
  post: {
    id: string
    headline: string
    imageUrl: string
    platforms: string[]
    scheduledAt: string
  }
  onClick: () => void
}) {
  const date = new Date(post.scheduledAt)
  const isHoje =
    date.toDateString() === new Date().toDateString()
  const dataFmt = isHoje
    ? `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }) +
      ' as ' +
      date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5 text-left transition hover:border-purple-200 hover:bg-purple-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-900/50 dark:hover:bg-purple-950/20"
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {post.headline || 'Post sem titulo'}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              {post.platforms.includes('facebook') ? (
                <Facebook className="h-3 w-3" />
              ) : (
                <Instagram className="h-3 w-3" />
              )}
              {post.platforms[0] || 'instagram'}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dataFmt}
            </span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Agendado
        </span>
      </button>
    </li>
  )
}

function DataComemorativaItem({ data }: { data: DataComemorativa }) {
  const date = new Date(data.dateISO)
  const dia = date.getDate()
  const mes = date
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
    .toUpperCase()
  const diasFalta = Math.max(
    0,
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  )
  const labelDias =
    diasFalta === 0
      ? 'Hoje'
      : diasFalta === 1
        ? 'Amanha'
        : `Em ${diasFalta} dia${diasFalta > 1 ? 's' : ''}`
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 p-2 dark:border-gray-800">
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 text-[11px] font-bold text-purple-700 dark:from-purple-900/40 dark:to-pink-900/40 dark:text-purple-200">
        <span className="leading-none">{dia}</span>
        <span className="mt-0.5 text-[9px] font-semibold">{mes}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-gray-900 dark:text-white">
          {data.name}
        </div>
        <div className="text-[10px] text-amber-600 dark:text-amber-400">
          {labelDias}
        </div>
      </div>
    </div>
  )
}

function CalendarioDatasDrawer({
  open,
  loading,
  datas,
  onClose,
}: {
  open: boolean
  loading: boolean
  datas: DataComemorativa[]
  onClose: () => void
}) {
  return (
    <div
      className={
        open
          ? 'fixed inset-0 z-50 pointer-events-auto'
          : 'fixed inset-0 z-50 pointer-events-none'
      }
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar calendario"
        tabIndex={open ? 0 : -1}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 flex h-full w-[90vw] max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-gray-950 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                Calendario de Datas
              </h2>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                Datas comemorativas para sua marca
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            aria-label="Fechar calendario"
            className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            </div>
          ) : datas.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              Nenhuma data comemorativa nos proximos 12 meses.
            </div>
          ) : (
            <ul className="space-y-3">
              {datas.map((d, i) => {
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
                      : `Em ${diasFalta} dia${diasFalta > 1 ? 's' : ''}`
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/40 dark:to-pink-900/40 dark:text-purple-200">
                      <span className="text-base font-bold leading-none">
                        {dia}
                      </span>
                      <span className="mt-0.5 text-[10px] font-semibold">
                        {mes}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {d.name}
                      </div>
                      {d.description && (
                        <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                          {d.description}
                        </p>
                      )}
                      <div className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        {labelDias}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          💡 Clique em uma data para ver inspiracoes relacionadas (em breve).
        </div>
      </aside>
    </div>
  )
}
