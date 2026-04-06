'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FeatureGate } from '@/components/company/FeatureGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Target,
  Users,
  DollarSign,
  MonitorPlay,
  Eye,
  Sparkles,
  Image as ImageIcon,
  Video,
  MapPin,
  Loader2,
  Plus,
  X,
  Globe,
  Instagram,
  Facebook,
  TrendingUp,
  Send,
  MessageCircle,
  ShoppingCart,
  Megaphone,
  Store,
  Heart,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────

interface CardItem {
  _id: string
  headline: string
  subtext: string
  generated_image_url: string
  format: string
}

interface VideoItem {
  _id: string
  title: string
  thumbnail_url: string
  template: string
  status: string
}

interface Interest {
  name: string
  category: string
}

// ─── Campaign Types ─────────────────────────────

const CAMPAIGN_TYPES = [
  { id: 'awareness', label: 'Reconhecimento', desc: 'Mais pessoas conhecendo sua marca', icon: Megaphone, color: 'text-blue-400' },
  { id: 'traffic', label: 'Trafego', desc: 'Levar visitantes ao site/WhatsApp', icon: TrendingUp, color: 'text-green-400' },
  { id: 'engagement', label: 'Engajamento', desc: 'Curtidas, comentarios, compartilhamentos', icon: Heart, color: 'text-pink-400' },
  { id: 'leads', label: 'Leads', desc: 'Capturar contatos de clientes', icon: Users, color: 'text-purple-400' },
  { id: 'sales', label: 'Vendas', desc: 'Conversoes e vendas diretas', icon: ShoppingCart, color: 'text-yellow-400' },
  { id: 'messages', label: 'Mensagens', desc: 'Conversas no WhatsApp/DM', icon: MessageCircle, color: 'text-emerald-400' },
  { id: 'local_store', label: 'Loja Fisica', desc: 'Visitas a sua loja', icon: Store, color: 'text-orange-400' },
]

const CTA_OPTIONS = [
  { value: 'LEARN_MORE', label: 'Saiba mais' },
  { value: 'SHOP_NOW', label: 'Comprar agora' },
  { value: 'SEND_MESSAGE', label: 'Enviar mensagem' },
  { value: 'CALL_NOW', label: 'Ligar agora' },
  { value: 'SIGN_UP', label: 'Cadastrar' },
  { value: 'BOOK_NOW', label: 'Reservar' },
  { value: 'WHATSAPP_MESSAGE', label: 'Chamar no WhatsApp' },
]

const DURATION_OPTIONS = [
  { value: 3, label: '3 dias' },
  { value: 7, label: '7 dias' },
  { value: 14, label: '14 dias' },
  { value: 30, label: '30 dias' },
]

const STEPS = [
  { label: 'Objetivo', icon: Target },
  { label: 'Publico', icon: Users },
  { label: 'Orcamento', icon: DollarSign },
  { label: 'Plataformas', icon: MonitorPlay },
  { label: 'Revisao', icon: Eye },
]

// ─── Campaign Wizard ────────────────────────────

function CampaignWizardContent() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Step 1: Objective & Content
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [campaignType, setCampaignType] = useState('traffic')
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [adCopy, setAdCopy] = useState('')
  const [ctaType, setCtaType] = useState('LEARN_MORE')
  const [destinationUrl, setDestinationUrl] = useState('')

  // Step 2: Audience
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [radius, setRadius] = useState(10)
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(65)
  const [genders, setGenders] = useState<string[]>(['all'])
  const [interests, setInterests] = useState<Interest[]>([])
  const [loadingInterests, setLoadingInterests] = useState(false)

  // Step 3: Budget
  const [dailyBudget, setDailyBudget] = useState(10)
  const [durationDays, setDurationDays] = useState(7)
  const [estimates, setEstimates] = useState<any>(null)
  const [loadingEstimates, setLoadingEstimates] = useState(false)

  // Step 4: Platforms
  const [metaEnabled, setMetaEnabled] = useState(true)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [metaPlacements, setMetaPlacements] = useState([
    'instagram_feed',
    'instagram_stories',
    'facebook_feed',
  ])

  // Data
  const [availableCards, setAvailableCards] = useState<CardItem[]>([])
  const [availableVideos, setAvailableVideos] = useState<VideoItem[]>([])
  const [generatingCopy, setGeneratingCopy] = useState(false)

  // Load cards and videos
  useEffect(() => {
    async function load() {
      try {
        const [cardsData, videosData] = await Promise.all([
          api.get<{ cards: CardItem[] }>('/api/cards?status=approved&limit=20'),
          api.get<{ videos: VideoItem[] }>('/api/videos?status=ready&limit=20'),
        ])
        setAvailableCards(cardsData.cards || [])
        setAvailableVideos(videosData.videos || [])
      } catch {
        // Ignore
      }
    }
    load()
  }, [])

  // Load estimates when budget changes
  useEffect(() => {
    if (step !== 2 || dailyBudget < 1) return
    setLoadingEstimates(true)
    const timer = setTimeout(async () => {
      try {
        const data = await api.post<{ estimates: any }>('/api/campaigns/estimate-reach', {
          daily_amount: dailyBudget,
          duration_days: durationDays,
        })
        setEstimates(data.estimates)
      } catch {
        // Ignore
      } finally {
        setLoadingEstimates(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [dailyBudget, durationDays, step])

  // AI functions
  const handleSuggestInterests = async () => {
    setLoadingInterests(true)
    try {
      const data = await api.post<{ interests: Interest[] }>(
        '/api/campaigns/suggest-interests',
        { campaign_type: campaignType },
      )
      setInterests(data.interests || [])
      toast.success('Interesses sugeridos pela IA!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sugerir interesses')
    } finally {
      setLoadingInterests(false)
    }
  }

  const handleGenerateCopy = async () => {
    setGeneratingCopy(true)
    try {
      const data = await api.post<{ primary_text: string; headline: string; description: string }>(
        '/api/campaigns/generate-copy',
        {
          card_id: selectedCardIds[0] || undefined,
          campaign_type: campaignType,
          destination_url: destinationUrl,
        },
      )
      setAdCopy(data.primary_text || '')
      toast.success('Copy gerada pela IA!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar copy')
    } finally {
      setGeneratingCopy(false)
    }
  }

  // Save & Publish
  const handleSave = async (publish = false) => {
    if (!name.trim()) {
      toast.error('Informe um nome para a campanha')
      setStep(0)
      return
    }

    publish ? setPublishing(true) : setSaving(true)

    try {
      const campaign = await api.post<{ campaign: { _id: string } }>('/api/campaigns', {
        name,
        description,
        type: campaignType,
        card_ids: selectedCardIds,
        video_ids: selectedVideoIds,
        ad_copy: adCopy,
        cta_type: ctaType,
        destination_url: destinationUrl,
        targeting: {
          locations: city ? [{ city, state, radius_km: radius }] : [],
          age_min: ageMin,
          age_max: ageMax,
          genders,
          interests: interests.map((i) => ({ id: '', name: i.name })),
        },
        budget: { daily_amount: dailyBudget },
        duration_days: durationDays,
        start_date: new Date().toISOString(),
        end_date: new Date(
          Date.now() + durationDays * 24 * 60 * 60 * 1000,
        ).toISOString(),
        platforms: {
          meta_ads: {
            enabled: metaEnabled,
            placements: metaPlacements,
          },
          google_ads: {
            enabled: googleEnabled,
            campaign_types: ['display'],
          },
        },
      })

      if (publish && campaign.campaign?._id) {
        await api.post(`/api/campaigns/${campaign.campaign._id}/publish`)
        toast.success('Campanha publicada com sucesso!')
      } else {
        toast.success('Campanha salva como rascunho')
      }

      router.push('/app/campaigns')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar campanha')
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  const totalBudget = dailyBudget * durationDays

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/app/campaigns')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-white">Nova Campanha</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure sua campanha de anuncios em poucos passos
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = i === step
          const isDone = i < step
          return (
            <div key={i} className="flex items-center flex-1">
              <button
                onClick={() => setStep(i)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full',
                  isActive
                    ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30'
                    : isDone
                      ? 'text-green-400'
                      : 'text-gray-500',
                )}
              >
                {isDone ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="hidden sm:inline truncate">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-4 h-0.5 mx-1 flex-shrink-0',
                    isDone ? 'bg-green-500/40' : 'bg-brand-border',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* ── Step 0: Objective & Content ── */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <Label className="text-gray-300">Nome da campanha</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promocao de Inverno 2026" className="mt-1" />
              </div>

              <div>
                <Label className="text-gray-300">Objetivo</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                  {CAMPAIGN_TYPES.map((t) => {
                    const Icon = t.icon
                    return (
                      <button key={t.id} onClick={() => setCampaignType(t.id)} className={cn('p-3 rounded-xl border text-left transition-all', campaignType === t.id ? 'border-primary-500 bg-primary-500/10' : 'border-brand-border hover:border-gray-600')}>
                        <Icon className={cn('w-5 h-5 mb-1.5', t.color)} />
                        <p className="text-sm font-medium text-white">{t.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Card Selection */}
              <div>
                <Label className="text-gray-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Criativos (Cards)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                  {availableCards.map((card) => {
                    const selected = selectedCardIds.includes(card._id)
                    return (
                      <button key={card._id} onClick={() => setSelectedCardIds((prev) => selected ? prev.filter((id) => id !== card._id) : [...prev, card._id])} className={cn('p-2 rounded-lg border text-left transition-all', selected ? 'border-primary-500 bg-primary-500/10' : 'border-brand-border hover:border-gray-600')}>
                        <p className="text-xs font-medium text-gray-200 truncate">{card.headline || 'Card'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{card.format}</p>
                      </button>
                    )
                  })}
                </div>
                {availableCards.length === 0 && <p className="text-xs text-gray-500 mt-2 italic">Nenhum card aprovado</p>}
              </div>

              {/* Ad Copy */}
              <div>
                <Label className="text-gray-300 flex items-center justify-between">
                  <span>Texto do anuncio</span>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-6" onClick={handleGenerateCopy} disabled={generatingCopy}>
                    {generatingCopy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Gerar com IA
                  </Button>
                </Label>
                <textarea value={adCopy} onChange={(e) => setAdCopy(e.target.value)} placeholder="Texto principal do anuncio..." className="w-full mt-1 p-3 rounded-lg bg-brand-surface border border-brand-border text-sm text-gray-200 placeholder:text-gray-600 resize-none h-20 focus:outline-none focus:border-primary-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">CTA</Label>
                  <Select value={ctaType} onValueChange={setCtaType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CTA_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Link de destino</Label>
                  <Input value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} placeholder="https://wa.me/5571..." className="mt-1" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Audience ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-gray-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Localizacao
                </Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Estado" />
                  <div className="flex items-center gap-2">
                    <Input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} min={1} max={100} />
                    <span className="text-xs text-gray-500 whitespace-nowrap">km</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Idade minima</Label>
                  <Input type="number" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} min={18} max={65} className="mt-1" />
                </div>
                <div>
                  <Label className="text-gray-300">Idade maxima</Label>
                  <Input type="number" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} min={18} max={65} className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Genero</Label>
                <div className="flex gap-2 mt-2">
                  {[{ id: 'all', label: 'Todos' }, { id: 'male', label: 'Masculino' }, { id: 'female', label: 'Feminino' }].map((g) => (
                    <button key={g.id} onClick={() => setGenders([g.id])} className={cn('px-4 py-2 rounded-lg text-sm border transition-all', genders.includes(g.id) ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-brand-border text-gray-400 hover:border-gray-600')}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 flex items-center justify-between">
                  <span>Interesses</span>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-6" onClick={handleSuggestInterests} disabled={loadingInterests}>
                    {loadingInterests ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Sugerir com IA
                  </Button>
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {interests.map((interest, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 px-2.5 py-1">
                      {interest.name}
                      <button onClick={() => setInterests((prev) => prev.filter((_, j) => j !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {interests.length === 0 && <p className="text-xs text-gray-500 italic">Clique em "Sugerir com IA" para adicionar interesses</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Budget ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-gray-300">Orcamento diario</Label>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-gray-400 text-sm">R$</span>
                  <Input type="number" value={dailyBudget} onChange={(e) => setDailyBudget(Math.max(6, Number(e.target.value)))} min={6} className="max-w-32" />
                  <span className="text-xs text-gray-500">/dia (minimo R$ 6,00)</span>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Duracao</Label>
                <div className="flex gap-2 mt-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button key={d.value} onClick={() => setDurationDays(d.value)} className={cn('px-4 py-2 rounded-lg text-sm border transition-all', durationDays === d.value ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-brand-border text-gray-400 hover:border-gray-600')}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Summary */}
              <div className="p-4 rounded-xl border border-brand-border bg-brand-surface space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Orcamento diario</span>
                  <span className="text-sm font-medium text-white">{formatCurrency(dailyBudget)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Duracao</span>
                  <span className="text-sm font-medium text-white">{durationDays} dias</span>
                </div>
                <div className="border-t border-brand-border pt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Investimento total</span>
                  <span className="text-lg font-bold text-primary-400">{formatCurrency(totalBudget)}</span>
                </div>
              </div>

              {/* Reach Estimate */}
              {estimates && (
                <div className="p-4 rounded-xl border border-primary-500/20 bg-primary-500/5 space-y-2">
                  <p className="text-sm font-medium text-primary-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Estimativa de alcance
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Alcance diario</p>
                      <p className="text-lg font-bold text-white">
                        {estimates.daily_reach_min?.toLocaleString()} — {estimates.daily_reach_max?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Alcance total</p>
                      <p className="text-lg font-bold text-white">
                        {estimates.total_reach_min?.toLocaleString()} — {estimates.total_reach_max?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {estimates.estimated_cpc && (
                    <p className="text-xs text-gray-500">
                      CPC estimado: {formatCurrency(estimates.estimated_cpc)}
                    </p>
                  )}
                </div>
              )}
              {loadingEstimates && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Calculando estimativas...
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Platforms ── */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Meta Ads */}
              <div className="p-4 rounded-xl border border-brand-border bg-brand-surface space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Meta Ads</p>
                      <p className="text-xs text-gray-500">Instagram + Facebook</p>
                    </div>
                  </div>
                  <Switch checked={metaEnabled} onCheckedChange={setMetaEnabled} />
                </div>

                {metaEnabled && (
                  <div className="space-y-2 pl-13">
                    <p className="text-xs text-gray-400 font-medium">Posicionamentos</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'instagram_feed', label: 'Feed IG' },
                        { id: 'instagram_stories', label: 'Stories IG' },
                        { id: 'instagram_reels', label: 'Reels IG' },
                        { id: 'facebook_feed', label: 'Feed FB' },
                        { id: 'facebook_stories', label: 'Stories FB' },
                      ].map((p) => {
                        const selected = metaPlacements.includes(p.id)
                        return (
                          <button key={p.id} onClick={() => setMetaPlacements((prev) => selected ? prev.filter((x) => x !== p.id) : [...prev, p.id])} className={cn('px-3 py-1.5 rounded-lg text-xs border transition-all', selected ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-brand-border text-gray-500 hover:border-gray-600')}>
                            {p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Google Ads */}
              <div className="p-4 rounded-xl border border-brand-border bg-brand-surface space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Google Ads</p>
                      <p className="text-xs text-gray-500">Pesquisa + Display + YouTube</p>
                    </div>
                  </div>
                  <Switch checked={googleEnabled} onCheckedChange={setGoogleEnabled} />
                </div>
                {googleEnabled && (
                  <p className="text-xs text-yellow-500 pl-13">
                    Conecte sua conta Google Ads em Configuracoes para ativar.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white">Revisao da campanha</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-brand-border bg-brand-surface">
                  <p className="text-xs text-gray-500">Nome</p>
                  <p className="text-sm font-medium text-white mt-0.5">{name || '—'}</p>
                </div>
                <div className="p-3 rounded-lg border border-brand-border bg-brand-surface">
                  <p className="text-xs text-gray-500">Objetivo</p>
                  <p className="text-sm font-medium text-white mt-0.5 capitalize">{CAMPAIGN_TYPES.find((t) => t.id === campaignType)?.label || campaignType}</p>
                </div>
                <div className="p-3 rounded-lg border border-brand-border bg-brand-surface">
                  <p className="text-xs text-gray-500">Orcamento</p>
                  <p className="text-sm font-medium text-white mt-0.5">{formatCurrency(dailyBudget)}/dia — {formatCurrency(totalBudget)} total</p>
                </div>
                <div className="p-3 rounded-lg border border-brand-border bg-brand-surface">
                  <p className="text-xs text-gray-500">Duracao</p>
                  <p className="text-sm font-medium text-white mt-0.5">{durationDays} dias</p>
                </div>
                <div className="p-3 rounded-lg border border-brand-border bg-brand-surface">
                  <p className="text-xs text-gray-500">Publico</p>
                  <p className="text-sm font-medium text-white mt-0.5">{city || 'Qualquer'}, {ageMin}-{ageMax} anos</p>
                </div>
                <div className="p-3 rounded-lg border border-brand-border bg-brand-surface">
                  <p className="text-xs text-gray-500">Plataformas</p>
                  <p className="text-sm font-medium text-white mt-0.5">
                    {[metaEnabled && 'Meta Ads', googleEnabled && 'Google Ads'].filter(Boolean).join(', ') || 'Nenhuma'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-brand-border bg-brand-surface">
                <p className="text-xs text-gray-500">Criativos</p>
                <p className="text-sm text-white mt-0.5">{selectedCardIds.length} cards, {selectedVideoIds.length} videos</p>
              </div>

              {adCopy && (
                <div className="p-3 rounded-lg border border-brand-border bg-brand-surface">
                  <p className="text-xs text-gray-500">Texto do anuncio</p>
                  <p className="text-sm text-gray-200 mt-0.5">{adCopy}</p>
                </div>
              )}

              {interests.length > 0 && (
                <div className="p-3 rounded-lg border border-brand-border bg-brand-surface">
                  <p className="text-xs text-gray-500 mb-1.5">Interesses</p>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((i, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px]">{i.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : router.push('/app/campaigns')} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          {step > 0 ? 'Voltar' : 'Cancelar'}
        </Button>
        <div className="flex gap-2">
          {step === 4 && (
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Salvar rascunho
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} className="gap-1.5">
              Proximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => handleSave(true)} disabled={publishing} className="gap-1.5">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publicar campanha
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NewCampaignPage() {
  return (
    <FeatureGate feature="Campanhas de marketing">
      <CampaignWizardContent />
    </FeatureGate>
  )
}
