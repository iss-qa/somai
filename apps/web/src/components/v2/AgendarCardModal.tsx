'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Loader2, Sparkles, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'

interface ApprovedCard {
  _id: string
  headline?: string
  product_name?: string
  card_name?: string
  format?: string
  post_type?: string
  caption?: string
  hashtags?: string[]
  generated_image_url?: string
}

interface AgendarCardModalProps {
  open: boolean
  onClose: () => void
  onScheduled?: () => void
  initialDate?: Date
  initialCardId?: string | null
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'both', label: 'Instagram + Facebook' },
]

function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function cardLabel(c: ApprovedCard): string {
  return c.card_name || c.headline || c.product_name || 'Card sem titulo'
}

export function AgendarCardModal({
  open,
  onClose,
  onScheduled,
  initialDate,
  initialCardId,
}: AgendarCardModalProps) {
  const [cards, setCards] = useState<ApprovedCard[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [cardId, setCardId] = useState<string>(initialCardId || '')
  const [date, setDate] = useState<string>(toDateInputValue(initialDate || new Date()))
  const [time, setTime] = useState('10:00')
  const [repeatWeekly, setRepeatWeekly] = useState(false)
  const [platform, setPlatform] = useState<string>('instagram')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedCard = useMemo(
    () => cards.find((c) => c._id === cardId) || null,
    [cards, cardId],
  )

  useEffect(() => {
    if (!open) return
    setLoadingCards(true)
    api
      .get<{ cards: ApprovedCard[] }>('/api/cards?status=approved&limit=50')
      .then((res) => {
        setCards(res.cards || [])
        // Se veio card pre-selecionado, garante que ele esta na lista
        if (initialCardId && !res.cards?.find((c) => c._id === initialCardId)) {
          // Carrega individualmente para exibir mesmo se a listagem nao retornou
          api
            .get<ApprovedCard>(`/api/cards/${initialCardId}`)
            .then((c) => setCards((prev) => [c, ...prev]))
            .catch(() => {})
        }
      })
      .catch(() => setCards([]))
      .finally(() => setLoadingCards(false))
  }, [open, initialCardId])

  // Reseta estado quando abre
  useEffect(() => {
    if (!open) return
    setCardId(initialCardId || '')
    setDate(toDateInputValue(initialDate || new Date()))
    setTime('10:00')
    setRepeatWeekly(false)
    setPlatform('instagram')
    setCaption('')
    setHashtags('')
  }, [open, initialCardId, initialDate])

  // Ao selecionar um card, preenche legenda e hashtags sugeridas
  useEffect(() => {
    if (!selectedCard) return
    setCaption((prev) => prev || selectedCard.caption || '')
    setHashtags((prev) => {
      if (prev) return prev
      const tags = selectedCard.hashtags || []
      return tags.join(' ')
    })
  }, [selectedCard])

  const gerarLegendaIA = async () => {
    if (!cardId) {
      toast.error('Selecione um card primeiro')
      return
    }
    setGeneratingCaption(true)
    try {
      const res = await api.post<{ caption?: string; hashtags?: string[] }>(
        `/api/cards/generate-caption/${cardId}`,
        {},
      )
      if (res.caption) setCaption(res.caption)
      if (res.hashtags?.length) setHashtags(res.hashtags.join(' '))
      toast.success('Legenda gerada com IA')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao gerar legenda')
    } finally {
      setGeneratingCaption(false)
    }
  }

  const agendar = async () => {
    if (!cardId) {
      toast.error('Selecione um card aprovado')
      return
    }
    if (!date || !time) {
      toast.error('Informe data e hora')
      return
    }

    const platforms =
      platform === 'both' ? ['instagram', 'facebook'] : [platform]

    const hashtagList = hashtags
      .split(/[\s,]+/)
      .map((h) => h.trim())
      .filter(Boolean)
      .map((h) => (h.startsWith('#') ? h : `#${h}`))

    const baseDate = new Date(`${date}T${time}:00`)
    if (Number.isNaN(baseDate.getTime())) {
      toast.error('Data/hora invalida')
      return
    }

    const occurrences: Date[] = [baseDate]
    if (repeatWeekly) {
      for (let i = 1; i < 4; i++) {
        const d = new Date(baseDate)
        d.setDate(d.getDate() + 7 * i)
        occurrences.push(d)
      }
    }

    const postType = selectedCard?.post_type || 'nenhum'

    setSubmitting(true)
    try {
      for (const when of occurrences) {
        await api.post('/api/post-queue', {
          card_id: cardId,
          scheduled_at: when.toISOString(),
          platforms,
          post_type: postType,
          caption,
          hashtags: hashtagList,
        })
      }
      toast.success(
        occurrences.length > 1
          ? `${occurrences.length} agendamentos criados`
          : 'Post agendado',
      )
      onScheduled?.()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao agendar')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:rounded-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Agendar Card
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Card aprovado */}
          <div>
            <Label className="mb-1 block">Card aprovado</Label>
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              disabled={loadingCards}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="">
                {loadingCards ? 'Carregando...' : 'Selecione um card aprovado'}
              </option>
              {cards.map((c) => (
                <option key={c._id} value={c._id}>
                  {cardLabel(c)}
                  {c.format ? ` · ${c.format}` : ''}
                </option>
              ))}
            </select>
            {!loadingCards && cards.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Nenhum card aprovado. Aprove um card para poder agenda-lo.
              </p>
            )}
          </div>

          {/* Data + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block">Hora</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Repetir semanalmente */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950/50">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <Calendar className="h-4 w-4" />
              Repetir semanalmente (4 semanas)
            </div>
            <Switch checked={repeatWeekly} onCheckedChange={setRepeatWeekly} />
          </div>

          {/* Plataforma */}
          <div>
            <Label className="mb-1 block">Plataforma</Label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Legenda */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label>Legenda</Label>
              <button
                type="button"
                onClick={gerarLegendaIA}
                disabled={!cardId || generatingCaption}
                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50 dark:text-purple-400"
              >
                {generatingCaption ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Gerar com IA
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Legenda do post..."
              rows={4}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </div>

          {/* Hashtags */}
          <div>
            <Label className="mb-1 block">Hashtags</Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#marketing #design #social"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 p-4 dark:border-gray-800">
          <Button
            onClick={agendar}
            disabled={submitting || !cardId}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            Agendar
          </Button>
        </div>
      </div>
    </div>
  )
}
