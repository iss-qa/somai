'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Facebook,
  Filter,
  Hash,
  Image as ImageIcon,
  Instagram,
  Layers,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Repeat2,
  RotateCcw,
  Search,
  Share2,
  Trash2,
  Video,
  X,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { AgendarCardModal } from '@/components/v2/AgendarCardModal'

interface CardItem {
  _id: string
  headline: string
  caption: string
  status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'archived'
  source?: 'ai' | 'custom'
  format: string
  post_type: string
  generated_image_url?: string
  generated_video_url?: string
  media_type?: 'image' | 'video'
  createdAt: string
  hashtags?: string[]
  ai_prompt_used?: string
  scheduled_at?: string
  slide_image_urls?: string[]
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

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  approved: 'Aprovado',
  scheduled: 'Agendado',
  posted: 'Publicado',
  archived: 'Arquivado',
}

function getFormatLabel(format: string, postType: string): string {
  const f = (format || postType || '').toLowerCase()
  if (f.includes('carrossel') || f.includes('carousel')) return 'Carrossel'
  if (f.includes('stories')) return 'Stories Único'
  if (f.includes('reels')) return 'Reels'
  return 'Post'
}

function getDimensions(format: string): string {
  const f = (format || '').toLowerCase()
  if (f.includes('stories') || f.includes('reels') || f.includes('9x16')) return '1080×1920'
  return '1080×1080'
}

function formatScheduledDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return (
      d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) +
      ' às ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    )
  } catch {
    return dateStr
  }
}

export default function BibliotecaV2Page() {
  return (
    <Suspense fallback={null}>
      <BibliotecaV2Content />
    </Suspense>
  )
}

interface CardStats {
  total: number
  byStatus: Record<string, number>
  bySource: Record<string, number>
}

function BibliotecaV2Content() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') || 'todos') as Tab
  const [cards, setCards] = useState<CardItem[]>([])
  const [stats, setStats] = useState<CardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)
  const [tab, setTab] = useState<Tab>(
    TABS.some((t) => t.key === initialTab) ? initialTab : 'todos',
  )
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [formato, setFormato] = useState<string>('')
  const [preview, setPreview] = useState<CardItem | null>(null)
  const [agendar, setAgendar] = useState<CardItem | null>(null)

  const loadStats = () => {
    api
      .get<CardStats>('/api/cards/stats')
      .then(setStats)
      .catch(() => {})
  }

  const loadCards = () => {
    if (cards.length === 0) setLoading(true)
    else setRefetching(true)
    const params = new URLSearchParams()
    params.set('limit', '60')
    const tabCfg = TABS.find((t) => t.key === tab)
    if (tabCfg?.status) params.set('status', tabCfg.status)
    // Filtro por source (ia/personalizado)
    if (tab === 'ia') params.set('source', 'ai')
    if (tab === 'personalizado') params.set('source', 'custom')
    if (formato) params.set('format', formato)

    api
      .get<{ cards: CardItem[] }>(`/api/cards?${params.toString()}`)
      .then((d) => setCards(d.cards || []))
      .catch(() => setCards([]))
      .finally(() => {
        setLoading(false)
        setRefetching(false)
      })
  }

  // load: usado por preview/delete/agendar pra refrescar tudo apos mutacoes
  const load = () => {
    loadCards()
    loadStats()
  }

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, formato])

  const filtered = useMemo(() => {
    let result = cards
    // Filtro por source ja eh feito server-side, mas mantemos client-side
    // como fallback para cards antigos que podem nao ter source definido
    if (tab === 'ia') result = result.filter((c) => c.source === 'ai')
    if (tab === 'personalizado') result = result.filter((c) => c.source === 'custom' || (!c.source && !c.ai_prompt_used))
    if (!query.trim()) return result
    const q = query.toLowerCase()
    return result.filter(
      (c) =>
        (c.headline || '').toLowerCase().includes(q) ||
        (c.caption || '').toLowerCase().includes(q),
    )
  }, [cards, tab, query])

  const counts = useMemo(() => {
    if (!stats) {
      return { todos: 0, draft: 0, scheduled: 0, posted: 0, ia: 0, personalizado: 0 }
    }
    return {
      todos: stats.total,
      draft: stats.byStatus.draft || 0,
      scheduled: stats.byStatus.scheduled || 0,
      posted: stats.byStatus.posted || 0,
      ia: stats.bySource.ai || 0,
      personalizado: stats.bySource.custom || 0,
    }
  }, [stats])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white md:h-12 md:w-12">
            <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl md:text-2xl">
              Biblioteca de Cards
            </h1>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400 md:text-sm">
              {filtered.length}{' '}
              {filtered.length === 1 ? 'card encontrado' : 'cards encontrados'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
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
      <div className="-mx-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-1 md:mx-0 md:px-0">
        {TABS.map((t) => {
          const active = tab === t.key
          const count = counts[t.key] ?? 0
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex min-h-[36px] shrink-0 snap-start items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
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
        <div className="relative min-w-0 flex-1 basis-full sm:basis-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block h-10 w-full max-w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-base focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-800 dark:bg-gray-900 dark:text-white sm:text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
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
            Nenhum card encontrado.
          </p>
          <Button onClick={() => router.push('/app/criar')} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Criar primeiro card
          </Button>
        </div>
      ) : (
        <div
          className={`grid grid-cols-2 gap-3 transition-opacity md:grid-cols-3 md:gap-4 lg:grid-cols-4 ${
            refetching ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {filtered.map((c) => (
            <PostCard key={c._id} card={c} onClick={() => setPreview(c)} />
          ))}
        </div>
      )}

      {preview && (
        <PreviewModal
          card={preview}
          onClose={() => setPreview(null)}
          onEdit={() => router.push(`/app/editor/${preview._id}`)}
          onPublished={() => {
            setPreview(null)
            setTab('posted')
            load()
          }}
          onAgendar={() => {
            setAgendar(preview)
            setPreview(null)
          }}
          onDeleted={() => {
            setPreview(null)
            load()
          }}
        />
      )}

      <AgendarCardModal
        open={!!agendar}
        initialCardId={agendar?._id}
        onClose={() => setAgendar(null)}
        onScheduled={() => {
          setAgendar(null)
          setTab('scheduled')
          load()
        }}
      />
    </div>
  )
}

function PreviewModal({
  card,
  onClose,
  onEdit,
  onPublished,
  onAgendar,
  onDeleted,
}: {
  card: CardItem
  onClose: () => void
  onEdit: () => void
  onPublished: () => void
  onAgendar: () => void
  onDeleted: () => void
}) {
  const [publishMenuOpen, setPublishMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const [caption, setCaption] = useState(card.caption || '')
  const [savingCaption, setSavingCaption] = useState(false)
  const [promptExpanded, setPromptExpanded] = useState(false)

  const slideCount = card.slide_image_urls?.length || 1
  const isFacebook =
    card.post_type?.toLowerCase().includes('facebook') ||
    card.format?.toLowerCase().includes('facebook')
  const platform = isFacebook ? 'facebook' : 'instagram'
  const formatLabel = getFormatLabel(card.format, card.post_type)
  const dimensions = getDimensions(card.format)

  const publicarAgora = async () => {
    if (publicando) return
    setPublishMenuOpen(false)
    setPublicando(true)
    const loadingId = toast.loading('Publicando no Instagram…')
    try {
      await api.post('/api/post-queue/publish-now', {
        card_id: card._id,
        platforms: ['instagram'],
      })
      toast.success('Post publicado com sucesso!', { id: loadingId })
      onPublished()
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao publicar', { id: loadingId })
    } finally {
      setPublicando(false)
    }
  }

  const saveCaption = async () => {
    setSavingCaption(true)
    try {
      await api.patch(`/api/cards/${card._id}`, { caption })
      toast.success('Legenda atualizada!')
      setEditingCaption(false)
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar legenda')
    } finally {
      setSavingCaption(false)
    }
  }

  const handleDownload = () => {
    setMoreMenuOpen(false)
    if (card.generated_image_url) {
      window.open(card.generated_image_url, '_blank')
    } else {
      toast.error('Nenhuma imagem disponível')
    }
  }

  const handleDelete = async () => {
    setMoreMenuOpen(false)
    if (!confirm('Tem certeza que deseja excluir este card?')) return
    try {
      await api.delete(`/api/cards/${card._id}`)
      toast.success('Card excluído com sucesso')
      onDeleted()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image area */}
        <div className="relative flex shrink-0 items-center justify-center bg-gray-100 px-8 py-6 dark:bg-gray-950">
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-300">
            {STATUS_LABELS[card.status] || card.status}
          </span>
          {card.generated_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.generated_image_url}
              alt={card.headline || 'Card'}
              className="max-h-64 max-w-full rounded-lg object-contain shadow"
            />
          ) : card.media_type === 'video' && card.generated_video_url ? (
            <video
              src={card.generated_video_url}
              className="max-h-64 max-w-full rounded-lg"
              controls
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center text-gray-400">
              <ImageIcon className="h-16 w-16" />
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Title + meta */}
          <div className="px-4 pb-3 pt-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {card.headline || 'Sem título'}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Criado {timeAgo(new Date(card.createdAt))}</span>
              <span>•</span>
              <Layers className="h-3 w-3" />
              <span>
                {slideCount} {slideCount === 1 ? 'slide' : 'slides'}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
                {isFacebook ? (
                  <Facebook className="h-3 w-3" />
                ) : (
                  <Instagram className="h-3 w-3" />
                )}
                {platform}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
                <Layers className="h-3 w-3" />
                {formatLabel}
              </span>
              <span className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
                {dimensions}
              </span>
            </div>
          </div>

          {/* Legenda */}
          <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Legenda
              </h3>
              <div className="flex items-center gap-3">
                {editingCaption ? (
                  <button
                    type="button"
                    onClick={saveCaption}
                    disabled={savingCaption}
                    className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700"
                  >
                    {savingCaption && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    Salvar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingCaption(true)}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(caption)
                    toast.success('Legenda copiada!')
                  }}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <Copy className="h-3 w-3" /> Copiar
                </button>
              </div>
            </div>
            {editingCaption ? (
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-base text-gray-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:text-sm"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {caption || 'Sem legenda'}
              </p>
            )}
          </div>

          {/* Hashtags */}
          {card.hashtags && card.hashtags.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                  <Hash className="h-4 w-4" /> Hashtags Sugeridas
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const text = card
                      .hashtags!.map((h) => (h.startsWith('#') ? h : `#${h}`))
                      .join(' ')
                    navigator.clipboard.writeText(text)
                    toast.success('Hashtags copiadas!')
                  }}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <Copy className="h-3 w-3" /> Copiar todas
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {card.hashtags.map((h, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {h.startsWith('#') ? h : `#${h}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prompt usado */}
          {card.ai_prompt_used && (
            <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setPromptExpanded((v) => !v)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Prompt usado
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                    IA
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${promptExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              {promptExpanded && (
                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Prompt geral
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(card.ai_prompt_used!)
                        toast.success('Prompt copiado!')
                      }}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      <Copy className="h-3 w-3" /> Copiar
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                    <pre className="whitespace-pre-wrap font-sans">
                      {card.ai_prompt_used}
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast('Em breve', { icon: '🚧' })}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Recriar com este prompt
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scheduled banner */}
          {card.scheduled_at && (
            <div className="mx-4 mb-4 mt-1 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-900/30 dark:bg-orange-950/20">
              <CalendarClock className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="text-sm text-orange-700 dark:text-orange-400">
                Agendado para {formatScheduledDate(card.scheduled_at)}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-1.5 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="w-full text-xs"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar Design
            </Button>
          </div>
          <div className="flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast('Em breve', { icon: '🚧' })}
              className="w-full text-xs"
            >
              <Share2 className="mr-1.5 h-3.5 w-3.5" /> Compartilhar
            </Button>
          </div>
          {/* Publicar button */}
          <div className="relative flex-1">
            <Button
              size="sm"
              onClick={() => setPublishMenuOpen((v) => !v)}
              disabled={publicando}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-xs text-white hover:from-purple-700 hover:to-pink-700"
            >
              {publicando ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              )}
              Publicar
            </Button>
            {publishMenuOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setPublishMenuOpen(false)}
                  className="fixed inset-0 z-40"
                  aria-label="Fechar menu"
                />
                <div className="absolute bottom-full right-0 z-50 mb-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={publicarAgora}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-purple-50 dark:hover:bg-gray-800"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300">
                      <Zap className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Publicar Agora
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        Envia direto para o Instagram
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPublishMenuOpen(false)
                      onAgendar()
                    }}
                    className="flex w-full items-start gap-3 border-t border-gray-100 px-4 py-3 text-left transition hover:bg-purple-50 dark:border-gray-800 dark:hover:bg-gray-800"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-300">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Agendar
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        Escolha data e horário
                      </span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
          {/* More options */}
          <div className="relative shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMoreMenuOpen((v) => !v)}
              className="h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {moreMenuOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen(false)}
                  className="fixed inset-0 z-40"
                  aria-label="Fechar menu"
                />
                <div className="absolute bottom-full right-0 z-50 mb-2 w-[min(12rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Download className="h-4 w-4" /> Baixar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false)
                      toast('Em breve', { icon: '🚧' })
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Repeat2 className="h-4 w-4" /> Adaptar formato
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false)
                      toast('Em breve', { icon: '🚧' })
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Copy className="h-4 w-4" /> Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 dark:border-gray-800 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PostCard({ card, onClick }: { card: CardItem; onClick: () => void }) {
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
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
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
    </button>
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
