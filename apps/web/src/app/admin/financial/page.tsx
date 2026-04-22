'use client'

import { useEffect, useState, useCallback } from 'react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  MessageCircle,
  CheckCircle,
  X,
  Building2,
  Calendar,
  CreditCard,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

/* ── Types ──────────────────────────────────────────── */

interface SummaryData {
  total_companies: number
  paid: number
  pending: number
  overdue: number
  monthly_revenue: number
  received_revenue: number
  setup_revenue: number
  overdue_amount: number
}

interface PlanDist {
  name: string
  count: number
  revenue: number
}

interface StatusDist {
  name: string
  value: number
  count: number
}

interface SummaryResponse {
  summary: SummaryData
  plan_distribution: PlanDist[]
  status_distribution: StatusDist[]
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
    last_paid_at?: string
    next_due_at?: string
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

interface BreakdownReceitaItem {
  _id: string
  name: string
  plan: string
  monthly_amount: number
  due_day: number
  status: string
}

interface BreakdownRecebidoItem {
  _id: string
  name: string
  plan: string
  monthly_amount: number
  last_paid_at?: string
}

interface BreakdownSetupItem {
  _id: string
  name: string
  plan: string
  setup_amount: number
  paid_at?: string
}

interface BreakdownAtrasoItem {
  _id: string
  name: string
  plan: string
  monthly_amount: number
  overdue_days: number
  next_due_at?: string
}

type BreakdownType = 'receita' | 'recebido' | 'setup' | 'atraso' | null

/* ── Chart colors ───────────────────────────────────── */

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1']
const PLAN_COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#22c55e']

/* ── Custom tooltip for charts ──────────────────────── */

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400">{d.name || d.payload?.name}</p>
      <p className="text-sm font-semibold text-white">
        {typeof d.value === 'number' && d.value > 100
          ? formatCurrency(d.value)
          : d.value}
      </p>
    </div>
  )
}

/* ── Page component ─────────────────────────────────── */

export default function FinancialPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [planDist, setPlanDist] = useState<PlanDist[]>([])
  const [statusDist, setStatusDist] = useState<StatusDist[]>([])
  const [companies, setCompanies] = useState<BillingCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({})

  // Breakdown modals
  const [breakdownType, setBreakdownType] = useState<BreakdownType>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [breakdownReceita, setBreakdownReceita] = useState<BreakdownReceitaItem[]>([])
  const [breakdownRecebido, setBreakdownRecebido] = useState<BreakdownRecebidoItem[]>([])
  const [breakdownSetup, setBreakdownSetup] = useState<BreakdownSetupItem[]>([])
  const [breakdownAtraso, setBreakdownAtraso] = useState<BreakdownAtrasoItem[]>([])
  const [breakdownTotal, setBreakdownTotal] = useState(0)

  const loadFinancial = useCallback(async () => {
    try {
      const [summaryRes, billingRes] = await Promise.all([
        api.get<SummaryResponse>('/api/admin/financial/summary'),
        api.get<{ companies: BillingCompany[] }>('/api/admin/financial/billing?limit=100'),
      ])

      setSummary(summaryRes.summary)
      setPlanDist(summaryRes.plan_distribution)
      setStatusDist(summaryRes.status_distribution)
      setCompanies(billingRes.companies)
    } catch {
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFinancial()
  }, [loadFinancial])

  /* ── Open breakdown modal ──────────────────────────── */

  async function openBreakdown(type: BreakdownType) {
    if (!type) return
    setBreakdownType(type)
    setBreakdownLoading(true)
    try {
      const res = await api.get<{ items: any[]; total: number }>(
        `/api/admin/financial/breakdown/${type}`,
      )
      setBreakdownTotal(res.total)
      if (type === 'receita') setBreakdownReceita(res.items)
      else if (type === 'recebido') setBreakdownRecebido(res.items)
      else if (type === 'setup') setBreakdownSetup(res.items)
      else if (type === 'atraso') setBreakdownAtraso(res.items)
    } catch {
      toast.error('Erro ao carregar detalhes')
    } finally {
      setBreakdownLoading(false)
    }
  }

  /* ── Actions ───────────────────────────────────────── */

  async function handleNotify(companyId: string) {
    const key = `${companyId}-notify`
    setActionLoading((prev) => ({ ...prev, [key]: 'loading' }))
    try {
      await api.post(`/api/admin/financial/billing/${companyId}/notify`)
      toast.success('Cobrança enviada com sucesso')
    } catch {
      toast.error('Erro ao enviar cobrança')
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

  /* ── Loading ───────────────────────────────────────── */

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  /* ── Render ────────────────────────────────────────── */

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-semibold text-white">Financeiro</h2>
        <p className="text-sm text-gray-400 mt-1">
          Controle de receita e cobranças
        </p>
      </div>

      {/* ── Metric Cards (clickable) ──────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          className="text-left rounded-xl border border-brand-border bg-brand-card p-5 transition-all hover:border-blue-500/40 hover:bg-blue-500/5 group"
          onClick={() => openBreakdown('receita')}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Receita prevista</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.monthly_revenue)}
              </p>
              <p className="text-xs text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalhes <ArrowUpRight className="w-3 h-3" />
              </p>
            </div>
            <div className="rounded-lg p-2.5 bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </button>

        <button
          className="text-left rounded-xl border border-brand-border bg-brand-card p-5 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 group"
          onClick={() => openBreakdown('recebido')}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Recebido</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.received_revenue)}
              </p>
              <p className="text-xs text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalhes <ArrowUpRight className="w-3 h-3" />
              </p>
            </div>
            <div className="rounded-lg p-2.5 bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </button>

        <button
          className="text-left rounded-xl border border-brand-border bg-brand-card p-5 transition-all hover:border-purple-500/40 hover:bg-purple-500/5 group"
          onClick={() => openBreakdown('setup')}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Setups recebidos</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.setup_revenue)}
              </p>
              <p className="text-xs text-primary-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalhes <ArrowUpRight className="w-3 h-3" />
              </p>
            </div>
            <div className="rounded-lg p-2.5 bg-primary-500/10">
              <CheckCircle className="h-5 w-5 text-primary-400" />
            </div>
          </div>
        </button>

        <button
          className="text-left rounded-xl border border-brand-border bg-brand-card p-5 transition-all hover:border-red-500/40 hover:bg-red-500/5 group"
          onClick={() => openBreakdown('atraso')}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Em atraso</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.overdue_amount)}
              </p>
              <p className="text-xs text-red-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalhes <ArrowUpRight className="w-3 h-3" />
              </p>
            </div>
            <div className="rounded-lg p-2.5 bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
          </div>
        </button>
      </div>

      {/* ── KPI Summary Row ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary.total_companies}</p>
              <p className="text-xs text-gray-500">Empresas ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary.paid}</p>
              <p className="text-xs text-gray-500">Pagos em dia</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary.pending}</p>
              <p className="text-xs text-gray-500">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary.overdue}</p>
              <p className="text-xs text-gray-500">Em atraso</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Receita por Status (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="w-4 h-4 text-primary-400" />
              Receita por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={(props: any) =>
                      `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-sm text-gray-500">Sem dados suficientes</p>
              </div>
            )}
            <div className="flex items-center justify-center gap-6 mt-2">
              {statusDist.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i] }}
                  />
                  <span className="text-xs text-gray-400">
                    {d.name} ({d.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Receita por Plano (Bar) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-primary-400" />
              Receita por Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            {planDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={planDist} barSize={40}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="Receita" radius={[6, 6, 0, 0]}>
                    {planDist.map((_, i) => (
                      <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-sm text-gray-500">Sem dados suficientes</p>
              </div>
            )}
            <div className="flex items-center justify-center gap-6 mt-2">
              {planDist.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PLAN_COLORS[i] }}
                  />
                  <span className="text-xs text-gray-400">
                    {d.name} ({d.count} empresas)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Billing table - Desktop ───────────────────── */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4 text-primary-400" />
              Cobranças por Empresa
            </CardTitle>
          </CardHeader>
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
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <tr
                      key={company._id}
                      className="hover:bg-brand-surface/50 transition-colors"
                    >
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
                      <p className="text-sm text-gray-400">
                        Nenhuma cobrança encontrada
                      </p>
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
                      {formatCurrency(company.billing.monthly_amount)}/mês
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
            <p className="text-sm text-gray-400">
              Nenhuma cobranca encontrada
            </p>
          </div>
        )}
      </div>

      {/* ── Breakdown Modal ───────────────────────────── */}
      {breakdownType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-brand-border flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {breakdownType === 'receita' && 'Receita Prevista — Detalhamento'}
                  {breakdownType === 'recebido' && 'Valor Recebido — Detalhamento'}
                  {breakdownType === 'setup' && 'Setups Recebidos — Detalhamento'}
                  {breakdownType === 'atraso' && 'Em Atraso — Detalhamento'}
                </h3>
                {!breakdownLoading && (
                  <p className="text-sm text-gray-400 mt-1">
                    Total: <span className="text-white font-semibold">{formatCurrency(breakdownTotal)}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setBreakdownType(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-5">
              {breakdownLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* ── Receita Prevista ── */}
                  {breakdownType === 'receita' &&
                    breakdownReceita.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 rounded-lg bg-brand-surface border border-brand-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.plan} — Venc. dia {item.due_day}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(item.monthly_amount)}
                          </p>
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                    ))}

                  {/* ── Recebido ── */}
                  {breakdownType === 'recebido' &&
                    breakdownRecebido.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 rounded-lg bg-brand-surface border border-brand-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.plan}
                              {item.last_paid_at &&
                                ` — Pago em ${formatDate(item.last_paid_at)}`}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-emerald-400">
                          {formatCurrency(item.monthly_amount)}
                        </p>
                      </div>
                    ))}

                  {/* ── Setup ── */}
                  {breakdownType === 'setup' &&
                    breakdownSetup.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 rounded-lg bg-brand-surface border border-brand-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-primary-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.plan}
                              {item.paid_at &&
                                ` — Pago em ${formatDate(item.paid_at)}`}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-primary-400">
                          {formatCurrency(item.setup_amount)}
                        </p>
                      </div>
                    ))}

                  {/* ── Atraso ── */}
                  {breakdownType === 'atraso' &&
                    breakdownAtraso.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 rounded-lg bg-brand-surface border border-brand-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.plan} — <span className="text-red-400">{item.overdue_days} dias de atraso</span>
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-red-400">
                          {formatCurrency(item.monthly_amount)}
                        </p>
                      </div>
                    ))}

                  {/* Empty state */}
                  {((breakdownType === 'receita' && breakdownReceita.length === 0) ||
                    (breakdownType === 'recebido' && breakdownRecebido.length === 0) ||
                    (breakdownType === 'setup' && breakdownSetup.length === 0) ||
                    (breakdownType === 'atraso' && breakdownAtraso.length === 0)) && (
                    <div className="text-center py-8">
                      <DollarSign className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Nenhum registro encontrado
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-5 border-t border-brand-border flex-shrink-0">
              <Button onClick={() => setBreakdownType(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
