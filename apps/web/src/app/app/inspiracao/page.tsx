'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, Heart, Bookmark, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface Inspiracao {
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

const FORMATOS = [
  { key: 'todos', label: 'Todos' },
  { key: 'card', label: 'Post' },
  { key: 'carrossel', label: 'Carrossel' },
  { key: 'reels', label: 'Reels' },
  { key: 'legenda', label: 'Legenda' },
]

export default function InspiracaoPage() {
  const [items, setItems] = useState<Inspiracao[]>([])
  const [loading, setLoading] = useState(true)
  const [formato, setFormato] = useState('todos')

  useEffect(() => {
    setLoading(true)
    api
      .get<{ inspiracoes: Inspiracao[] }>(
        `/api/inspiracoes${formato !== 'todos' ? `?formato=${formato}` : ''}`,
      )
      .then((d) => setItems(d.inspiracoes))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [formato])

  const salvar = async (id: string) => {
    try {
      await api.post(`/api/inspiracoes/${id}/salvar`)
      toast.success('Inspiracao salva! +5 XP')
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  const upvote = async (id: string) => {
    try {
      await api.post(`/api/inspiracoes/${id}/upvote`)
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, upvotes: i.upvotes + 1 } : i,
        ),
      )
    } catch {
      /* noop */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
          <Lightbulb className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspiracao</h1>
          <p className="text-sm text-gray-600">
            Posts de sucesso de outras empresas (anonimizados)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        <Filter className="h-4 w-4 flex-shrink-0 text-gray-400" />
        {FORMATOS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFormato(f.key)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              formato === f.key
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <Lightbulb className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-600">
            Ainda nao ha inspiracoes para o seu segmento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((i) => (
            <div
              key={i.id}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md"
            >
              <div className="relative aspect-square bg-gray-100">
                {i.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={i.thumbUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-purple-200 to-pink-200" />
                )}
                <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase text-white backdrop-blur-sm">
                  {i.formato}
                </div>
              </div>
              <div className="p-3">
                <div className="mb-2 line-clamp-2 text-xs text-gray-700">
                  {i.copy || '—'}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => upvote(i.id)}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    {i.upvotes}
                  </button>
                  <button
                    type="button"
                    onClick={() => salvar(i.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs text-purple-700 hover:bg-purple-100"
                  >
                    <Bookmark className="h-3 w-3" />
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
