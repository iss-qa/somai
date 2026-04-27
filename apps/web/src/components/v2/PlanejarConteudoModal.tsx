'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FileText,
  Link2,
  Upload,
  PenLine,
  Lightbulb,
  Calendar as CalendarIcon,
  Clock,
  Instagram,
  Linkedin,
  X,
  Loader2,
  Image as ImageIcon,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

type Mode = 'existente' | 'upload' | 'escrever' | 'inspiracao'
type PlatformKey = 'instagram' | 'linkedin'

interface ExistentePost {
  _id: string
  headline?: string
  product_name?: string
  card_name?: string
  format?: string
  generated_image_url?: string
}

interface InspiracaoItem {
  id: string
  imageUrl?: string
  thumbUrl?: string
  copy: string
  hashtags?: string[]
  formato?: string
  objetivo?: string
}

interface PlanejarConteudoModalProps {
  open: boolean
  initialDate?: Date
  onClose: () => void
  onCreated?: () => void
}

const TABS: { key: Mode; label: string; icon: typeof Link2 }[] = [
  { key: 'existente', label: 'Post existente', icon: Link2 },
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'escrever', label: 'Escrever', icon: PenLine },
  { key: 'inspiracao', label: 'Inspiração', icon: Lightbulb },
]

function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function PlanejarConteudoModal({
  open,
  initialDate,
  onClose,
  onCreated,
}: PlanejarConteudoModalProps) {
  const [mode, setMode] = useState<Mode>('existente')
  const [date, setDate] = useState(toDateInputValue(initialDate || new Date()))
  const [time, setTime] = useState('10:00')
  const [platforms, setPlatforms] = useState<PlatformKey[]>(['instagram'])
  const [submitting, setSubmitting] = useState(false)

  // Post existente
  const [postsLib, setPostsLib] = useState<ExistentePost[]>([])
  const [loadingLib, setLoadingLib] = useState(false)
  const [showLibPicker, setShowLibPicker] = useState(false)
  const [selectedExistenteId, setSelectedExistenteId] = useState<string>('')

  // Upload
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string>('')
  const [uploadCaption, setUploadCaption] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Escrever
  const [escreverTitle, setEscreverTitle] = useState('')
  const [escreverDesc, setEscreverDesc] = useState('')

  // Inspiração
  const [inspiracoes, setInspiracoes] = useState<InspiracaoItem[]>([])
  const [loadingInsp, setLoadingInsp] = useState(false)
  const [selectedInspId, setSelectedInspId] = useState<string>('')

  const selectedExistente = useMemo(
    () => postsLib.find((p) => p._id === selectedExistenteId) || null,
    [postsLib, selectedExistenteId],
  )

  const selectedInsp = useMemo(
    () => inspiracoes.find((i) => i.id === selectedInspId) || null,
    [inspiracoes, selectedInspId],
  )

  // Reset when reopening
  useEffect(() => {
    if (!open) return
    setMode('existente')
    setDate(toDateInputValue(initialDate || new Date()))
    setTime('10:00')
    setPlatforms(['instagram'])
    setSelectedExistenteId('')
    setShowLibPicker(false)
    setUploadTitle('')
    setUploadFile(null)
    setUploadPreview('')
    setUploadCaption('')
    setEscreverTitle('')
    setEscreverDesc('')
    setSelectedInspId('')
  }, [open, initialDate])

  // Load library when needed
  useEffect(() => {
    if (!open || mode !== 'existente' || postsLib.length > 0) return
    setLoadingLib(true)
    api
      .get<{ cards: ExistentePost[] }>('/api/cards?status=approved&limit=100')
      .then((r) => setPostsLib(r.cards || []))
      .catch(() => setPostsLib([]))
      .finally(() => setLoadingLib(false))
  }, [open, mode, postsLib.length])

  // Load inspiracoes when needed
  useEffect(() => {
    if (!open || mode !== 'inspiracao' || inspiracoes.length > 0) return
    setLoadingInsp(true)
    api
      .get<{ inspiracoes: InspiracaoItem[] }>('/api/inspiracoes?limit=24')
      .then((r) => setInspiracoes(r.inspiracoes || []))
      .catch(() => setInspiracoes([]))
      .finally(() => setLoadingInsp(false))
  }, [open, mode, inspiracoes.length])

  if (!open) return null

  const togglePlatform = (p: PlatformKey) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )
  }

  const handleFile = async (f: File | null) => {
    if (!f) return
    if (f.size > 100 * 1024 * 1024) {
      toast.error('Arquivo acima do limite (100MB)')
      return
    }
    if (
      !f.type.startsWith('image/') &&
      !f.type.startsWith('video/')
    ) {
      toast.error('Apenas imagem (JPG/PNG) ou vídeo (MP4/MOV)')
      return
    }
    setUploadFile(f)
    if (f.type.startsWith('image/')) {
      const url = await fileToDataUrl(f)
      setUploadPreview(url)
    } else {
      setUploadPreview('')
    }
  }

  const buildScheduledAtIso = (): string | null => {
    if (!date || !time) return null
    const iso = new Date(`${date}T${time}:00`)
    if (Number.isNaN(iso.getTime())) return null
    return iso.toISOString()
  }

  const validateCommon = (): { ok: boolean; iso?: string } => {
    const iso = buildScheduledAtIso()
    if (!iso) {
      toast.error('Data ou horário inválido')
      return { ok: false }
    }
    if (platforms.length === 0) {
      toast.error('Selecione ao menos uma plataforma')
      return { ok: false }
    }
    return { ok: true, iso }
  }

  const isValid = (): boolean => {
    if (!buildScheduledAtIso()) return false
    if (platforms.length === 0) return false
    if (mode === 'existente') return !!selectedExistenteId
    if (mode === 'upload') return !!uploadTitle.trim() && !!uploadFile
    if (mode === 'escrever') return !!escreverTitle.trim()
    if (mode === 'inspiracao') return !!selectedInspId
    return false
  }

  const createDraftCard = async (payload: {
    headline: string
    subtext?: string
    caption?: string
    hashtags?: string[]
  }): Promise<string> => {
    const res = await api.post<{ card: { _id: string } }>('/api/cards/generate', {
      template_id: '',
      format: 'feed',
      post_type: 'nenhum',
      headline: payload.headline,
      subtext: payload.subtext || '',
      caption: payload.caption || '',
      hashtags: payload.hashtags || [],
    })
    return res.card._id
  }

  const submitExistente = async (iso: string) => {
    if (!selectedExistente) return
    await api.post('/api/post-queue', {
      card_id: selectedExistente._id,
      scheduled_at: iso,
      platforms,
      post_type: 'nenhum',
    })
  }

  const submitUpload = async (iso: string) => {
    if (!uploadFile) return
    const cardId = await createDraftCard({
      headline: uploadTitle.trim(),
      caption: uploadCaption,
    })
    const dataUrl = await fileToDataUrl(uploadFile)
    let mediaUrl = ''
    let mediaType: 'image' | 'video' = uploadFile.type.startsWith('video/') ? 'video' : 'image'
    if (mediaType === 'image') {
      const up = await api.post<{ url: string }>(`/api/cards/${cardId}/upload`, {
        dataUrl,
        kind: 'composite',
      })
      mediaUrl = up.url
    }
    await api.patch(`/api/cards/${cardId}`, {
      ...(mediaUrl
        ? mediaType === 'image'
          ? { generated_image_url: mediaUrl, media_type: 'image' }
          : { generated_video_url: mediaUrl, media_type: 'video' }
        : {}),
      caption: uploadCaption,
    })
    await api.post('/api/post-queue', {
      card_id: cardId,
      scheduled_at: iso,
      platforms,
      post_type: 'nenhum',
      caption: uploadCaption,
    })
  }

  const submitEscrever = async (iso: string) => {
    const cardId = await createDraftCard({
      headline: escreverTitle.trim(),
      subtext: escreverDesc,
    })
    await api.post('/api/post-queue', {
      card_id: cardId,
      scheduled_at: iso,
      platforms,
      post_type: 'nenhum',
      caption: escreverDesc,
    })
  }

  const submitInspiracao = async (iso: string) => {
    if (!selectedInsp) return
    const cardId = await createDraftCard({
      headline: `Inspiração: ${selectedInsp.copy.slice(0, 60)}`,
      subtext: selectedInsp.copy,
      caption: selectedInsp.copy,
      hashtags: selectedInsp.hashtags || [],
    })
    await api.post('/api/post-queue', {
      card_id: cardId,
      scheduled_at: iso,
      platforms,
      post_type: 'nenhum',
      caption: selectedInsp.copy,
    })
  }

  const handleSubmit = async () => {
    const v = validateCommon()
    if (!v.ok || !v.iso) return
    if (!isValid()) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'existente') await submitExistente(v.iso)
      else if (mode === 'upload') await submitUpload(v.iso)
      else if (mode === 'escrever') await submitEscrever(v.iso)
      else if (mode === 'inspiracao') await submitInspiracao(v.iso)
      toast.success('Pauta criada')
      onCreated?.()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao criar pauta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Planejar Conteúdo
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Crie uma pauta para depois vincular ou criar o conteúdo
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-3">
          {/* Tabs */}
          <div>
            <div className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Como você quer planejar?
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {TABS.map((t) => {
                const Icon = t.icon
                const active = mode === t.key
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setMode(t.key)}
                    className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'border-transparent bg-purple-600 text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab content */}
          {mode === 'existente' && (
            <div>
              <Label className="mb-1 block">
                Post selecionado <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowLibPicker((v) => !v)}
                className="flex w-full items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm text-gray-600 hover:border-purple-300 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400"
              >
                <Link2 className="h-4 w-4 text-purple-500" />
                {selectedExistente ? (
                  <span className="flex min-w-0 items-center gap-2 text-gray-900 dark:text-white">
                    {selectedExistente.generated_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedExistente.generated_image_url}
                        alt=""
                        className="h-7 w-7 flex-shrink-0 rounded object-cover"
                      />
                    )}
                    <span className="truncate">
                      {selectedExistente.headline ||
                        selectedExistente.product_name ||
                        selectedExistente.card_name ||
                        'Post sem título'}
                    </span>
                  </span>
                ) : (
                  'Selecionar um post da biblioteca'
                )}
              </button>
              {showLibPicker && (
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-950">
                  {loadingLib ? (
                    <div className="flex items-center justify-center py-6 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : postsLib.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500">
                      Nenhum post aprovado na biblioteca.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {postsLib.map((p) => {
                        const sel = p._id === selectedExistenteId
                        const titulo =
                          p.headline ||
                          p.product_name ||
                          p.card_name ||
                          'Post sem título'
                        return (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => {
                              setSelectedExistenteId(p._id)
                              setShowLibPicker(false)
                            }}
                            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${
                              sel
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                                : 'border-gray-200 hover:border-purple-300 dark:border-gray-800'
                            }`}
                          >
                            {p.generated_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.generated_image_url}
                                alt=""
                                className="h-9 w-9 flex-shrink-0 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                                <ImageIcon className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            <span className="truncate text-gray-900 dark:text-white">
                              {titulo}
                            </span>
                            {sel && (
                              <Check className="ml-auto h-3.5 w-3.5 text-purple-600" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block">
                  Título da pauta <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Ex: Reels de quinta"
                />
              </div>
              <div>
                <Label className="mb-1 block">
                  Mídia <span className="text-red-500">*</span>
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const f = e.dataTransfer.files?.[0]
                    if (f) handleFile(f)
                  }}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/40 px-4 py-8 text-center text-sm text-gray-600 transition hover:border-purple-400 hover:bg-purple-50/40 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-400"
                >
                  {uploadPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={uploadPreview}
                      alt=""
                      className="max-h-40 rounded-lg object-contain"
                    />
                  ) : uploadFile ? (
                    <div className="text-gray-700 dark:text-gray-300">
                      {uploadFile.name}
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                      <div className="font-medium text-gray-700 dark:text-gray-300">
                        Arraste arquivos ou clique para enviar
                      </div>
                      <div className="text-xs text-gray-500">
                        JPG/PNG (até 10MB) ou MP4/MOV (até 100MB). Vídeo vira
                        Reels no Instagram.
                      </div>
                    </>
                  )}
                </button>
              </div>
              <div>
                <Label className="mb-1 block">Legenda (opcional)</Label>
                <textarea
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Escreva a legenda do post..."
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
                <div className="mt-1 text-right text-[10px] text-gray-400">
                  {uploadCaption.length}/2000
                </div>
              </div>
            </div>
          )}

          {mode === 'escrever' && (
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block">
                  Título da pauta <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={escreverTitle}
                  onChange={(e) => setEscreverTitle(e.target.value)}
                  placeholder="Ex: Tutorial de terça-feira"
                />
              </div>
              <div>
                <Label className="mb-1 block">Descrição (opcional)</Label>
                <textarea
                  value={escreverDesc}
                  onChange={(e) => setEscreverDesc(e.target.value)}
                  rows={4}
                  placeholder="Descreva a ideia do conteúdo..."
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>
            </div>
          )}

          {mode === 'inspiracao' && (
            <div>
              <Label className="mb-1 block">
                Inspiração <span className="text-red-500">*</span>
              </Label>
              {loadingInsp ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                </div>
              ) : inspiracoes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-xs text-gray-500 dark:border-gray-700">
                  Nenhuma inspiração disponível no momento.
                </div>
              ) : (
                <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3">
                  {inspiracoes.map((i) => {
                    const sel = i.id === selectedInspId
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setSelectedInspId(i.id)}
                        className={`flex flex-col gap-1 rounded-lg border p-2 text-left transition ${
                          sel
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                            : 'border-gray-200 hover:border-purple-300 dark:border-gray-800'
                        }`}
                      >
                        {(i.thumbUrl || i.imageUrl) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={i.thumbUrl || i.imageUrl}
                            alt=""
                            className="h-20 w-full rounded object-cover"
                          />
                        )}
                        <div className="line-clamp-2 text-[11px] text-gray-700 dark:text-gray-300">
                          {i.copy}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Data</Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Horário</Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Plataformas */}
          <div>
            <Label className="mb-1 block">Plataformas</Label>
            <div className="grid grid-cols-2 gap-2">
              <PlataformaToggle
                ativo={platforms.includes('instagram')}
                onClick={() => togglePlatform('instagram')}
                icon={<Instagram className="h-4 w-4" />}
                label="Instagram"
              />
              <PlataformaToggle
                ativo={platforms.includes('linkedin')}
                onClick={() => togglePlatform('linkedin')}
                icon={<Linkedin className="h-4 w-4" />}
                label="LinkedIn"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 p-4 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !isValid()}
            className="bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Criar Pauta
          </Button>
        </div>
      </div>
    </div>
  )
}

function PlataformaToggle({
  ativo,
  onClick,
  icon,
  label,
}: {
  ativo: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
        ativo
          ? 'border-transparent bg-purple-600 text-white shadow-sm'
          : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
      }`}
    >
      {icon}
      {label}
      {ativo && <Check className="h-3.5 w-3.5" />}
    </button>
  )
}
