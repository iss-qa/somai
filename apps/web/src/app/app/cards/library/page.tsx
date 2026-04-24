'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { checkIntegrationStatus } from '@/lib/integration-check'
import SetupRequiredModal from '@/components/setup/SetupRequiredModal'
import {
  Image as ImageIcon,
  Calendar,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Filter,
  Check,
  Square,
  CheckSquare,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface CardItem {
  _id: string
  headline: string
  product_name?: string
  format: string
  status: 'approved' | 'draft' | 'archived' | 'scheduled' | 'posted'
  generated_image_url?: string
  createdAt: string
  post_type?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusConfig: Record<
  string,
  {
    label: string
    variant: 'success' | 'secondary' | 'warning' | 'default' | 'info'
    dot?: string
    cardClass?: string
  }
> = {
  draft: {
    label: 'Rascunho',
    variant: 'secondary',
    dot: 'bg-gray-400',
  },
  approved: {
    label: 'Aprovado',
    variant: 'success',
    cardClass: 'ring-1 ring-emerald-500/40',
  },
  scheduled: {
    label: 'Agendado',
    variant: 'info',
  },
  posted: {
    label: 'Publicado',
    variant: 'default',
  },
  archived: {
    label: 'Arquivado',
    variant: 'secondary',
    cardClass: 'opacity-50',
  },
}

const formatLabels: Record<string, string> = {
  feed: 'Feed',
  stories: 'Stories',
  reels: 'Reels',
}

export default function CardLibraryPage() {
  const router = useRouter()
  const [cards, setCards] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formatFilter, setFormatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [showSetupRequired, setShowSetupRequired] = useState(false)
  const [checkingIntegration, setCheckingIntegration] = useState(false)

  async function handleAgendar(cardId: string) {
    if (checkingIntegration) return
    setCheckingIntegration(true)
    try {
      const connected = await checkIntegrationStatus()
      if (connected) {
        router.push(`/app/calendar?card=${cardId}`)
      } else {
        setShowSetupRequired(true)
      }
    } finally {
      setCheckingIntegration(false)
    }
  }

  const hasSelection = selectedIds.size > 0

  const loadCards = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (formatFilter !== 'all') params.set('format', formatFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('page', String(page))
      params.set('limit', '20')

      const data = await api.get<{ cards: CardItem[]; pagination: PaginationInfo }>(
        `/api/cards?${params.toString()}`
      )
      setCards(data.cards || [])
      setPagination(data.pagination || null)
    } catch {
      setCards([])
      toast.error('Erro ao carregar cards')
    } finally {
      setLoading(false)
    }
  }, [formatFilter, statusFilter, page])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [formatFilter, statusFilter])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === cards.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(cards.map((c) => c._id)))
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return

    const count = selectedIds.size
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir ${count} card${count > 1 ? 's' : ''}?`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const promises = Array.from(selectedIds).map((id) =>
        api.delete(`/api/cards/${id}`)
      )
      await Promise.all(promises)
      toast.success(`${count} card${count > 1 ? 's' : ''} excluído${count > 1 ? 's' : ''}`)
      setSelectedIds(new Set())
      loadCards()
    } catch {
      toast.error('Erro ao excluir cards')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Biblioteca de Cards</h2>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie todos os cards criados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 text-xs"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === cards.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </Button>
          )}
          <Button
            className="gap-2 w-full sm:w-auto"
            onClick={() => router.push('/app/cards/generate')}
          >
            <Plus className="w-4 h-4" />
            Novo Card
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={formatFilter} onValueChange={setFormatFilter} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="reels">Reels</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="posted">Publicados</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : cards.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map((card) => {
              const status = statusConfig[card.status] || statusConfig.draft
              const isSelected = selectedIds.has(card._id)
              const isArchived = card.status === 'archived'

              return (
                <Card
                  key={card._id}
                  className={`overflow-hidden group relative transition-all duration-200 ${
                    status.cardClass || ''
                  } ${
                    isSelected
                      ? 'ring-2 ring-primary-500 bg-primary-500/5'
                      : ''
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelect(card._id)
                    }}
                    className={`absolute top-2 left-2 z-20 transition-opacity duration-150 ${
                      hasSelection || isSelected
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary-500 drop-shadow-md" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 drop-shadow-md" />
                    )}
                  </button>

                  {/* Thumbnail */}
                  <div
                    className={`aspect-[4/5] bg-brand-dark flex items-center justify-center overflow-hidden relative ${
                      isArchived ? 'grayscale' : ''
                    }`}
                  >
                    {card.generated_image_url ? (
                      <img
                        src={card.generated_image_url}
                        alt={card.headline}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-700" />
                    )}

                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1 text-xs h-7 px-2"
                        onClick={() =>
                          router.push(`/app/cards/generate?edit=${card._id}`)
                        }
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1 text-xs h-7 px-2"
                        disabled={checkingIntegration}
                        onClick={() => handleAgendar(card._id)}
                      >
                        <Calendar className="w-3 h-3" />
                        Agendar
                      </Button>
                    </div>
                  </div>

                  {/* Card info */}
                  <CardContent className="px-2.5 py-2 space-y-1">
                    {/* Line 1: Card name */}
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {card.product_name || card.headline}
                    </p>

                    {/* Line 2: Format + Status + Date */}
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {formatLabels[card.format] || card.format}
                      </Badge>
                      <Badge variant={status.variant} className="text-[10px] px-1.5 py-0 gap-0.5 shrink-0">
                        {status.dot && (
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        )}
                        {card.status === 'approved' && (
                          <Check className="w-2.5 h-2.5" />
                        )}
                        {status.label}
                      </Badge>
                      <span className="text-[11px] text-gray-500 ml-auto shrink-0">
                        {formatDate(card.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-400">
                Pagina {page} de {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">
            Nenhum card encontrado
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Crie seu primeiro card com inteligencia artificial
          </p>
          <Button
            className="gap-2"
            onClick={() => router.push('/app/cards/generate')}
          >
            <Plus className="w-4 h-4" />
            Gerar primeiro Card
          </Button>
        </div>
      )}

      {/* Floating multi-select action bar */}
      {hasSelection && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-card border border-brand-border rounded-lg shadow-2xl px-5 py-3 flex items-center gap-4 animate-fadeIn">
          <span className="text-sm text-gray-300 whitespace-nowrap">
            {selectedIds.size} card{selectedIds.size > 1 ? 's' : ''} selecionado
            {selectedIds.size > 1 ? 's' : ''}
          </span>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            disabled={deleting}
            onClick={deleteSelected}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Excluir selecionados
          </Button>
        </div>
      )}

      <SetupRequiredModal open={showSetupRequired} onClose={() => setShowSetupRequired(false)} />
    </div>
  )
}
