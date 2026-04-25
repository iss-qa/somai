'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Plus,
  Image as ImageIcon,
  Search,
  Filter,
  Instagram,
  Facebook,
  Layers,
  Video,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface CardItem {
  _id: string
  headline: string
  caption: string
  status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'archived'
  format: string
  post_type: string
  generated_image_url?: string
  generated_video_url?: string
  media_type?: 'image' | 'video'
  createdAt: string
}

type Tab = 'todos' | 'draft' | 'scheduled' | 'posted' | 'ia' | 'personalizado'

const TABS: { key: Tab; label: string; status?: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'draft', label: 'Rascunhos', status: 'draft' },
  { key: 'scheduled', label: 'Agendados', status: 'scheduled' },
  { key: 'posted', label: 'Publicados', status: 'posted' },
  { key: 'ia', label: 'Gerados por IA' },
  { key: 'personalizado', label: 'Personalizados' },
]

export default function BibliotecaV2Page() {
  const router = useRouter()
  const [cards, setCards] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('todos')
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [formato, setFormato] = useState<string>('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('limit', '60')
    const tabCfg = TABS.find((t) => t.key === tab)
    // ia/personalizado are client-side filters — don't send status param
    if (tabCfg?.status) params.set('status', tabCfg.status)
    if (formato) params.set('format', formato)

    api
      .get<{ cards: CardItem[] }>(`/api/cards?${params.toString()}`)
      .then((d) => setCards(d.cards || []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, formato])

  const filtered = useMemo(() => {
    let result = cards
    if (tab === 'ia') result = result.filter((c) => !!c.generated_image_url)
    if (tab === 'personalizado') result = result.filter((c) => !c.generated_image_url)
    if (!query.trim()) return result
    const q = query.toLowerCase()
    return result.filter(
      (c) =>
        (c.headline || '').toLowerCase().includes(q) ||
        (c.caption || '').toLowerCase().includes(q),
    )
  }, [cards, tab, query])

  const counts = useMemo(() => {
    const map: Record<string, number> = {
      todos: cards.length,
      draft: 0,
      scheduled: 0,
      posted: 0,
      ia: 0,
      personalizado: 0,
    }
    for (const c of cards) {
      if (c.status in map) map[c.status] = (map[c.status] || 0) + 1
      if (c.generated_image_url) map.ia = (map.ia || 0) + 1
      else map.personalizado = (map.personalizado || 0) + 1
    }
    return map
  }, [cards])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white md:h-12 md:w-12">
            <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
              Biblioteca de Posts
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 md:text-sm">
              {filtered.length}{' '}
              {filtered.length === 1 ? 'post encontrado' : 'posts encontrados'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toast('Em breve', { icon: '🚧' })}
            className="hidden md:inline-flex"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Banco de Imagens
          </Button>
          <Button
            onClick={() => router.push('/app/criar')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Novo Post</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.key
          const count =
            t.key === 'todos'
              ? counts.todos
              : counts[t.status as string] || 0
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active
                    ? 'bg-white/20'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <span className="self-center text-xs font-medium text-gray-600 dark:text-gray-400">
            Formato:
          </span>
          {['', 'post', 'carrossel', 'stories'].map((f) => (
            <button
              key={f || 'all'}
              type="button"
              onClick={() => setFormato(f)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                formato === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {f || 'Todos'}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <BookOpen className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhum post encontrado.
          </p>
          <Button onClick={() => router.push('/app/criar')} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Criar primeiro post
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {filtered.map((c) => (
            <PostCard key={c._id} card={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({ card }: { card: CardItem }) {
  const platformIcon =
    card.post_type?.toLowerCase().includes('facebook') ||
    card.format?.toLowerCase().includes('facebook') ? (
      <Facebook className="h-3 w-3" />
    ) : (
      <Instagram className="h-3 w-3" />
    )
  const plataforma =
    card.post_type?.toLowerCase().includes('facebook') ||
    card.format?.toLowerCase().includes('facebook')
      ? 'facebook'
      : 'instagram'

  const formatIcon = card.format?.toLowerCase().includes('carrossel') ? (
    <Layers className="h-3 w-3" />
  ) : card.media_type === 'video' ? (
    <Video className="h-3 w-3" />
  ) : (
    <ImageIcon className="h-3 w-3" />
  )

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-200 text-gray-700',
    approved: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-amber-100 text-amber-700',
    posted: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
  }

  const ago = timeAgo(new Date(card.createdAt))

  return (
    <Link
      href={`/app/cards/library`}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-800">
        {card.generated_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.generated_image_url}
            alt={card.headline}
            className="h-full w-full object-cover"
          />
        ) : card.media_type === 'video' && card.generated_video_url ? (
          <video
            src={card.generated_video_url}
            className="h-full w-full object-cover"
            muted
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          {platformIcon}
          {plataforma}
        </span>
        <span
          className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[card.status] || 'bg-gray-100 text-gray-600'}`}
        >
          {card.status}
        </span>
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          {formatIcon}
          {card.format || card.post_type || '—'}
        </span>
      </div>
      <div className="p-3">
        <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {card.headline || 'Sem titulo'}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span>{ago}</span>
        </div>
      </div>
    </Link>
  )
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60)
  if (m < 60) return `ha ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `ha ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `ha ${d} dias`
  return date.toLocaleDateString('pt-BR')
}

