'use client'

import { useEffect, useState } from 'react'
import { MetricCard } from '@/components/company/MetricCard'
import { AlertItem } from '@/components/admin/AlertItem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import {
  Building2,
  DollarSign,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  TrendingUp,
  Timer,
  Sparkles,
  ArrowRight,
  User,
  Phone,
} from 'lucide-react'

interface TrialCompany {
  _id: string
  name: string
  responsible_name: string
  plan: string
  trial_expires_at: string | null
  trial_days: number
  whatsapp: string
}

interface AdminDashboard {
  metrics: {
    activePartners: number
    monthlyRevenue: number
    pendingSetups: number
    overdue: number
    postsToday: number
  }
  alerts: Array<{
    id: string
    title: string
    description: string
    level: 'critical' | 'warning' | 'info' | 'success'
    timestamp: string
  }>
  statusDistribution: {
    active: number
    trial: number
    blocked: number
    setupPending: number
    pendingSubscription: number
  }
  trialCompanies?: TrialCompany[]
}

function trialTimeLeft(expiresAt: string | null): { text: string; expired: boolean; urgency: 'ok' | 'warning' | 'critical' } {
  if (!expiresAt) return { text: 'Sem data', expired: false, urgency: 'ok' }
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return { text: 'Expirado', expired: true, urgency: 'critical' }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 1) return { text: `${days} dias restantes`, expired: false, urgency: 'ok' }
  if (days === 1) return { text: `1 dia e ${hours}h`, expired: false, urgency: 'warning' }
  return { text: `${hours}h restantes`, expired: false, urgency: 'critical' }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const result = await api.get<AdminDashboard>('/api/admin/dashboard/summary')
        setData(result)
      } catch {
        // Placeholder data
        setData({
          metrics: {
            activePartners: 0,
            monthlyRevenue: 0,
            pendingSetups: 0,
            overdue: 0,
            postsToday: 0,
          },
          alerts: [],
          statusDistribution: {
            active: 0,
            trial: 0,
            blocked: 0,
            setupPending: 0,
            pendingSubscription: 0,
          },
          trialCompanies: [],
        })
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  const metrics = data?.metrics || {
    activePartners: 0,
    monthlyRevenue: 0,
    pendingSetups: 0,
    overdue: 0,
    postsToday: 0,
  }

  const dist = data?.statusDistribution || {
    active: 0,
    trial: 0,
    blocked: 0,
    setupPending: 0,
    pendingSubscription: 0,
  }
  const totalCompanies = dist.active + dist.trial + dist.blocked + dist.setupPending + dist.pendingSubscription
  const totalForPercent = totalCompanies || 1

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Parceiros ativos"
          value={metrics.activePartners}
          icon={Building2}
          color="green"
        />
        <MetricCard
          title="Receita mensal"
          value={`R$ ${metrics.monthlyRevenue.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Setups pendentes"
          value={metrics.pendingSetups}
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="Inadimplentes"
          value={metrics.overdue}
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="Posts hoje"
          value={metrics.postsToday}
          icon={Send}
          color="purple"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* ── Trial Companies Banner ────────────────── */}
      {(data?.trialCompanies?.length || 0) > 0 && (
        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-primary-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Left — CTA */}
              <div className="flex-shrink-0 lg:w-1/3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Timer className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Empresas em Trial
                    </h3>
                    <p className="text-xs text-gray-400">
                      {data!.trialCompanies!.length} empresa{data!.trialCompanies!.length > 1 ? 's' : ''} em periodo de teste
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Estas empresas estao usando o Soma.ai gratuitamente. Entre em contato para converter em assinantes antes que o trial expire.
                </p>
                <button
                  onClick={() => router.push('/admin/companies')}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Ver todas as empresas
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right — Trial company cards */}
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                {data!.trialCompanies!.map((tc) => {
                  const tl = trialTimeLeft(tc.trial_expires_at)
                  return (
                    <div
                      key={tc._id}
                      className="rounded-xl border border-brand-border bg-brand-dark/60 p-4 hover:border-blue-500/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/companies/${tc._id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">{tc.name}</p>
                            <p className="text-[11px] text-gray-500">{tc.plan}</p>
                          </div>
                        </div>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          tl.urgency === 'critical'
                            ? 'bg-red-500/15 text-red-400'
                            : tl.urgency === 'warning'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {tl.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {tc.responsible_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {tc.whatsapp}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alerts panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.alerts && data.alerts.length > 0 ? (
              <div className="space-y-3">
                {data.alerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    title={alert.title}
                    description={alert.description}
                    level={alert.level}
                    timestamp={alert.timestamp}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  Nenhum alerta no momento
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Tudo funcionando normalmente
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-400" />
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {/* Status bar */}
              <div className="flex h-4 rounded-full overflow-hidden bg-gray-800">
                {dist.active > 0 && (
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${(dist.active / totalForPercent) * 100}%` }}
                  />
                )}
                {dist.trial > 0 && (
                  <div
                    className="bg-blue-500 transition-all"
                    style={{ width: `${(dist.trial / totalForPercent) * 100}%` }}
                  />
                )}
                {dist.pendingSubscription > 0 && (
                  <div
                    className="bg-orange-500 transition-all"
                    style={{ width: `${(dist.pendingSubscription / totalForPercent) * 100}%` }}
                  />
                )}
                {dist.setupPending > 0 && (
                  <div
                    className="bg-amber-500 transition-all"
                    style={{ width: `${(dist.setupPending / totalForPercent) * 100}%` }}
                  />
                )}
                {dist.blocked > 0 && (
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${(dist.blocked / totalForPercent) * 100}%` }}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Ativos', value: dist.active, color: 'bg-emerald-500' },
                  { label: 'Trial', value: dist.trial, color: 'bg-blue-500' },
                  { label: 'Aguardando assinatura', value: dist.pendingSubscription, color: 'bg-orange-500' },
                  { label: 'Setup pendente', value: dist.setupPending, color: 'bg-amber-500' },
                  { label: 'Bloqueados', value: dist.blocked, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-400">{item.label}</span>
                    <span className="text-sm font-medium text-gray-200 ml-auto">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="pt-4 border-t border-brand-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Total de parceiros</p>
                  <p className="text-xl font-bold text-white">{totalCompanies || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Taxa de atividade</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {Math.round((dist.active / totalForPercent) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
