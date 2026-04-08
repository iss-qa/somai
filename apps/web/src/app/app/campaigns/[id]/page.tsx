'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FeatureGate } from '@/components/company/FeatureGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Users,
  Target,
  Pause,
  Play,
  Square,
  FileText,
  RefreshCw,
  Loader2,
  BarChart3,
  Image as ImageIcon,
  Video,
} from 'lucide-react'

interface CampaignDetail {
  _id: string
  name: string
  description: string
  type: string
  status: string
  ad_copy: string
  cta_type: string
  destination_url: string
  targeting: {
    locations: { city: string; state: string; radius_km: number }[]
    age_min: number
    age_max: number
    genders: string[]
    interests: { name: string }[]
  }
  budget: { daily_amount: number; total_amount: number; currency: string }
  duration_days: number
  start_date: string
  end_date: string
  platforms: {
    meta_ads: { enabled: boolean; placements: string[]; status: string }
    google_ads: { enabled: boolean; campaign_types: string[]; status: string }
  }
  metrics: {
    impressions: number
    reach: number
    clicks: number
    ctr: number
    cpc: number
    cpm: number
    conversions: number
    cost_per_conversion: number
    total_spent: number
    last_synced_at: string | null
  }
  estimates: {
    daily_reach_min: number
    daily_reach_max: number
    total_reach_min: number
    total_reach_max: number
  }
  card_ids: any[]
  video_ids: any[]
  published_at: string | null
  completed_at: string | null
  createdAt: string
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'text-gray-400' },
  review: { label: 'Em revisao', color: 'text-yellow-400' },
  active: { label: 'Ativa', color: 'text-green-400' },
  paused: { label: 'Pausada', color: 'text-yellow-400' },
  completed: { label: 'Concluida', color: 'text-blue-400' },
  failed: { label: 'Falhou', color: 'text-red-400' },
}

const typeLabels: Record<string, string> = {
  awareness: 'Reconhecimento',
  traffic: 'Trafego',
  engagement: 'Engajamento',
  leads: 'Leads',
  sales: 'Vendas',
  messages: 'Mensagens',
  local_store: 'Loja Fisica',
}

function CampaignDashboardContent() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadCampaign = async () => {
    try {
      const data = await api.get<{ campaign: CampaignDetail }>(`/api/campaigns/${id}`)
      setCampaign(data.campaign)
    } catch {
      toast.error('Campanha nao encontrada')
      router.push('/app/campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaign()
  }, [id])

  const handleSyncMetrics = async () => {
    setSyncing(true)
    try {
      await api.get(`/api/campaigns/${id}/metrics`)
      await loadCampaign()
      toast.success('Metricas atualizadas')
    } catch {
      toast.error('Erro ao sincronizar metricas')
    } finally {
      setSyncing(false)
    }
  }

  const handleAction = async (action: 'pause' | 'resume' | 'complete') => {
    setActionLoading(true)
    try {
      await api.post(`/api/campaigns/${id}/${action}`)
      await loadCampaign()
      toast.success(
        action === 'pause'
          ? 'Campanha pausada'
          : action === 'resume'
            ? 'Campanha retomada'
            : 'Campanha encerrada',
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro na acao')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  const status = statusMap[campaign.status] || statusMap.draft
  const m = campaign.metrics
  const isActive = campaign.status === 'active'
  const isPaused = campaign.status === 'paused'

  // Calculate campaign progress
  let progressPct = 0
  if (campaign.start_date && campaign.end_date) {
    const start = new Date(campaign.start_date).getTime()
    const end = new Date(campaign.end_date).getTime()
    const now = Date.now()
    progressPct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app/campaigns')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-white">{campaign.name}</h2>
              <Badge variant={campaign.status === 'active' ? 'success' : 'secondary'} className={status.color}>
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>{typeLabels[campaign.type] || campaign.type}</span>
              <span>|</span>
              <span>
                {campaign.start_date ? formatDate(campaign.start_date) : '—'} —{' '}
                {campaign.end_date ? formatDate(campaign.end_date) : '—'}
              </span>
              <span>|</span>
              <span>{formatCurrency(campaign.budget.daily_amount)}/dia</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSyncMetrics} disabled={syncing}>
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Atualizar
          </Button>
          {isActive && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleAction('pause')} disabled={actionLoading}>
              <Pause className="w-3.5 h-3.5" />
              Pausar
            </Button>
          )}
          {isPaused && (
            <Button size="sm" className="gap-1.5" onClick={() => handleAction('resume')} disabled={actionLoading}>
              <Play className="w-3.5 h-3.5" />
              Retomar
            </Button>
          )}
          {(isActive || isPaused) && (
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleAction('complete')} disabled={actionLoading}>
              <Square className="w-3.5 h-3.5" />
              Encerrar
            </Button>
          )}
        </div>
      </div>

      {/* Campaign progress */}
      {(isActive || isPaused) && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>Progresso da campanha</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} />
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard icon={Eye} label="Alcance" value={m.reach.toLocaleString()} color="text-blue-400" />
        <MetricCard icon={BarChart3} label="Impressoes" value={m.impressions.toLocaleString()} color="text-purple-400" />
        <MetricCard icon={MousePointer} label="Cliques" value={m.clicks.toLocaleString()} color="text-green-400" />
        <MetricCard icon={TrendingUp} label="CTR" value={`${m.ctr.toFixed(2)}%`} color="text-yellow-400" />
        <MetricCard icon={DollarSign} label="Gasto total" value={formatCurrency(m.total_spent)} color="text-red-400" />
      </div>

      {/* Detailed metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />
              Desempenho
            </h3>
            <div className="space-y-3">
              <MetricRow label="CPC (Custo por clique)" value={formatCurrency(m.cpc)} />
              <MetricRow label="CPM (Custo por 1000 impressoes)" value={formatCurrency(m.cpm)} />
              <MetricRow label="Conversoes" value={m.conversions.toLocaleString()} />
              <MetricRow label="Custo por conversao" value={m.cost_per_conversion > 0 ? formatCurrency(m.cost_per_conversion) : '—'} />
              <MetricRow label="Ultima atualizacao" value={m.last_synced_at ? formatDate(m.last_synced_at) : 'Nunca'} />
            </div>
          </CardContent>
        </Card>

        {/* Budget & Reach */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Orcamento e Alcance
            </h3>
            <div className="space-y-3">
              <MetricRow label="Orcamento diario" value={formatCurrency(campaign.budget.daily_amount)} />
              <MetricRow label="Orcamento total" value={formatCurrency(campaign.budget.total_amount)} />
              <MetricRow label="Gasto ate agora" value={formatCurrency(m.total_spent)} highlight />
              <MetricRow label="Alcance estimado (diario)" value={`${campaign.estimates.daily_reach_min?.toLocaleString()} — ${campaign.estimates.daily_reach_max?.toLocaleString()}`} />
              <MetricRow label="Duracao" value={`${campaign.duration_days} dias`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {campaign.platforms.meta_ads?.enabled && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">IG</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Meta Ads</p>
                  <p className="text-[10px] text-gray-500">
                    {campaign.platforms.meta_ads.placements?.join(', ') || 'Automatico'}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {campaign.platforms.meta_ads.status || 'Configurado'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {campaign.platforms.google_ads?.enabled && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Google Ads</p>
                  <p className="text-[10px] text-gray-500">
                    {campaign.platforms.google_ads.campaign_types?.join(', ') || 'Display'}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {campaign.platforms.google_ads.status || 'Configurado'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Creative assets */}
      {(campaign.card_ids?.length > 0 || campaign.video_ids?.length > 0) && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Criativos utilizados
            </h3>
            <div className="flex gap-3 flex-wrap">
              {campaign.card_ids?.map((card: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-brand-border bg-brand-surface">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-300">
                    {card.headline || `Card ${i + 1}`}
                  </span>
                </div>
              ))}
              {campaign.video_ids?.map((video: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-brand-border bg-brand-surface">
                  <Video className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-300">
                    {video.title || `Video ${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Targeting details */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Publico-alvo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-gray-500">Localizacao</p>
              <p className="text-sm text-white mt-0.5">
                {campaign.targeting.locations?.length
                  ? campaign.targeting.locations.map((l) => `${l.city}, ${l.state}`).join('; ')
                  : 'Qualquer'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Idade</p>
              <p className="text-sm text-white mt-0.5">
                {campaign.targeting.age_min} — {campaign.targeting.age_max} anos
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Genero</p>
              <p className="text-sm text-white mt-0.5 capitalize">
                {campaign.targeting.genders?.join(', ') || 'Todos'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Interesses</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {campaign.targeting.interests?.length ? (
                  campaign.targeting.interests.map((i, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px]">
                      {i.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-white">Amplo</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Helper Components ──────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any
  label: string
  value: string
  color: string
}) {
  return (
    <div className="p-4 rounded-xl border border-brand-border bg-brand-surface">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span
        className={cn(
          'text-sm font-medium',
          highlight ? 'text-primary-400' : 'text-white',
        )}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Page Export ─────────────────────────────────

export default function CampaignDetailPage() {
  return (
    <FeatureGate feature="Campanhas de marketing" minPlan="enterprise">
      <CampaignDashboardContent />
    </FeatureGate>
  )
}
