'use client'

import { useEffect, useState } from 'react'
import { X, Lightbulb, Bookmark, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import type { CriarWizardApi } from '../hooks/useCriarWizard'

type Categoria = 'todas' | 'trends' | 'noticias' | 'datas' | 'oportunidades'

const CATEGORIAS: { key: Categoria; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'trends', label: 'Trends' },
  { key: 'noticias', label: 'Noticias' },
  { key: 'datas', label: 'Datas' },
  { key: 'oportunidades', label: 'Oportunidades' },
]

interface InspiracaoItem {
  id: string
  imageUrl: string
  thumbUrl: string
  segmento: string
  formato: string
  objetivo: string
  copy: string
  hashtags: string[]
  upvotes: number
}

const PAGE_SIZE = 6

export function InspiracaoModal({ w }: { w: CriarWizardApi }) {
  const [categoria, setCategoria] = useState<Categoria>('todas')
  const [items, setItems] = useState<InspiracaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!w.showInspiracaoModal) return
    setLoading(true)
    api
      .get<{ inspiracoes: InspiracaoItem[] }>('/api/inspiracoes?limit=24')
      .then((d) => setItems(d.inspiracoes || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [w.showInspiracaoModal])

  useEffect(() => {
    setPage(0)
  }, [categoria])

  if (!w.showInspiracaoModal) return null

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const paginatedItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const salvar = async (id: string) => {
    try {
      await api.post(`/api/inspiracoes/${id}/salvar`)
      toast.success('Inspiracao salva! +5 XP')
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  const formatoLabel: Record<string, string> = {
    card: 'Post',
    carrossel: 'Carrossel',
    reels: 'Reels',
    stories: 'Stories',
    legenda: 'Legenda',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && w.setShowInspiracaoModal(false)}
    >
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">
                  Biblioteca de Inspiracoes
                </div>
                <p className="text-xs text-white/80">
                  Escolha um tema pronto para criar seu post
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => w.setShowInspiracaoModal(false)}
              className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Categorias */}
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {CATEGORIAS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategoria(c.key)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  categoria === c.key
                    ? 'bg-white text-orange-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Lightbulb className="h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">
                Inspiracoes em breve! Estamos curadoria o melhor conteudo para voce.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {item.thumbUrl || item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbUrl || item.imageUrl}
                        alt={item.copy}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <Lightbulb className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-medium text-white">
                      {formatoLabel[item.formato] || item.formato}
                    </span>
                    <button
                      type="button"
                      onClick={() => salvar(item.id)}
                      className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 text-gray-600 opacity-0 transition hover:bg-white group-hover:opacity-100"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs text-gray-700 dark:text-gray-300">
                      {item.copy}
                    </p>
                    {item.objetivo && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-[10px] text-pink-600 dark:bg-pink-950/30 dark:text-pink-300">
                        {item.objetivo === 'engajar' ? '♡ Engajamento' : '$ Vender'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800">
            <span className="text-xs text-gray-500">
              {items.length} inspiracoes disponiveis
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500">
                Pagina {page + 1} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => w.setShowInspiracaoModal(false)}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
