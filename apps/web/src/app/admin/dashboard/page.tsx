'use client'

import { useEffect, useState } from 'react'
import { MetricCard } from '@/components/company/MetricCard'
import { AlertItem } from '@/components/admin/AlertItem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import {
  Building2,
  DollarSign,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  TrendingUp,
} from 'lucide-react'

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
  }
}

export default function AdminDashboardPage() {
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
          },
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
  }
  const totalCompanies = dist.active + dist.trial + dist.blocked + dist.setupPending
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
              Distribuicao de Status
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
