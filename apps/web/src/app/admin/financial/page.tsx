'use client'

import { useEffect, useState, useCallback } from 'react'
import { MetricCard } from '@/components/company/MetricCard'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Loader2,
  MessageCircle,
  CheckCircle,
  Bell,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Backend response types ──────────────────────────────────── */

interface SummaryResponse {
  summary: {
    total_companies: number
    paid: number
    pending: number
    overdue: number
    monthly_revenue: number
    setup_revenue: number
  }
}

interface BillingCompany {
  _id: string
  name: string
  slug: string
  niche: string
  status: string
  access_enabled: boolean
  billing: {
    monthly_amount: number
    due_day: number
    overdue_days: number
    status: string
  }
  setup_paid: boolean
  setup_amount: number
  plan_id?: {
    _id: string
    slug: string
    name: string
    monthly_price: number
  }
}

interface BillingResponse {
  companies: BillingCompany[]
  pagination: Record<string, unknown>
}

/* ── Local view-model types ──────────────────────────────────── */

interface FinancialMetrics {
  predictedRevenue: number
  receivedRevenue: number
  setupsReceived: number
  overdueAmount: number
}

/* ── Page component ──────────────────────────────────────────── */

export default function FinancialPage() {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    predictedRevenue: 0,
    receivedRevenue: 0,
    setupsReceived: 0,
    overdueAmount: 0,
  })
  const [companies, setCompanies] = useState<BillingCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({})

  const loadFinancial = useCallback(async () => {
    try {
      const [summaryData, billingData] = await Promise.all([
        api.get<SummaryResponse>('/api/admin/financial/summary'),
        api.get<BillingResponse>('/api/admin/financial/billing'),
      ])

      const s = summaryData.summary

      // Compute average monthly for overdue estimation
      const overdueCompanies = billingData.companies.filter(
        (c) => c.billing.status === 'overdue'
      )
      const overdueAmount = overdueCompanies.reduce(
        (acc, c) => acc + c.billing.monthly_amount,
        0
      )

      setMetrics({
        predictedRevenue: s.monthly_revenue,
        receivedRevenue: s.setup_revenue,
        setupsReceived: s.setup_revenue,
        overdueAmount,
      })

      setCompanies(billingData.companies)
    } catch {
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFinancial()
  }, [loadFinancial])

  /* ── Actions ────────────────────────────────────────────────── */

  async function handleNotify(companyId: string) {
    const key = `${companyId}-notify`
    setActionLoading((prev) => ({ ...prev, [key]: 'loading' }))
    try {
      await api.post(`/api/admin/financial/billing/${companyId}/notify`)
      toast.success('Cobranca enviada com sucesso')
    } catch {
      toast.error('Erro ao enviar cobranca')
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  async function handleConfirm(companyId: string) {
    const key = `${companyId}-confirm`
    setActionLoading((prev) => ({ ...prev, [key]: 'loading' }))
    try {
      await api.post(`/api/admin/financial/billing/${companyId}/confirm`)
      toast.success('Pagamento confirmado com sucesso')
      // Refresh data after confirming payment
      await loadFinancial()
    } catch {
      toast.error('Erro ao confirmar pagamento')
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function isActionLoading(companyId: string, action: string) {
    return !!actionLoading[`${companyId}-${action}`]
  }

  /* ── Loading state ─────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-semibold text-white">Financeiro</h2>
        <p className="text-sm text-gray-400 mt-1">
          Controle de receita e cobrancas
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Receita prevista"
          value={formatCurrency(metrics.predictedRevenue)}
          icon={TrendingUp}
          color="blue"
        />
        <MetricCard
          title="Recebido"
          value={formatCurrency(metrics.receivedRevenue)}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Setups recebidos"
          value={formatCurrency(metrics.setupsReceived)}
          icon={CheckCircle}
          color="purple"
        />
        <MetricCard
          title="Em atraso"
          value={formatCurrency(metrics.overdueAmount)}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Billing table - Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Empresa
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Plano
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Setup
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Mensal
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Vencimento
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Atraso
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <tr key={company._id} className="hover:bg-brand-surface/50 transition-colors">
                      <td className="p-4">
                        <span className="text-sm font-medium text-gray-200">
                          {company.name}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">
                          {company.plan_id?.name ?? '-'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {company.setup_paid ? (
                          <Badge variant="success">Pago</Badge>
                        ) : (
                          <Badge variant="warning">Pendente</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-300">
                          {formatCurrency(company.billing.monthly_amount)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-400">
                          Dia {company.billing.due_day}
                        </span>
                      </td>
                      <td className="p-4">
                        {company.billing.overdue_days > 0 ? (
                          <span className="text-sm font-medium text-red-400">
                            {company.billing.overdue_days} dias
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={company.billing.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            disabled={isActionLoading(company._id, 'notify')}
                            onClick={() => handleNotify(company._id)}
                          >
                            {isActionLoading(company._id, 'notify') ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <MessageCircle className="w-3 h-3" />
                            )}
                            Cobrar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                            disabled={isActionLoading(company._id, 'confirm')}
                            onClick={() => handleConfirm(company._id)}
                          >
                            {isActionLoading(company._id, 'confirm') ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Confirmar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <DollarSign className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Nenhuma cobranca encontrada</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {companies.length > 0 ? (
          companies.map((company) => (
            <Card key={company._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-200">{company.name}</p>
                    <p className="text-xs text-gray-500">
                      {company.plan_id?.name ?? '-'} -{' '}
                      {formatCurrency(company.billing.monthly_amount)}/mes
                    </p>
                  </div>
                  <StatusBadge status={company.billing.status} />
                </div>
                {company.billing.overdue_days > 0 && (
                  <p className="text-xs text-red-400 mb-2">
                    {company.billing.overdue_days} dias em atraso
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs gap-1"
                    disabled={isActionLoading(company._id, 'notify')}
                    onClick={() => handleNotify(company._id)}
                  >
                    {isActionLoading(company._id, 'notify') ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <MessageCircle className="w-3 h-3" />
                    )}
                    Cobrar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs gap-1 text-emerald-400"
                    disabled={isActionLoading(company._id, 'confirm')}
                    onClick={() => handleConfirm(company._id)}
                  >
                    {isActionLoading(company._id, 'confirm') ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    Confirmar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhuma cobranca encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
