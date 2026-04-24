'use client'

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PostItem } from '@/components/company/PostItem'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Switch } from '@/components/ui/switch'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Instagram,
  Facebook,
  Loader2,
  Sparkles,
  Info,
  Repeat,
  Pencil,
  Trash2,
  AlertTriangle,
  Zap,
} from 'lucide-react'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// ── Types ──────────────────────────────────────
interface ScheduledPost {
  _id: string
  card_id: PopulatedCard | string
  caption: string
  platforms: string[]
  post_type: string
  scheduled_at: string
  status: 'queued' | 'processing' | 'done' | 'failed' | 'cancelled'
  hashtags: string[]
}

interface PopulatedCard {
  _id: string
  headline: string
  product_name: string
  caption: string
  hashtags: string[]
  format: string
  post_type: string
  generated_image_url: string
}

interface ApprovedCard {
  _id: string
  headline: string
  product_name: string
  caption: string
  hashtags: string[]
  format: string
  post_type: string
  generated_image_url: string
}

const PLATFORM_OPTIONS = [
  { value: 'instagram_feed', label: 'Instagram Feed', platforms: ['instagram'], postType: 'feed' },
  { value: 'instagram_stories', label: 'Instagram Stories', platforms: ['instagram'], postType: 'stories' },
  { value: 'instagram_reels', label: 'Instagram Reels', platforms: ['instagram'], postType: 'reels' },
  { value: 'instagram_carousel', label: 'Instagram Carrossel', platforms: ['instagram'], postType: 'carousel' },
  { value: 'facebook', label: 'Facebook', platforms: ['facebook'], postType: 'feed' },
  { value: 'instagram_facebook', label: 'Instagram + Facebook', platforms: ['instagram', 'facebook'], postType: 'feed' },
]

function getPlatformValueFromFormat(format: string): string {
  switch (format) {
    case 'feed':
    case 'feed_1x1':
      return 'instagram_feed'
    case 'carousel':
      return 'instagram_carousel'
    case 'stories':
    case 'stories_9x16':
      return 'instagram_stories'
    case 'reels':
      return 'instagram_reels'
    default:
      return ''
  }
}

const statusMap: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' | 'info' }> = {
  queued: { label: 'Na fila', variant: 'info' },
  processing: { label: 'Processando', variant: 'warning' },
  done: { label: 'Publicado', variant: 'success' },
  failed: { label: 'Falhou', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'secondary' },
}

const platformColorMap: Record<string, string> = {
  instagram: 'bg-pink-500',
  facebook: 'bg-blue-500',
}

// ── Helpers ──────────────────────────────────
function getCardName(card: PopulatedCard | string | null, caption?: string): string {
  if (!card || typeof card === 'string') return caption?.slice(0, 20) || 'Card sem nome'
  return card.headline || card.product_name || caption?.slice(0, 20) || 'Card sem nome'
}

function getCardThumbnail(card: PopulatedCard | string | null): string | undefined {
  if (!card || typeof card === 'string') return undefined
  return card.generated_image_url || undefined
}

function toPostItemFormat(post: ScheduledPost) {
  const statusMapping: Record<string, 'published' | 'failed' | 'cancelled' | 'queued' | 'processing'> = {
    done: 'published',
    failed: 'failed',
    cancelled: 'cancelled',
    queued: 'queued',
    processing: 'processing',
  }
  return {
    _id: post._id,
    title: getCardName(post.card_id, post.caption),
    caption: post.caption,
    card_id: typeof post.card_id === 'object' && post.card_id ? { generated_image_url: post.card_id.generated_image_url } : undefined,
    platforms: post.platforms,
    published_at: post.status === 'done' ? post.scheduled_at : null as string | null,
    created_at: post.scheduled_at,
    status: statusMapping[post.status] || post.status as any,
  }
}

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

// ── Inner Component (uses useSearchParams) ─────
function CalendarPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const cardFromUrl = searchParams.get('card')
  const newFromUrl = searchParams.get('new')

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null)

  // Data state
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [approvedCards, setApprovedCards] = useState<ApprovedCard[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)

  // Schedule form state
  const [formCardId, setFormCardId] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('10:00')
  const [formPlatform, setFormPlatform] = useState('')
  const [formCaption, setFormCaption] = useState('')
  const [formHashtags, setFormHashtags] = useState('')
  const [formRecurring, setFormRecurring] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generatingCaption, setGeneratingCaption] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthKey = `${year}-${padZero(month + 1)}`

  // ── Fetch posts for current month ──────────
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: ScheduledPost[]; pagination: any }>(
        `/api/post-queue?month=${monthKey}&limit=200`
      )
      setPosts((data.items || []).filter((p) => p.status !== 'cancelled'))
    } catch (err: any) {
      console.error('Erro ao carregar agendamentos:', err)
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // ── Fetch approved cards ───────────────────
  const fetchApprovedCards = useCallback(async () => {
    setCardsLoading(true)
    try {
      const data = await api.get<{ cards: ApprovedCard[]; pagination: any }>(
        '/api/cards?status=approved&limit=100'
      )
      setApprovedCards(data.cards || [])
    } catch (err: any) {
      console.error('Erro ao carregar cards:', err)
      toast.error('Erro ao carregar cards aprovados')
    } finally {
      setCardsLoading(false)
    }
  }, [])

  // ── Handle ?card=ID query param ────────────
  const [urlCardHandled, setUrlCardHandled] = useState(false)

  useEffect(() => {
    if (cardFromUrl && !urlCardHandled) {
      setFormCardId(cardFromUrl)
      setFormDate('')
      setFormTime('10:00')
      setFormPlatform('')
      setFormCaption('')
      setFormHashtags('')
      setFormRecurring(false)
      setShowScheduleModal(true)
      setUrlCardHandled(true)
      fetchApprovedCards()
    }
  }, [cardFromUrl, urlCardHandled, fetchApprovedCards])

  // ── Handle ?new=true query param ───────────
  const [urlNewHandled, setUrlNewHandled] = useState(false)

  useEffect(() => {
    if (newFromUrl === 'true' && !urlNewHandled && !cardFromUrl) {
      setFormCardId('')
      setFormDate('')
      setFormTime('10:00')
      setFormPlatform('')
      setFormCaption('')
      setFormHashtags('')
      setFormRecurring(false)
      setShowScheduleModal(true)
      setUrlNewHandled(true)
      fetchApprovedCards()
    }
  }, [newFromUrl, urlNewHandled, cardFromUrl, fetchApprovedCards])

  // ── Calendar computation ───────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []

    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [year, month])

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  const getPostsForDay = (day: number) => {
    return posts.filter((p) => {
      const d = new Date(p.scheduled_at)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })
  }

  // ── Navigation ─────────────────────────────
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  // ── Day click ──────────────────────────────
  const handleDayClick = (day: number) => {
    const dayPosts = getPostsForDay(day)
    if (dayPosts.length === 1) {
      handlePostClick(dayPosts[0])
    } else {
      setSelectedDay(day)
      setShowDayModal(true)
    }
  }

  // ── Post click (details) ───────────────────
  const handlePostClick = (post: ScheduledPost) => {
    setSelectedPost(post)
    setShowPostDetail(true)
  }

  // ── Edit post (open schedule modal pre-filled) ───
  const handleEditPost = () => {
    if (!selectedPost) return
    const cardId = typeof selectedPost.card_id === 'string'
      ? selectedPost.card_id
      : selectedPost.card_id._id

    const dt = new Date(selectedPost.scheduled_at)
    const dateStr = `${dt.getFullYear()}-${padZero(dt.getMonth() + 1)}-${padZero(dt.getDate())}`
    const timeStr = `${padZero(dt.getHours())}:${padZero(dt.getMinutes())}`

    // Find platform option from post_type
    const platformOpt = PLATFORM_OPTIONS.find((p) => p.postType === selectedPost.post_type)

    // Ensure the card is in approvedCards so the Select shows it immediately.
    // (Card status may no longer be "approved" after scheduling, so it might be absent.)
    if (typeof selectedPost.card_id !== 'string') {
      setApprovedCards((prev) =>
        prev.some((c) => c._id === cardId) ? prev : [selectedPost.card_id as PopulatedCard, ...prev]
      )
    }

    setEditingQueueId(selectedPost._id)
    setFormCardId(cardId)
    setFormDate(dateStr)
    setFormTime(timeStr)
    setFormPlatform(platformOpt?.value || '')
    setFormCaption(selectedPost.caption || '')
    setFormHashtags((selectedPost.hashtags || []).join(' '))
    setFormRecurring(false)
    setShowPostDetail(false)
    if (!approvedCards.length) fetchApprovedCards()
    setShowScheduleModal(true)
  }

  // ── Remove post from queue ─────────────────
  const handleRemovePost = async () => {
    if (!selectedPost) return
    setRemoving(true)
    try {
      await api.delete(`/api/post-queue/${selectedPost._id}`)
      setPosts((prev) => prev.filter((p) => p._id !== selectedPost._id))
      setShowRemoveConfirm(false)
      setShowPostDetail(false)
      toast.success('Agendamento removido da fila')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover agendamento')
    } finally {
      setRemoving(false)
    }
  }

  // ── Open schedule modal ────────────────────
  const openScheduleModal = (prefillDay?: number) => {
    setShowDayModal(false)
    // Reset form
    setFormCardId(cardFromUrl || '')
    if (prefillDay) {
      const dateStr = `${year}-${padZero(month + 1)}-${padZero(prefillDay)}`
      setFormDate(dateStr)
    } else {
      setFormDate('')
    }
    setFormTime('10:00')
    setFormPlatform('')
    setFormCaption('')
    setFormHashtags('')
    setFormRecurring(false)
    // Open modal IMMEDIATELY, then load cards in the background
    setShowScheduleModal(true)
    if (!approvedCards.length) {
      fetchApprovedCards()
    }
  }

  // ── Selected card info ──────────────────────
  const selectedCard = approvedCards.find((c) => c._id === formCardId) || null
  const selectedFormat = selectedCard?.format || ''
  const isStoryOrReels = selectedFormat === 'stories' || selectedFormat === 'reels'
  const platformLocked = isStoryOrReels

  // ── Auto-fill fields from selected card ─────
  useEffect(() => {
    if (formCardId && approvedCards.length > 0) {
      const card = approvedCards.find((c) => c._id === formCardId)
      if (card) {
        // Auto-fill caption: use card.caption, or generate from headline + product_name
        const caption = card.caption
          || [card.headline, card.product_name].filter(Boolean).join(' - ')
          || ''
        setFormCaption(caption)

        // Auto-fill hashtags
        setFormHashtags((card.hashtags || []).join(' '))

        // Auto-fill platform based on card format (and lock for stories/reels)
        if (card.format) {
          const platformValue = getPlatformValueFromFormat(card.format)
          if (platformValue) {
            setFormPlatform(platformValue)
          }
        }
      }
    }
  }, [formCardId, approvedCards])

  // ── Generate caption with AI ──────────────
  const handleGenerateCaption = async () => {
    if (!formCardId) {
      toast.error('Selecione um card primeiro')
      return
    }
    setGeneratingCaption(true)
    try {
      const result = await api.post<{ caption: string; hashtags: string[] }>(
        `/api/cards/generate-caption/${formCardId}`
      )
      if (result.caption) setFormCaption(result.caption)
      if (result.hashtags?.length) setFormHashtags(result.hashtags.join(' '))
      toast.success('Legenda gerada com IA!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar legenda')
    } finally {
      setGeneratingCaption(false)
    }
  }

  // ── Submit schedule ────────────────────────
  const handleSubmitSchedule = async () => {
    if (!formCardId) {
      toast.error('Selecione um card')
      return
    }
    if (!formDate) {
      toast.error('Selecione uma data')
      return
    }

    // Auto-resolve platform from card format when it wasn't set yet (race condition)
    let resolvedPlatform = formPlatform
    if (!resolvedPlatform && selectedCard?.format) {
      resolvedPlatform = getPlatformValueFromFormat(selectedCard.format)
      if (resolvedPlatform) setFormPlatform(resolvedPlatform)
    }

    if (!resolvedPlatform) {
      toast.error('Selecione uma plataforma')
      return
    }

    const platformOption = PLATFORM_OPTIONS.find((p) => p.value === resolvedPlatform)
    if (!platformOption) {
      toast.error('Plataforma invalida')
      return
    }

    const baseDate = new Date(`${formDate}T${formTime || '10:00'}:00`)
    if (isNaN(baseDate.getTime())) {
      toast.error('Data/hora invalida')
      return
    }

    const hashtagsArray = formHashtags
      .split(/[\s,]+/)
      .map((h) => h.trim())
      .filter((h) => h.length > 0)

    // Build list of dates (1 or 4 for recurrence)
    const dates: Date[] = [baseDate]
    if (formRecurring) {
      for (let w = 1; w <= 3; w++) {
        const next = new Date(baseDate)
        next.setDate(next.getDate() + w * 7)
        dates.push(next)
      }
    }

    setSubmitting(true)
    try {
      // If editing, cancel the old queue item first
      if (editingQueueId) {
        await api.delete(`/api/post-queue/${editingQueueId}`)
        setEditingQueueId(null)
      }

      for (const dt of dates) {
        await api.post('/api/post-queue', {
          card_id: formCardId,
          scheduled_at: dt.toISOString(),
          platforms: platformOption.platforms,
          post_type: platformOption.postType,
          caption: isStoryOrReels ? '' : formCaption,
          hashtags: isStoryOrReels ? [] : hashtagsArray,
        })
      }

      const count = dates.length
      toast.success(
        editingQueueId
          ? 'Agendamento atualizado!'
          : count > 1
            ? `${count} postagens recorrentes agendadas!`
            : 'Post agendado com sucesso!'
      )
      setShowScheduleModal(false)
      fetchPosts()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao agendar post')
    } finally {
      setSubmitting(false)
    }
  }

  // Recurrence label
  const recurrenceCount = formRecurring ? 4 : 1
  const dayOfWeekLabel = formDate
    ? new Date(`${formDate}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '')
    : ''

  // ── Derived data ───────────────────────────
  const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay) : []

  const upcomingPosts = useMemo(() => {
    const now = new Date()
    return posts
      .filter((p) => new Date(p.scheduled_at) >= now && p.status !== 'cancelled')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 10)
  }, [posts])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Calendario</h2>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie suas publicações agendadas
          </p>
        </div>
        <Button className="gap-2" onClick={() => openScheduleModal()}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Agendar Card</span>
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold text-white">
            {MONTHS[month]} {year}
          </h3>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
              <span className="ml-2 text-sm text-gray-400">Carregando...</span>
            </div>
          ) : (
            <>
              {/* Desktop calendar grid */}
              <div className="hidden md:block">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-px bg-brand-border rounded-lg overflow-hidden">
                  {calendarDays.map((day, i) => {
                    const dayPosts = day ? getPostsForDay(day) : []
                    return (
                      <button
                        key={i}
                        onClick={() => day && handleDayClick(day)}
                        disabled={!day}
                        className={cn(
                          'min-h-[100px] p-2 text-left transition-colors bg-brand-card',
                          day && 'hover:bg-brand-surface cursor-pointer',
                          !day && 'bg-brand-dark/50',
                          isToday(day || 0) && 'ring-1 ring-inset ring-primary-500'
                        )}
                      >
                        {day && (
                          <>
                            <span
                              className={cn(
                                'text-sm',
                                isToday(day)
                                  ? 'text-primary-400 font-bold'
                                  : 'text-gray-400'
                              )}
                            >
                              {day}
                            </span>
                            {dayPosts.length > 0 && (
                              <div className="flex flex-col gap-0.5 mt-1 w-full overflow-hidden">
                                {dayPosts.slice(0, 3).map((post, idx) => {
                                  const isInstagram = post.platforms.includes('instagram')
                                  const time = new Date(post.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
                                  const cardName = getCardName(post.card_id, post.caption)
                                  return (
                                    <div
                                      key={idx}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handlePostClick(post)
                                      }}
                                      className="text-[10px] px-1.5 py-0.5 rounded truncate hover:brightness-125 transition-[filter]"
                                      style={{
                                        backgroundColor: post.status === 'done'
                                          ? 'rgba(16,185,129,0.15)'
                                          : post.status === 'failed'
                                            ? 'rgba(239,68,68,0.15)'
                                            : 'rgba(59,130,246,0.15)',
                                        color: post.status === 'done'
                                          ? '#34d399'
                                          : post.status === 'failed'
                                            ? '#f87171'
                                            : '#60a5fa',
                                      }}
                                    >
                                      <span className="font-semibold">{time}</span> {cardName}
                                    </div>
                                  )
                                })}
                                {dayPosts.length > 3 && (
                                  <span className="text-[10px] text-gray-500 px-1.5">
                                    +{dayPosts.length - 3} mais
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mobile list view */}
              <div className="md:hidden space-y-3">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post._id}
                      onClick={() => handlePostClick(post)}
                      className="cursor-pointer"
                    >
                      <PostItem post={toPostItemFormat(post)} compact />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      Nenhuma postagem agendada este mes
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Upcoming posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-400" />
            Próximas publicações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingPosts.length > 0 ? (
            <div className="space-y-3">
              {upcomingPosts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => handlePostClick(post)}
                  className="cursor-pointer"
                >
                  <PostItem post={toPostItemFormat(post)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Nenhuma publicação agendada
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Agende posts para eles aparecerem aqui
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Day detail modal ────────────────── */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay && `${selectedDay} de ${MONTHS[month]}`}
            </DialogTitle>
            <DialogDescription>
              {selectedDayPosts.length > 0
                ? `${selectedDayPosts.length} postagem(ns) agendada(s)`
                : 'Nenhuma postagem agendada para este dia'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {selectedDayPosts.length > 0 ? (
              selectedDayPosts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => {
                    setShowDayModal(false)
                    handlePostClick(post)
                  }}
                  className="cursor-pointer"
                >
                  <PostItem post={toPostItemFormat(post)} />
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">
                  Nenhuma publicação para esta data
                </p>
              </div>
            )}
          </div>

          <Button
            className="w-full gap-2 mt-2"
            onClick={() => openScheduleModal(selectedDay || undefined)}
          >
            <Plus className="w-4 h-4" />
            Agendar para este dia
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Schedule post modal ─────────────── */}
      <Dialog open={showScheduleModal} onOpenChange={(open) => { setShowScheduleModal(open); if (!open) setEditingQueueId(null) }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingQueueId ? 'Editar Agendamento' : 'Agendar Card'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Card select */}
            <div className="space-y-2">
              <Label>Card aprovado</Label>
              {cardsLoading && approvedCards.length === 0 ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-800 bg-brand-surface">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Carregando cards...</span>
                </div>
              ) : (
                <Select value={formCardId} onValueChange={setFormCardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um card aprovado" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedCards.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        Nenhum card aprovado
                      </SelectItem>
                    ) : (
                      approvedCards.map((card) => (
                        <SelectItem key={card._id} value={card._id}>
                          {(card.headline || card.product_name || `Card ${card._id.slice(-6)}`) + (card.format ? ` (${card.format})` : '')}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}

              {/* Format info */}
              {selectedCard && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Info className="w-3 h-3" />
                  <span>
                    Formato: <strong className="text-gray-300">
                      {selectedFormat === 'stories' || selectedFormat === 'reels'
                        ? 'Story / Reels'
                        : 'Feed'} ({selectedFormat === 'stories' || selectedFormat === 'reels' ? '1080x1920' : '1080x1080'})
                    </strong>
                    {' · '}Plataformas: {PLATFORM_OPTIONS.find((p) => p.value === formPlatform)?.label || '—'}
                  </span>
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="[color-scheme:dark]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-10 px-3 border-primary-500/30 text-primary-400 hover:bg-primary-500/10 hover:text-primary-300"
                onClick={() => {
                  const now = new Date()
                  now.setMinutes(now.getMinutes() + 2)
                  const yyyy = now.getFullYear()
                  const mm = String(now.getMonth() + 1).padStart(2, '0')
                  const dd = String(now.getDate()).padStart(2, '0')
                  const hh = String(now.getHours()).padStart(2, '0')
                  const min = String(now.getMinutes()).padStart(2, '0')
                  setFormDate(`${yyyy}-${mm}-${dd}`)
                  setFormTime(`${hh}:${min}`)
                  toast.success('Agendado para executar em 2 minutos!')
                }}
              >
                <Zap className="w-3.5 h-3.5" />
                Agora
              </Button>
            </div>

            {/* Recurrence toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-brand-border bg-brand-surface/50">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-200">Repetir semanalmente</p>
                  {formRecurring && formDate && (
                    <p className="text-xs text-gray-500">
                      Toda {dayOfWeekLabel}, por 4 semanas
                    </p>
                  )}
                </div>
              </div>
              <Switch
                checked={formRecurring}
                onCheckedChange={setFormRecurring}
              />
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <Label>Plataforma</Label>
              {platformLocked ? (
                <div className="flex items-center h-10 px-3 rounded-lg border border-gray-800 bg-brand-surface/50 text-sm text-gray-300">
                  {PLATFORM_OPTIONS.find((p) => p.value === formPlatform)?.label
                    || (selectedCard?.format ? PLATFORM_OPTIONS.find((p) => p.value === getPlatformValueFromFormat(selectedCard.format))?.label : null)
                    || 'Carregando...'}
                </div>
              ) : (
                <Select value={formPlatform} onValueChange={setFormPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((opt) => {
                      const isFeedCard = selectedFormat === 'feed'
                      const isCarouselCard = selectedFormat === 'carousel'
                      let isDisabled = false
                      if (isFeedCard) isDisabled = opt.postType !== 'feed'
                      if (isCarouselCard) isDisabled = opt.postType !== 'carousel' && opt.postType !== 'feed'
                      return (
                        <SelectItem key={opt.value} value={opt.value} disabled={isDisabled}>
                          {opt.label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Stories/Reels info */}
            {isStoryOrReels && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300">
                  Stories não suportam legenda nem hashtags. Apenas a imagem será publicada.
                </p>
              </div>
            )}

            {/* Caption - only for feed */}
            {!isStoryOrReels && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Legenda</Label>
                  <button
                    type="button"
                    onClick={handleGenerateCaption}
                    disabled={generatingCaption || !formCardId}
                    className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingCaption ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Gerar com IA
                  </button>
                </div>
                <textarea
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  rows={3}
                  placeholder="Legenda do post..."
                  className={cn(
                    'flex w-full rounded-lg border border-gray-800 bg-brand-surface px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 transition-colors resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500'
                  )}
                />
              </div>
            )}

            {/* Hashtags - only for feed */}
            {!isStoryOrReels && (
              <div className="space-y-2">
                <Label>Hashtags</Label>
                <Input
                  value={formHashtags}
                  onChange={(e) => setFormHashtags(e.target.value)}
                  placeholder="#marketing #design #social"
                />
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              className="w-full gap-2"
              onClick={handleSubmitSchedule}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4" />
                  {editingQueueId
                    ? 'Salvar alterações'
                    : formRecurring
                      ? `Agendar ${recurrenceCount} postagens recorrentes`
                      : 'Agendar'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Post detail modal ───────────────── */}
      <Dialog open={showPostDetail} onOpenChange={setShowPostDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações sobre o post agendado
            </DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              {/* Card name */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card
                </span>
                <p className="text-sm text-gray-200">
                  {getCardName(selectedPost.card_id)}
                </p>
              </div>

              {/* Thumbnail */}
              {getCardThumbnail(selectedPost.card_id) && (
                <div className="rounded-lg overflow-hidden border border-brand-border">
                  <img
                    src={getCardThumbnail(selectedPost.card_id)}
                    alt="Card preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Time */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data e Hora
                </span>
                <p className="text-sm text-gray-200 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {formatDateTime(selectedPost.scheduled_at)}
                </p>
              </div>

              {/* Platform */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plataformas
                </span>
                <div className="flex items-center gap-2">
                  {selectedPost.platforms.map((p) => (
                    <Badge key={p} variant="outline" className="gap-1.5 capitalize">
                      {p === 'instagram' && <Instagram className="w-3 h-3" />}
                      {p === 'facebook' && <Facebook className="w-3 h-3" />}
                      {p}
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-xs">
                    {selectedPost.post_type}
                  </Badge>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </span>
                <div>
                  <Badge variant={statusMap[selectedPost.status]?.variant || 'secondary'}>
                    {statusMap[selectedPost.status]?.label || selectedPost.status}
                  </Badge>
                </div>
              </div>

              {/* Caption */}
              {selectedPost.caption && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Legenda
                  </span>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap bg-brand-surface rounded-lg p-3 border border-brand-border">
                    {selectedPost.caption}
                  </p>
                </div>
              )}

              {/* Hashtags */}
              {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hashtags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPost.hashtags.map((h, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {h.startsWith('#') ? h : `#${h}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions — only for queued posts */}
              {(selectedPost.status === 'queued') && (
                <div className="flex gap-2 pt-2 border-t border-brand-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={handleEditPost}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar agendamento
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setShowRemoveConfirm(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover da fila
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Remove confirmation modal ───────────── */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Remover agendamento?
            </DialogTitle>
            <DialogDescription>
              O post será removido da fila e o card voltará para "Aprovado". Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRemoveConfirm(false)}
              disabled={removing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleRemovePost}
              disabled={removing}
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar remoção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Page Export (with Suspense for useSearchParams) ──
export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
        </div>
      }
    >
      <CalendarPageInner />
    </Suspense>
  )
}
