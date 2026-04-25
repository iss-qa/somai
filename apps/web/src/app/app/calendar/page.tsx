'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Instagram,
  Facebook,
  Clock,
  Image as ImageIcon,
  Loader2,
  X,
  Trash2,
  Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { GerarPautaIA } from '@/components/v2/GerarPautaIA'

// ── Types ─────────────────────────────────────
interface PopulatedCard {
  _id: string
  headline: string
  generated_image_url?: string
  format?: string
  post_type?: string
}

interface ScheduledPost {
  _id: string
  card_id: PopulatedCard | string
  caption: string
  platforms: string[]
  post_type: string
  scheduled_at: string
  status: 'queued' | 'processing' | 'done' | 'failed' | 'cancelled'
}

type Tab = 'todos' | 'ideias' | 'criacao' | 'prontos' | 'agendados'

const TABS: { key: Tab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ideias', label: 'Ideias IA' },
  { key: 'criacao', label: 'Em criacao' },
  { key: 'prontos', label: 'Prontos' },
  { key: 'agendados', label: 'Agendados' },
]

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// ──────────────────────────────────────────────
export default function CalendarioV2Page() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('todos')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: ScheduledPost[] }>(
        `/api/post-queue?month=${monthKey}&limit=200`,
      )
      setPosts(data.items || [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey])

  const filteredPosts = useMemo(() => {
    if (tab === 'todos') return posts
    const status: Record<Tab, string[]> = {
      todos: [],
      ideias: ['draft'],
      criacao: ['processing'],
      prontos: ['queued'],
      agendados: ['queued'],
    }
    return posts.filter((p) => (status[tab] || []).includes(p.status))
  }, [posts, tab])

  const countsByStatus = useMemo(() => {
    const c = { ideias: 0, criacao: 0, prontos: 0, agendados: 0 }
    posts.forEach((p) => {
      if (p.status === 'processing') c.criacao++
      else if (p.status === 'queued') {
        c.prontos++
        c.agendados++
      }
    })
    return c
  }, [posts])

  // Grid do mês
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => setCurrentDate(new Date())

  const postsByDay = useMemo(() => {
    const map = new Map<number, ScheduledPost[]>()
    for (const p of filteredPosts) {
      const d = new Date(p.scheduled_at)
      if (d.getMonth() !== month || d.getFullYear() !== year) continue
      const day = d.getDate()
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(p)
    }
    return map
  }, [filteredPosts, month, year])

  const hoje = new Date()
  const isToday = (d: number) =>
    d === hoje.getDate() &&
    month === hoje.getMonth() &&
    year === hoje.getFullYear()

  // ── Render ────────────────────────────────
  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white md:h-12 md:w-12">
            <CalendarIcon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
              Calendario Editorial
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 md:text-sm">
              Planeje, vincule e agende seus conteudos
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <GerarPautaIA onSuccess={fetchPosts} />
          <Button
            onClick={() => router.push('/app/criar')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Pauta
          </Button>
        </div>
      </div>

      {/* Tabs de status */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.key
          const n =
            t.key === 'todos'
              ? posts.length
              : t.key === 'ideias'
                ? 0
                : t.key === 'criacao'
                  ? countsByStatus.criacao
                  : t.key === 'prontos'
                    ? countsByStatus.prontos
                    : countsByStatus.agendados
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {n}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Banner Recomendacoes IA */}
      <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-500 to-pink-500 p-3 text-white md:p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold md:text-base">
            Recomendacoes IA
          </div>
          <div className="text-xs text-white/80 md:text-sm">
            Gere um calendario inteligente baseado nas suas inspiracoes
          </div>
        </div>
      </div>

      {/* Navegacao do mes */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          type="button"
          onClick={goToday}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          {MESES[month]} {year}
        </button>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Proximo mes"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Calendario — desktop */}
      <div className="hidden md:block">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            {/* Header dias */}
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
              {DIAS.map((d) => (
                <div
                  key={d}
                  className="px-2 py-2 text-center text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="h-20 border-b border-r border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-950/40"
                />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayPosts = postsByDay.get(day) || []
                const today = isToday(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day)
                      setShowDayModal(true)
                    }}
                    className={`h-20 border-b border-r border-gray-100 p-1 text-left transition hover:bg-purple-50 dark:border-gray-800 dark:hover:bg-purple-950/20 ${
                      today ? 'bg-purple-50/60 dark:bg-purple-950/20' : ''
                    }`}
                  >
                    <div
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        today
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayPosts.slice(0, 2).map((p) => (
                        <PostMini key={p._id} post={p} />
                      ))}
                      {dayPosts.length > 2 && (
                        <div className="text-[10px] text-gray-500">
                          +{dayPosts.length - 2} mais
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Calendario — mobile (lista agrupada) */}
      <div className="md:hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-2">
            {postsByDay.size === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                Nenhum post agendado em {MESES[month]}
              </div>
            ) : (
              Array.from(postsByDay.entries())
                .sort(([a], [b]) => a - b)
                .map(([day, dayPosts]) => (
                  <div
                    key={day}
                    className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className={`flex h-9 w-9 flex-col items-center justify-center rounded-lg ${
                          isToday(day)
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        }`}
                      >
                        <span className="text-sm font-bold leading-none">
                          {day}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {DIAS[new Date(year, month, day).getDay()]} ·{' '}
                        {dayPosts.length}{' '}
                        {dayPosts.length === 1 ? 'post' : 'posts'}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {dayPosts.map((p) => (
                        <PostRow
                          key={p._id}
                          post={p}
                          onClick={() => setSelectedPost(p)}
                        />
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* Modal dia (desktop) */}
      {showDayModal && selectedDay !== null && (
        <DayModal
          day={selectedDay}
          month={month}
          year={year}
          posts={postsByDay.get(selectedDay) || []}
          onClose={() => setShowDayModal(false)}
          onPostClick={(p) => {
            setShowDayModal(false)
            setSelectedPost(p)
          }}
          onAdd={() => {
            setShowDayModal(false)
            router.push('/app/criar')
          }}
        />
      )}

      {/* Modal post detalhe */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onRemoved={() => {
            setSelectedPost(null)
            fetchPosts()
          }}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────
function PostMini({ post }: { post: ScheduledPost }) {
  const card =
    typeof post.card_id === 'object' && post.card_id !== null
      ? post.card_id
      : null
  const hora = new Date(post.scheduled_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const plat = post.platforms?.[0]?.toLowerCase()
  const PlatIcon = plat === 'facebook' ? Facebook : Instagram
  const bg =
    post.status === 'done'
      ? 'bg-green-100 text-green-700'
      : post.status === 'failed'
        ? 'bg-red-100 text-red-700'
        : 'bg-purple-100 text-purple-700'
  return (
    <div
      className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] ${bg}`}
    >
      <PlatIcon className="h-2.5 w-2.5 flex-shrink-0" />
      <span className="truncate">
        {hora} {card?.headline || post.caption?.slice(0, 30) || 'Post'}
      </span>
    </div>
  )
}

function PostRow({
  post,
  onClick,
}: {
  post: ScheduledPost
  onClick: () => void
}) {
  const card =
    typeof post.card_id === 'object' && post.card_id !== null
      ? post.card_id
      : null
  const hora = new Date(post.scheduled_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const plat = post.platforms?.[0]?.toLowerCase()
  const PlatIcon = plat === 'facebook' ? Facebook : Instagram
  const statusLabel: Record<string, string> = {
    queued: 'Agendado',
    processing: 'Publicando',
    done: 'Publicado',
    failed: 'Falhou',
    cancelled: 'Cancelado',
  }
  const statusColor: Record<string, string> = {
    queued: 'text-amber-700 bg-amber-100',
    processing: 'text-blue-700 bg-blue-100',
    done: 'text-green-700 bg-green-100',
    failed: 'text-red-700 bg-red-100',
    cancelled: 'text-gray-700 bg-gray-100',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-2 text-left transition hover:bg-purple-50 dark:border-gray-800 dark:bg-gray-950/40 dark:hover:bg-purple-950/20"
    >
      {card?.generated_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.generated_image_url}
          alt=""
          className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800">
          <ImageIcon className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          {hora}
          <PlatIcon className="h-3 w-3" />
        </div>
        <div className="truncate text-xs font-medium text-gray-900 dark:text-white">
          {card?.headline || post.caption?.slice(0, 40) || 'Post'}
        </div>
      </div>
      <span
        className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] ${statusColor[post.status]}`}
      >
        {statusLabel[post.status]}
      </span>
    </button>
  )
}

function DayModal({
  day,
  month,
  year,
  posts,
  onClose,
  onPostClick,
  onAdd,
}: {
  day: number
  month: number
  year: number
  posts: ScheduledPost[]
  onClose: () => void
  onPostClick: (p: ScheduledPost) => void
  onAdd: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-2xl md:rounded-2xl dark:bg-gray-900">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {day} de {MESES[month]}
            </div>
            <div className="text-xs text-gray-500">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} agendado
              {posts.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500 dark:border-gray-700">
            Nenhum post agendado neste dia
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => (
              <PostRow key={p._id} post={p} onClick={() => onPostClick(p)} />
            ))}
          </div>
        )}
        <Button
          onClick={onAdd}
          className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agendar novo post
        </Button>
      </div>
    </div>
  )
}

function PostDetailModal({
  post,
  onClose,
  onRemoved,
}: {
  post: ScheduledPost
  onClose: () => void
  onRemoved: () => void
}) {
  const [removing, setRemoving] = useState(false)
  const card =
    typeof post.card_id === 'object' && post.card_id !== null
      ? post.card_id
      : null
  const data = new Date(post.scheduled_at).toLocaleString('pt-BR')

  const remover = async () => {
    if (!confirm('Remover este agendamento?')) return
    setRemoving(true)
    try {
      await api.delete(`/api/post-queue/${post._id}`)
      toast.success('Agendamento removido')
      onRemoved()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover')
      setRemoving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white shadow-2xl md:rounded-2xl dark:bg-gray-900">
        <div className="flex items-start justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalhes do post
            </div>
            <div className="text-xs text-gray-500">{data}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {card?.generated_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.generated_image_url}
              alt=""
              className="mb-3 w-full rounded-xl object-cover"
            />
          )}
          {card?.headline && (
            <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              {card.headline}
            </div>
          )}
          {post.caption && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {post.caption.slice(0, 300)}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1">
            {post.platforms?.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 border-t border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/50">
          <Button
            variant="outline"
            onClick={remover}
            disabled={removing}
            className="flex-1 text-red-600"
          >
            {removing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Remover
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
