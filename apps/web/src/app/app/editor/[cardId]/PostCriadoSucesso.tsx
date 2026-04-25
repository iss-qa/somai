'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CalendarPlus,
  Download,
  Heart,
  Instagram,
  Linkedin,
  Loader2,
  Save,
  Send,
  Share2,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface SuccessCard {
  _id: string
  headline: string
  caption: string
  format: string
  generated_image_url?: string
  company_handle?: string
}

const PLATAFORMAS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, supported: true },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, supported: false },
]

export function PostCriadoSucesso({
  card,
  onCaptionChange,
}: {
  card: SuccessCard
  onCaptionChange?: (s: string) => void
}) {
  const router = useRouter()
  const [caption, setCaption] = useState(card.caption || '')
  const [plataforma, setPlataforma] = useState<'instagram' | 'linkedin'>('instagram')
  const [refinando, setRefinando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const hashtags = useMemo(
    () => (caption.match(/#[\wÀ-ÿ]+/g) || []).length,
    [caption],
  )

  const plataformaAtual = PLATAFORMAS.find((p) => p.key === plataforma)!
  const handle = card.company_handle || 'sua_marca'

  const refinarCaption = async () => {
    if (refinando) return
    setRefinando(true)
    try {
      const res = await api.post<{ caption: string }>(
        `/api/cards/generate-caption/${card._id}`,
        {},
      )
      if (res?.caption) {
        setCaption(res.caption)
        onCaptionChange?.(res.caption)
        toast.success('Legenda refinada!')
      } else {
        toast('Refinamento em breve', { icon: '✨' })
      }
    } catch {
      toast('Refinamento em breve', { icon: '✨' })
    } finally {
      setRefinando(false)
    }
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      await api.patch(`/api/cards/${card._id}`, { caption })
      toast.success('Salvo!')
      router.push('/app/biblioteca')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const baixar = async () => {
    if (!card.generated_image_url) return
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

  const compartilhar = async () => {
    const text = caption || card.headline || 'Confira este post'
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: card.headline || 'Post',
          text,
          url: card.generated_image_url || window.location.href,
        })
        return
      } catch {
        /* usuario cancelou */
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Legenda copiada!')
    } catch {
      toast.error('Não foi possível compartilhar')
    }
  }

  const publicar = () => {
    toast('Publicação direta em breve. Use Baixar e poste manualmente.', {
      icon: '📅',
      duration: 3500,
    })
  }

  return (
    <div className="absolute inset-0 z-40 overflow-auto bg-gradient-to-b from-purple-50 via-white to-white px-6 py-10 dark:from-purple-950/30 dark:via-gray-950 dark:to-gray-950">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-purple-200/40" />
            <div className="relative">
              <MascoteTrofeu />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            Post Criado com Sucesso! 🎉
          </h1>
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            O SOCI está orgulhoso de você! Seu conteúdo está pronto.
          </p>
        </div>

        {/* Conteudo */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Preview Instagram */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Preview do Post
            </div>
            <div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl bg-black shadow-xl">
              {card.generated_image_url ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.generated_image_url}
                    alt={card.headline}
                    className="block h-auto w-full"
                  />
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                        {handle.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-white drop-shadow">
                      {handle}
                      <span className="ml-1 text-white/70">· 2h</span>
                    </div>
                  </div>
                  <div className="absolute inset-x-3 bottom-12 rounded-lg bg-black/40 p-2 backdrop-blur-sm">
                    <p className="line-clamp-2 text-xs text-white">
                      {caption || card.headline}
                    </p>
                  </div>
                  <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur">
                    <span className="flex-1 text-[11px] text-white/70">
                      Enviar mensagem
                    </span>
                    <Heart className="h-3.5 w-3.5 text-white" />
                    <Send className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center text-gray-500">
                  Sem imagem
                </div>
              )}
            </div>
          </div>

          {/* Legenda + acoes */}
          <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Legenda Final
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <plataformaAtual.icon className="h-3 w-3" />
                  {plataformaAtual.label}
                </span>
              </div>
              <textarea
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value)
                  onCaptionChange?.(e.target.value)
                }}
                rows={8}
                maxLength={2000}
                className="w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {caption.length}/2000 caracteres · {hashtags} hashtags
                </span>
                <button
                  type="button"
                  onClick={refinarCaption}
                  disabled={refinando}
                  className="inline-flex items-center gap-1 font-medium text-purple-700 hover:text-purple-900 disabled:opacity-50 dark:text-purple-300"
                >
                  {refinando ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Refinar com IA
                </button>
              </div>
            </div>

            {/* Plataformas */}
            <div className="mt-4 flex flex-wrap gap-2">
              {PLATAFORMAS.map((p) => {
                const active = p.key === plataforma
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPlataforma(p.key as any)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                    }`}
                  >
                    <p.icon className="h-3.5 w-3.5" />
                    {p.label}
                  </button>
                )
              })}
            </div>
            {!plataformaAtual.supported && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5" />
                {plataformaAtual.label} não suporta este formato
              </div>
            )}

            {/* Acoes */}
            <Button
              onClick={publicar}
              className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
              size="lg"
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              Publicar
            </Button>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={baixar}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar
              </button>
              <button
                type="button"
                onClick={compartilhar}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <Share2 className="h-3.5 w-3.5" />
                Compartilhar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MascoteTrofeu() {
  return (
    <svg viewBox="0 0 140 140" className="h-28 w-28" aria-hidden>
      <defs>
        <radialGradient id="bodyG" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
        <linearGradient id="trophyG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="125" rx="34" ry="4" fill="rgba(0,0,0,0.15)" />
      <path
        d="M36 70 Q36 32 70 32 Q104 32 104 70 L104 95 Q104 118 70 118 Q36 118 36 95 Z"
        fill="url(#bodyG)"
      />
      <path d="M67 24 L75 12 L83 28 Z" fill="#22d3ee" stroke="#0e7490" strokeWidth="1" />
      <circle cx="58" cy="62" r="9" fill="white" />
      <circle cx="82" cy="62" r="9" fill="white" />
      <circle cx="60" cy="64" r="4.5" fill="#1e1b4b" />
      <circle cx="84" cy="64" r="4.5" fill="#1e1b4b" />
      <circle cx="61" cy="63" r="1.5" fill="white" />
      <circle cx="85" cy="63" r="1.5" fill="white" />
      <path
        d="M58 78 Q70 88 82 78"
        stroke="#1e1b4b"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Trofeu */}
      <g transform="translate(85,80) rotate(15)">
        <rect x="-10" y="-2" width="20" height="14" rx="2" fill="url(#trophyG)" />
        <path d="M-12 -2 Q-22 4 -12 12" stroke="#d97706" strokeWidth="2.5" fill="none" />
        <path d="M12 -2 Q22 4 12 12" stroke="#d97706" strokeWidth="2.5" fill="none" />
        <rect x="-4" y="12" width="8" height="4" fill="#92400e" />
        <rect x="-8" y="16" width="16" height="3" rx="1" fill="#78350f" />
        <circle cx="0" cy="4" r="2" fill="#fef3c7" opacity="0.6" />
      </g>
    </svg>
  )
}
