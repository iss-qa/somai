'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  Coins,
  Download,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Paperclip,
  Redo2,
  RefreshCw,
  Send,
  Shapes,
  Sparkles,
  Type as TypeIcon,
  Undo2,
  Wand2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useCreditsStore } from '@/store/creditsStore'

interface CardData {
  _id: string
  company_id: string
  format: string
  post_type: string
  headline: string
  caption: string
  status: string
  generated_image_url?: string
  ai_prompt_used?: string
  createdAt: string
}

interface ChatMsg {
  id: string
  autor: 'ia' | 'user'
  texto: string
  hora: string
}

const QUICK_ACTIONS = [
  { key: 'refazer', label: 'Corrigir / Refazer', icon: RefreshCw },
  { key: 'cores', label: 'Mudar cores', icon: Sparkles },
  { key: 'fundo', label: 'Mudar fundo', icon: ImageIcon },
  { key: 'elemento', label: 'Adicionar elemento', icon: Shapes },
  { key: 'layout', label: 'Melhorar layout', icon: Wand2 },
]

function horaAgora() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EditorPage() {
  const router = useRouter()
  const params = useParams<{ cardId: string }>()
  const cardId = params.cardId

  const [card, setCard] = useState<CardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const chatRef = useRef<HTMLDivElement>(null)
  const { creditos } = useCreditsStore()

  useEffect(() => {
    if (!cardId) return
    setLoading(true)
    api
      .get<CardData>(`/api/cards/${cardId}`)
      .then((c) => {
        setCard(c)
        setChat([
          {
            id: '1',
            autor: 'ia',
            texto: '🚀 Soma 2.0: Gerando imagens com IA de última geração…',
            hora: horaAgora(),
          },
          {
            id: '2',
            autor: 'ia',
            texto: '🚀 Geração iniciada! Criando 1 slide…',
            hora: horaAgora(),
          },
          {
            id: '3',
            autor: 'ia',
            texto: '🖼️ Slide 1 gerado!',
            hora: horaAgora(),
          },
          {
            id: '4',
            autor: 'ia',
            texto:
              '🚀 Pronto! Criei sua imagem. Posso regenerar com ajustes. O que você gostaria de modificar?',
            hora: horaAgora(),
          },
        ])
      })
      .catch(() => {
        toast.error('Não foi possível carregar o card')
        router.push('/app/biblioteca')
      })
      .finally(() => setLoading(false))
  }, [cardId, router])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat])

  const enviarMensagem = async () => {
    const texto = chatInput.trim()
    if (!texto || enviando) return
    setChat((c) => [
      ...c,
      { id: String(Date.now()), autor: 'user', texto, hora: horaAgora() },
    ])
    setChatInput('')
    setEnviando(true)
    setTimeout(() => {
      setChat((c) => [
        ...c,
        {
          id: String(Date.now() + 1),
          autor: 'ia',
          texto:
            '✨ Em breve poderei aplicar ajustes diretamente na imagem. Por enquanto, anote sua intenção e use "Corrigir / Refazer" para regenerar.',
          hora: horaAgora(),
        },
      ])
      setEnviando(false)
    }, 1000)
  }

  const acaoRapida = (key: string) => {
    if (key === 'refazer') {
      toast('Refazer com IA: em breve', { icon: '🚧' })
      return
    }
    toast(`${key}: em breve`, { icon: '🚧' })
  }

  const finalizar = async () => {
    if (!card) return
    setFinalizando(true)
    try {
      await api.patch(`/api/cards/${card._id}`, { status: 'approved' })
      toast.success('Peça finalizada!')
      router.push('/app/biblioteca')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao finalizar')
    } finally {
      setFinalizando(false)
    }
  }

  const baixar = async () => {
    if (!card?.generated_image_url) return
    try {
      const res = await fetch(card.generated_image_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `soma-${card._id}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Não foi possível baixar')
    }
  }

  const aspect = useMemo(() => {
    if (!card?.format) return 'aspect-[4/5]'
    const [w, h] = card.format.split('x').map(Number)
    if (!w || !h) return 'aspect-[4/5]'
    return ''
  }, [card?.format])

  const aspectStyle = useMemo(() => {
    if (!card?.format) return undefined
    const [w, h] = card.format.split('x').map(Number)
    if (!w || !h) return undefined
    return { aspectRatio: `${w}/${h}` } as React.CSSProperties
  }, [card?.format])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!card) return null

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => router.push('/app/biblioteca')}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-700 dark:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex dark:bg-emerald-950/40 dark:text-emerald-300">
            🎁 2 edições grátis
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Coins className="h-3 w-3" />
            {creditos ?? '—'}
          </span>
          <button
            type="button"
            onClick={baixar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800"
            title="Baixar"
          >
            <Download className="h-4 w-4" />
          </button>
          <Button
            onClick={finalizar}
            disabled={finalizando}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            {finalizando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Finalizar
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Ferramentas */}
        <aside className="hidden w-56 flex-shrink-0 flex-col gap-4 border-r border-gray-200 bg-white p-4 lg:flex dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            Ferramentas
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700"
              title="Desfazer"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700"
              title="Refazer"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Adicionar ao canvas
            </div>
            <div className="flex flex-col gap-1.5">
              <ToolButton icon={TypeIcon} label="Texto" onClick={() => acaoRapida('texto')} />
              <ToolButton icon={Shapes} label="Elementos" onClick={() => acaoRapida('elementos')} />
              <ToolButton icon={ImageIcon} label="Imagens" onClick={() => acaoRapida('imagens')} />
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              IA
            </div>
            <div className="flex flex-col gap-1.5">
              <ToolButton
                icon={RefreshCw}
                label="Corrigir / Refazer"
                onClick={() => acaoRapida('refazer')}
              />
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="relative flex-1 overflow-auto bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.07),transparent_60%)] p-4 md:p-8">
          <div className="mx-auto flex h-full items-center justify-center">
            <div
              className={`relative max-h-full overflow-hidden rounded-lg border border-purple-300/60 bg-white shadow-xl ring-1 ring-purple-200/50 dark:bg-gray-900 ${aspect}`}
              style={{
                ...(aspectStyle || {}),
                maxWidth: 'min(100%, 540px)',
              }}
            >
              {card.generated_image_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.generated_image_url}
                    alt={card.headline || 'Card gerado'}
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setZoomOpen(true)}
                    className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-black/70"
                    title="Ampliar"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <ImageIcon className="h-16 w-16" />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right sidebar — Chat */}
        <aside className="flex w-full max-w-sm flex-shrink-0 flex-col border-l border-gray-200 bg-white md:w-96 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Editor IA
              </div>
              <div className="text-xs text-gray-500">Editor de slides gerados por IA</div>
            </div>
          </div>

          <div className="border-b border-gray-200 px-4 py-2 text-xs font-medium text-purple-700 dark:border-gray-800 dark:text-purple-300">
            🎯 Editando: Slide 1
          </div>

          <div ref={chatRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {chat.map((m) => (
              <ChatBubble key={m.id} msg={m} />
            ))}
            {enviando && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Editor IA está digitando…
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-3 dark:border-gray-800">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => acaoRapida(a.key)}
                  className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 transition hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
                >
                  <a.icon className="h-3 w-3" />
                  {a.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                enviarMensagem()
              }}
              className="flex items-end gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                type="button"
                className="text-gray-400 hover:text-gray-700"
                title="Anexar"
                onClick={() => toast('Anexar: em breve', { icon: '🚧' })}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviarMensagem()
                  }
                }}
                placeholder="Peça alterações no design…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || enviando}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Zoom modal */}
      {zoomOpen && card.generated_image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setZoomOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.generated_image_url}
            alt={card.headline || 'Card gerado'}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const isIA = msg.autor === 'ia'
  return (
    <div className={`flex gap-2 ${isIA ? '' : 'flex-row-reverse'}`}>
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          isIA
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isIA
            ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
            : 'bg-purple-600 text-white'
        }`}
      >
        <div className={`text-[12px] font-semibold ${isIA ? 'text-purple-700 dark:text-purple-300' : 'text-white/90'}`}>
          {isIA ? 'Editor IA' : 'Você'}
        </div>
        <div className="mt-0.5 whitespace-pre-wrap leading-snug">{msg.texto}</div>
        <div className={`mt-1 text-[10px] ${isIA ? 'text-gray-500' : 'text-white/70'}`}>
          {msg.hora}
        </div>
      </div>
    </div>
  )
}
