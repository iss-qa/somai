'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeatureGate } from '@/components/company/FeatureGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Target,
  Plus,
  Calendar,
  Image,
  Video,
  FileText,
  Loader2,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  MoreHorizontal,
  Trash2,
  Pause,
  Play,
  BarChart3,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Campaign {
  _id: string
  name: string
  description: string
  type: string
  status: string
  start_date: string
  end_date: string
  duration_days: number
  budget: { daily_amount: number; total_amount: number }
  card_ids: any[]
  video_ids: any[]
  metrics: {
    impressions: number
    reach: number
    clicks: number
    ctr: number
    total_spent: number
  }
  platforms: {
    meta_ads: { enabled: boolean }
    google_ads: { enabled: boolean }
  }
  createdAt: string
}

const statusConfig: Record<string, { label: string; variant: string; color: string }> = {
  draft: { label: 'Rascunho', variant: 'secondary', color: 'bg-gray-500' },
  review: { label: 'Em revisao', variant: 'warning', color: 'bg-yellow-500' },
  active: { label: 'Ativa', variant: 'success', color: 'bg-green-500' },
  paused: { label: 'Pausada', variant: 'warning', color: 'bg-yellow-500' },
  completed: { label: 'Concluida', variant: 'info', color: 'bg-blue-500' },
  failed: { label: 'Falhou', variant: 'destructive', color: 'bg-red-500' },
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

function CampaignsContent() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const data = await api.get<{ campaigns: Campaign[] }>('/api/campaigns')
        setCampaigns(data.campaigns || [])
      } catch {
        setCampaigns([])
      } finally {
        setLoading(false)
      }
    }
    loadCampaigns()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/campaigns/${id}`)
      setCampaigns((prev) => prev.filter((c) => c._id !== id))
      toast.success('Campanha removida')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  // Stats
  const activeCampaigns = campaigns.filter((c) => c.status === 'active')
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.metrics?.total_spent || 0), 0)
  const totalReach = campaigns.reduce((sum, c) => sum + (c.metrics?.reach || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-400" />
            Campanhas
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie suas campanhas de anuncios em Meta Ads e Google Ads
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => router.push('/app/campaigns/new')}>
          <Plus className="w-4 h-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-brand-border bg-brand-surface">
            <p className="text-2xl font-bold text-white">{campaigns.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="p-3 rounded-xl border border-brand-border bg-brand-surface">
            <p className="text-2xl font-bold text-green-400">{activeCampaigns.length}</p>
            <p className="text-xs text-gray-500">Ativas</p>
          </div>
          <div className="p-3 rounded-xl border border-brand-border bg-brand-surface">
            <p className="text-2xl font-bold text-blue-400">{totalReach.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Alcance total</p>
          </div>
          <div className="p-3 rounded-xl border border-brand-border bg-brand-surface">
            <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-gray-500">Investido</p>
          </div>
        </div>
      )}

      {/* Campaign List */}
      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => {
            const status = statusConfig[campaign.status] || statusConfig.draft

            // Progress
            let progressPct = 0
            if (campaign.start_date && campaign.end_date) {
              const start = new Date(campaign.start_date).getTime()
              const end = new Date(campaign.end_date).getTime()
              const now = Date.now()
              progressPct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
            }

            return (
              <Card key={campaign._id} className="hover:border-gray-600 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">{campaign.name}</h3>
                        <Badge variant={status.variant as any} className="text-[10px] flex-shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="capitalize">{typeLabels[campaign.type] || campaign.type}</span>
                        <span>|</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {campaign.start_date ? formatDate(campaign.start_date) : '—'} — {campaign.end_date ? formatDate(campaign.end_date) : '—'}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-gray-500 hover:text-gray-300">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/app/campaigns/${campaign._id}`)}>
                          <BarChart3 className="mr-2 h-3.5 w-3.5" />
                          Ver detalhes
                        </DropdownMenuItem>
                        {campaign.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleDelete(campaign._id)} className="text-red-400">
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Progress */}
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Progresso</span>
                        <span>{Math.round(progressPct)}%</span>
                      </div>
                      <Progress value={progressPct} className="h-1" />
                    </div>
                  )}

                  {/* Mini metrics */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Alcance</p>
                      <p className="text-white font-medium">{campaign.metrics?.reach?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cliques</p>
                      <p className="text-white font-medium">{campaign.metrics?.clicks?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">CTR</p>
                      <p className="text-white font-medium">{(campaign.metrics?.ctr || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Gasto</p>
                      <p className="text-white font-medium">{formatCurrency(campaign.metrics?.total_spent || 0)}</p>
                    </div>
                  </div>

                  {/* Content count & budget */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        {campaign.card_ids?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {campaign.video_ids?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(campaign.budget?.daily_amount || 0)}/dia
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => router.push(`/app/campaigns/${campaign._id}`)}>
                      Detalhes
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Target className="w-14 h-14 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Nenhuma campanha criada
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Crie campanhas para anunciar no Instagram, Facebook e Google usando os cards e videos que voce ja criou.
          </p>
          <Button className="gap-2" onClick={() => router.push('/app/campaigns/new')}>
            <Plus className="w-4 h-4" />
            Criar primeira campanha
          </Button>
        </div>
      )}
    </div>
  )
}

export default function CampaignsPage() {
  return (
    <FeatureGate feature="Campanhas de marketing">
      <CampaignsContent />
    </FeatureGate>
  )
}
