'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FeatureGate } from '@/components/company/FeatureGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Sparkles,
  Play,
  RotateCcw,
  Clock,
  Music,
  Mic,
  Palette,
  Type,
  Image as ImageIcon,
  Video,
  ChevronRight,
  Loader2,
  Volume2,
  Link,
  Subtitles,
  Layers,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Upload,
  X,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────
type TemplateId =
  | 'dica_rapida'
  | 'passo_a_passo'
  | 'beneficio_destaque'
  | 'depoimento'
  | 'comparativo'
  | 'lancamento'
type PaletteId =
  | 'juntix_verde'
  | 'escuro_premium'
  | 'vibrante_tropical'
  | 'minimalista_clean'
type VoiceType = 'feminino' | 'masculino' | 'neutro'
type MusicType = 'nenhuma' | 'upbeat' | 'calma' | 'motivacional' | 'corporativa'

interface CardItem {
  _id: string
  headline: string
  subtext: string
  generated_image_url: string
  status: string
}

// ─── Constants ──────────────────────────────────
const TEMPLATES: {
  id: TemplateId
  label: string
  desc: string
  slides: number
  icon: string
}[] = [
  {
    id: 'dica_rapida',
    label: 'Dica Rapida',
    desc: '1 card + narracao curta + CTA',
    slides: 1,
    icon: '⚡',
  },
  {
    id: 'passo_a_passo',
    label: 'Passo a Passo',
    desc: '3 cards sequenciais',
    slides: 3,
    icon: '📋',
  },
  {
    id: 'beneficio_destaque',
    label: 'Beneficio em Destaque',
    desc: 'Estatistica + texto + CTA',
    slides: 2,
    icon: '📊',
  },
  {
    id: 'depoimento',
    label: 'Depoimento',
    desc: 'Texto depoimento + CTA',
    slides: 1,
    icon: '💬',
  },
  {
    id: 'comparativo',
    label: 'Comparativo',
    desc: 'Antes/depois em 2 slides',
    slides: 2,
    icon: '🔄',
  },
  {
    id: 'lancamento',
    label: 'Lancamento',
    desc: 'Teaser + reveal + CTA',
    slides: 4,
    icon: '🚀',
  },
]

const DURATIONS = [5, 10, 15, 20, 30]

const PALETTES: {
  id: PaletteId
  label: string
  colors: string[]
}[] = [
  {
    id: 'juntix_verde',
    label: 'Verde (padrao)',
    colors: ['#22c55e', '#059669', '#facc15'],
  },
  {
    id: 'escuro_premium',
    label: 'Escuro Premium',
    colors: ['#1e293b', '#0f172a', '#22d3ee'],
  },
  {
    id: 'vibrante_tropical',
    label: 'Vibrante Tropical',
    colors: ['#fb923c', '#06b6d4', '#fde047'],
  },
  {
    id: 'minimalista_clean',
    label: 'Minimalista Clean',
    colors: ['#f8fafc', '#e2e8f0', '#1e293b'],
  },
]

const VOICES: { id: VoiceType; label: string }[] = [
  { id: 'feminino', label: 'Feminino' },
  { id: 'masculino', label: 'Masculino' },
  { id: 'neutro', label: 'Neutro' },
]

const SPEEDS = [
  { value: 0.8, label: 'Lenta' },
  { value: 1.0, label: 'Normal' },
  { value: 1.2, label: 'Rapida' },
]

const MUSIC: { id: MusicType; label: string }[] = [
  { id: 'nenhuma', label: 'Nenhuma' },
  { id: 'upbeat', label: 'Animada' },
  { id: 'calma', label: 'Calma' },
  { id: 'motivacional', label: 'Motivacional' },
  { id: 'corporativa', label: 'Corporativa' },
]

// ─── Main Component ─────────────────────────────
function VideoGeneratorContent() {
  const router = useRouter()

  // Config state
  const [template, setTemplate] = useState<TemplateId>('dica_rapida')
  const [duration, setDuration] = useState(15)
  const [contentMode, setContentMode] = useState<'cards' | 'text'>('cards')
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [narration, setNarration] = useState('')
  const [voice, setVoice] = useState<VoiceType>('feminino')
  const [speed, setSpeed] = useState(1.0)
  const [music, setMusic] = useState<MusicType>('nenhuma')
  const [palette, setPalette] = useState<PaletteId>('juntix_verde')
  const [siteLink, setSiteLink] = useState('')
  const [autoSubtitle, setAutoSubtitle] = useState(true)
  const [useGemini, setUseGemini] = useState(false)
  const [title, setTitle] = useState('')

  // Slide text entries (for text mode)
  const [slideTexts, setSlideTexts] = useState<
    { title: string; text: string }[]
  >([{ title: '', text: '' }])

  // Cards for selection
  const [availableCards, setAvailableCards] = useState<CardItem[]>([])
  const [showCardSelector, setShowCardSelector] = useState(false)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generatingNarration, setGeneratingNarration] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedVideoId, setGeneratedVideoId] = useState<string | null>(null)

  // Preview state
  const [previewTime, setPreviewTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Load approved cards
  useEffect(() => {
    async function loadCards() {
      try {
        const data = await api.get<{ cards: CardItem[] }>(
          '/api/cards?status=approved&limit=50',
        )
        setAvailableCards(data.cards || [])
      } catch {
        // Ignore
      }
    }
    loadCards()
  }, [])

  // Update slide count when template changes
  useEffect(() => {
    const tmpl = TEMPLATES.find((t) => t.id === template)
    if (tmpl && contentMode === 'text') {
      const slides = Array.from({ length: tmpl.slides }, (_, i) => ({
        title: slideTexts[i]?.title || '',
        text: slideTexts[i]?.text || '',
      }))
      setSlideTexts(slides)
    }
  }, [template, contentMode])

  // Preview timer
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setPreviewTime((t) => {
        if (t >= duration) {
          setIsPlaying(false)
          return 0
        }
        return t + 0.1
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  // Suggest narration with AI
  const handleSuggestNarration = async () => {
    setGeneratingNarration(true)
    try {
      const headline =
        contentMode === 'cards' && selectedCards.length > 0
          ? availableCards.find((c) => c._id === selectedCards[0])?.headline ||
            title
          : title || slideTexts[0]?.title || 'conteudo'

      const data = await api.post<{ narration: string; hashtags: string[] }>(
        '/api/videos/generate-narration',
        {
          headline,
          subtext:
            contentMode === 'text'
              ? slideTexts.map((s) => s.text).join('. ')
              : '',
          template,
          target_duration: duration,
        },
      )
      setNarration(data.narration || '')
      toast.success('Narracao gerada com IA!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar narracao')
    } finally {
      setGeneratingNarration(false)
    }
  }

  // Generate video
  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error('Informe um titulo para o video')
      return
    }

    setGenerating(true)
    setProgress(0)

    try {
      const slides =
        contentMode === 'cards'
          ? selectedCards.map((cardId, i) => ({
              type: 'card' as const,
              card_id: cardId,
            }))
          : slideTexts.map((s, i) => ({
              type: 'text' as const,
              title: s.title,
              text: s.text,
            }))

      const res = await api.post<{
        video: { _id: string }
        jobId: string
      }>('/api/videos/generate', {
        title,
        type: template,
        template,
        target_duration: duration,
        aspect_ratio: '9:16',
        source_card_id: selectedCards[0] || undefined,
        slides,
        narration_text: narration,
        voice_type: voice,
        voice_speed: speed,
        palette,
        background_music: music,
        site_link: siteLink,
        subtitle_mode: autoSubtitle ? 'auto' : 'off',
        use_gemini_veo: useGemini,
      })

      setGeneratedVideoId(res.video._id)

      // Poll for status
      const pollStatus = async () => {
        try {
          const status = await api.get<{
            status: string
            progress: number
            error: string
          }>(`/api/videos/${res.video._id}/status`)

          setProgress(status.progress || 0)

          if (status.status === 'ready') {
            setGenerating(false)
            toast.success('Video gerado com sucesso!')
            return
          }
          if (status.status === 'failed') {
            setGenerating(false)
            toast.error(status.error || 'Falha na geracao do video')
            return
          }
          // Continue polling
          setTimeout(pollStatus, 2000)
        } catch {
          setTimeout(pollStatus, 3000)
        }
      }

      // Start polling after a short delay
      setTimeout(pollStatus, 3000)
    } catch (err: any) {
      setGenerating(false)
      toast.error(err.message || 'Erro ao gerar video')
    }
  }

  // Get the active palette colors for preview
  const activePalette = PALETTES.find((p) => p.id === palette) || PALETTES[0]

  // Get current slide based on preview time
  const templateInfo = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0]
  const slideCount =
    contentMode === 'cards'
      ? Math.max(1, selectedCards.length)
      : slideTexts.length
  const slideDuration = duration / Math.max(1, slideCount)
  const currentSlideIndex = Math.min(
    Math.floor(previewTime / slideDuration),
    slideCount - 1,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/app/videos')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-primary-400" />
            Gerador de Videos
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Crie videos curtos para Reels, TikTok e YouTube Shorts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── Left: Configuration ─────────────── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Title */}
          <div>
            <Label className="text-gray-300 text-sm">Titulo do video</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Promocao de inverno - 50% off"
              className="mt-1"
            />
          </div>

          {/* Template Selection */}
          <div>
            <Label className="text-gray-300 text-sm flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Template
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    template === t.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-brand-border bg-brand-surface hover:border-gray-600',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-sm font-medium text-white">
                      {t.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label className="text-gray-300 text-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Duracao aproximada
            </Label>
            <div className="flex gap-2 mt-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                    duration === d
                      ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                      : 'border-brand-border text-gray-400 hover:border-gray-600',
                  )}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Content Mode */}
          <div>
            <Label className="text-gray-300 text-sm">Conteudo dos slides</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={contentMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setContentMode('cards')}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Usar Cards
              </Button>
              <Button
                variant={contentMode === 'text' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setContentMode('text')}
              >
                <Type className="w-3.5 h-3.5" />
                Texto Livre
              </Button>
            </div>

            {/* Card Selector */}
            {contentMode === 'cards' && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">
                  Cards ({selectedCards.length}/{templateInfo.slides})
                </p>
                {availableCards.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {availableCards.slice(0, 10).map((card) => {
                      const isSelected = selectedCards.includes(card._id)
                      return (
                        <button
                          key={card._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCards((prev) =>
                                prev.filter((id) => id !== card._id),
                              )
                            } else if (selectedCards.length < templateInfo.slides) {
                              setSelectedCards((prev) => [...prev, card._id])
                            }
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all',
                            isSelected
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-brand-border hover:border-gray-600',
                          )}
                        >
                          <div
                            className={cn(
                              'w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
                              isSelected
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-600',
                            )}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 truncate">
                              {card.headline || 'Card sem titulo'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {card.subtext || 'Sem descricao'}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {card.status}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    Nenhum card aprovado disponivel
                  </p>
                )}
              </div>
            )}

            {/* Text Slides */}
            {contentMode === 'text' && (
              <div className="mt-3 space-y-3">
                {slideTexts.map((slide, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-brand-border bg-brand-surface space-y-2"
                  >
                    <p className="text-xs text-gray-500 font-medium">
                      Slide {i + 1}
                    </p>
                    <Input
                      placeholder="Titulo do slide"
                      value={slide.title}
                      onChange={(e) => {
                        const updated = [...slideTexts]
                        updated[i] = { ...updated[i], title: e.target.value }
                        setSlideTexts(updated)
                      }}
                    />
                    <Input
                      placeholder="Texto do slide"
                      value={slide.text}
                      onChange={(e) => {
                        const updated = [...slideTexts]
                        updated[i] = { ...updated[i], text: e.target.value }
                        setSlideTexts(updated)
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Narration */}
          <div>
            <Label className="text-gray-300 text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                Narracao
              </span>
              <span className="text-xs text-gray-500">
                {narration.length}/150
              </span>
            </Label>
            <textarea
              value={narration}
              onChange={(e) =>
                setNarration(e.target.value.slice(0, 150))
              }
              placeholder="Texto da narracao (sera convertido em voz)..."
              className="w-full mt-1 p-3 rounded-lg bg-brand-surface border border-brand-border text-sm text-gray-200 placeholder:text-gray-600 resize-none h-20 focus:outline-none focus:border-primary-500"
            />
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleSuggestNarration}
                disabled={generatingNarration}
              >
                {generatingNarration ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Sugerir com IA
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Volume2 className="w-3 h-3" />
                Ouvir
              </Button>
            </div>
          </div>

          {/* Site Link */}
          <div>
            <Label className="text-gray-300 text-sm flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" />
              Link do site
              <span className="text-xs text-gray-500 font-normal">
                (aparece no video, nao e narrado)
              </span>
            </Label>
            <Input
              value={siteLink}
              onChange={(e) => setSiteLink(e.target.value)}
              placeholder="suaempresa.com.br"
              className="mt-1"
            />
          </div>

          {/* Voice & Speed */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 text-sm">Voz</Label>
              <div className="flex flex-col gap-1.5 mt-2">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm border transition-all text-center',
                      voice === v.id
                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                        : 'border-brand-border text-gray-400 hover:border-gray-600',
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Velocidade</Label>
              <div className="flex flex-col gap-1.5 mt-2">
                {SPEEDS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSpeed(s.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm border transition-all text-center',
                      speed === s.value
                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                        : 'border-brand-border text-gray-400 hover:border-gray-600',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Music */}
          <div>
            <Label className="text-gray-300 text-sm flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              Trilha de Fundo
            </Label>
            <Select value={music} onValueChange={(v) => setMusic(v as MusicType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MUSIC.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Palette */}
          <div>
            <Label className="text-gray-300 text-sm flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              Paleta de Cores
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-xl border transition-all',
                    palette === p.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-brand-border hover:border-gray-600',
                  )}
                >
                  <div className="flex -space-x-1">
                    {p.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border-2 border-brand-card"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-300">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Subtitle Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-brand-border bg-brand-surface">
            <div className="flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Legenda automatica
                </p>
                <p className="text-xs text-gray-500">
                  Exibir texto sincronizado no video
                </p>
              </div>
            </div>
            <Switch
              checked={autoSubtitle}
              onCheckedChange={setAutoSubtitle}
            />
          </div>

          {/* Gemini Veo Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-brand-border bg-brand-surface">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Gerar com IA (Gemini)
                </p>
                <p className="text-xs text-gray-500">
                  Ate 2 videos/dia gratuitamente
                </p>
              </div>
            </div>
            <Switch checked={useGemini} onCheckedChange={setUseGemini} />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !title.trim()}
            className="w-full gap-2 h-12 text-base"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando video...
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Gerar Video
              </>
            )}
          </Button>

          {/* Generation Progress */}
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {progress < 20
                    ? 'Preparando roteiro...'
                    : progress < 50
                      ? 'Gerando narracao...'
                      : progress < 80
                        ? 'Renderizando video...'
                        : 'Finalizando...'}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        {/* ─── Center: Preview ─────────────────── */}
        <div className="lg:col-span-4">
          <div className="sticky top-20">
            <Label className="text-gray-300 text-sm flex items-center gap-1.5 mb-3">
              <Play className="w-3.5 h-3.5" />
              Preview
            </Label>

            {/* Phone Frame */}
            <div className="relative mx-auto" style={{ maxWidth: 280 }}>
              <div className="relative rounded-[2rem] border-4 border-gray-700 bg-black overflow-hidden shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl z-10" />

                {/* Video Preview Area */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: '9/16' }}
                >
                  {/* Background gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${activePalette.colors[0]}, ${activePalette.colors[1]})`,
                    }}
                  />

                  {/* Timer badge */}
                  <div className="absolute top-8 right-3 z-10">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                      <Clock className="w-3 h-3 text-white" />
                      <span className="text-xs text-white font-medium">
                        {duration}s
                      </span>
                    </div>
                  </div>

                  {/* Slide content */}
                  <div className="absolute inset-0 flex flex-col justify-center px-6">
                    {contentMode === 'cards' && selectedCards.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-white font-bold text-lg leading-tight">
                          {availableCards.find(
                            (c) => c._id === selectedCards[currentSlideIndex],
                          )?.headline || 'Titulo do card'}
                        </p>
                        <p className="text-white/80 text-sm">
                          {availableCards.find(
                            (c) => c._id === selectedCards[currentSlideIndex],
                          )?.subtext || ''}
                        </p>
                      </div>
                    ) : contentMode === 'text' &&
                      slideTexts[currentSlideIndex] ? (
                      <div className="space-y-3">
                        <p className="text-white font-bold text-lg leading-tight">
                          {slideTexts[currentSlideIndex]?.title ||
                            'Titulo do slide'}
                        </p>
                        <p className="text-white/80 text-sm">
                          {slideTexts[currentSlideIndex]?.text || ''}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <Video className="w-10 h-10 text-white/30 mx-auto" />
                        <p className="text-white/50 text-sm">
                          Selecione conteudo
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Subtitle bar */}
                  {autoSubtitle && narration && (
                    <div className="absolute bottom-12 left-4 right-4">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                        <p className="text-white text-xs text-center font-medium leading-tight">
                          {narration.slice(0, 60)}
                          {narration.length > 60 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Site link */}
                  {siteLink && (
                    <div className="absolute bottom-4 left-0 right-0">
                      <p className="text-white/40 text-[10px] text-center">
                        {siteLink}
                      </p>
                    </div>
                  )}

                  {/* Slide indicators */}
                  {slideCount > 1 && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {Array.from({ length: slideCount }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full transition-all',
                            i === currentSlideIndex
                              ? 'bg-white w-4'
                              : 'bg-white/30',
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 px-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 tabular-nums w-8">
                  {previewTime.toFixed(1)}s
                </span>
                <div className="flex-1 h-1 bg-brand-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{
                      width: `${(previewTime / duration) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 tabular-nums w-8 text-right">
                  {duration}s
                </span>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setIsPlaying(!isPlaying)
                  }}
                >
                  <Play className="w-3.5 h-3.5" />
                  {isPlaying ? 'Pausar' : 'Play'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setPreviewTime(0)
                    setIsPlaying(false)
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Resetar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right: Recent Videos ────────────── */}
        <div className="lg:col-span-3">
          <RecentVideos
            generatedVideoId={generatedVideoId}
            onViewVideo={(id) => router.push(`/app/videos`)}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Recent Videos Sidebar ──────────────────────
function RecentVideos({
  generatedVideoId,
  onViewVideo,
}: {
  generatedVideoId: string | null
  onViewVideo: (id: string) => void
}) {
  const [videos, setVideos] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<{ videos: any[] }>(
          '/api/videos?limit=5',
        )
        setVideos(data.videos || [])
      } catch {
        setVideos([])
      }
    }
    load()

    // Refresh when a new video is generated
    if (generatedVideoId) {
      const timer = setTimeout(load, 5000)
      return () => clearTimeout(timer)
    }
  }, [generatedVideoId])

  const statusMap: Record<string, { label: string; color: string }> = {
    queued: { label: 'Na fila', color: 'text-yellow-400' },
    generating: { label: 'Gerando...', color: 'text-blue-400' },
    ready: { label: 'Pronto', color: 'text-green-400' },
    failed: { label: 'Falhou', color: 'text-red-400' },
    posted: { label: 'Publicado', color: 'text-purple-400' },
  }

  return (
    <div className="sticky top-20">
      <Label className="text-gray-300 text-sm flex items-center gap-1.5 mb-3">
        <Clock className="w-3.5 h-3.5" />
        Ultimos Videos
      </Label>
      {videos.length > 0 ? (
        <div className="space-y-2">
          {videos.map((v: any) => {
            const status = statusMap[v.status] || statusMap.queued
            return (
              <button
                key={v._id}
                onClick={() => onViewVideo(v._id)}
                className="w-full p-3 rounded-xl border border-brand-border bg-brand-surface hover:border-gray-600 transition-all text-left"
              >
                <p className="text-sm font-medium text-gray-200 truncate">
                  {v.title}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={cn('text-xs font-medium', status.color)}>
                    {status.label}
                  </span>
                  <span className="text-xs text-gray-600">
                    {v.target_duration || v.duration_seconds || 15}s
                  </span>
                </div>
                {v.status === 'generating' && (
                  <div className="mt-2">
                    <Progress
                      value={v.generation_progress || 0}
                      className="h-1"
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-600 italic">
          Nenhum video criado ainda
        </p>
      )}
    </div>
  )
}

// ─── Page Export ─────────────────────────────────
export default function VideoGeneratePage() {
  return (
    <FeatureGate feature="Videos com IA">
      <VideoGeneratorContent />
    </FeatureGate>
  )
}
