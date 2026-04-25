'use client'

import { useEffect, useState } from 'react'
import {
  MessageCircle,
  ChevronUp,
  Plus,
  Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

interface Post {
  id: string
  titulo: string
  conteudo: string
  autor: string
  avatar_url: string
  tags: string[]
  upvotes: number
  respostas: number
  resolvido: boolean
  createdAt: string
}

const TAGS = [
  { key: 'todas', label: 'Todas' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'ia', label: 'IA' },
  { key: 'estrategia', label: 'Estrategia' },
]

export default function ComunidadePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [tag, setTag] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])

  const load = () => {
    setLoading(true)
    api
      .get<{ posts: Post[] }>(
        `/api/comunidade${tag !== 'todas' ? `?tag=${tag}` : ''}`,
      )
      .then((d) => setPosts(d.posts))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag])

  const publicar = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      toast.error('Preencha titulo e conteudo')
      return
    }
    try {
      await api.post('/api/comunidade', {
        titulo,
        conteudo,
        tags: formTags,
      })
      toast.success('Pergunta publicada!')
      setTitulo('')
      setConteudo('')
      setFormTags([])
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Erro')
    }
  }

  const upvote = async (id: string) => {
    try {
      await api.post(`/api/comunidade/${id}/upvote`)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p,
        ),
      )
    } catch {
      /* noop */
    }
  }

  const toggleFormTag = (t: string) => {
    setFormTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comunidade</h1>
            <p className="text-sm text-gray-600">
              Troque experiencias com outros empreendedores
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" />
          Nova pergunta
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border border-purple-200 bg-white p-4">
          <Input
            placeholder="Titulo da sua pergunta"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <textarea
            placeholder="Descreva sua duvida..."
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <div className="flex flex-wrap gap-2">
            {TAGS.filter((t) => t.key !== 'todas').map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => toggleFormTag(t.key)}
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  formTags.includes(t.key)
                    ? 'border-purple-500 bg-purple-100 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-purple-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={publicar}>Publicar</Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto">
        <Tag className="h-4 w-4 flex-shrink-0 text-gray-400" />
        {TAGS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTag(t.key)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              tag === t.key
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-600">
            Seja o primeiro a fazer uma pergunta!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <button
                type="button"
                onClick={() => upvote(p.id)}
                className="flex flex-col items-center rounded-lg border border-gray-100 px-2 py-1 text-gray-600 hover:border-purple-300 hover:text-purple-600"
              >
                <ChevronUp className="h-4 w-4" />
                <span className="text-xs font-semibold">{p.upvotes}</span>
              </button>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h3 className="font-semibold text-gray-900">{p.titulo}</h3>
                <p className="line-clamp-2 text-sm text-gray-600">
                  {p.conteudo}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <span>{p.autor || 'Anonimo'}</span>
                  <span>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                  <span>{p.respostas} respostas</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
