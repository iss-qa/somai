'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Image as ImageIcon,
  TrendingUp,
  ExternalLink,
  Building2,
  Save,
} from 'lucide-react'

interface TopPartner {
  company_id: string
  company_name: string
  slug: string
  plan: string
  status: string
  spent_usd: number
  image_count: number
  last_used: string
}

interface DailyPoint {
  date: string
  spent: number
  count: number
}

interface FalStats {
  balance: {
    purchased: number
    spent_total: number
    spent_month: number
    remaining: number
    last_synced: string | null
    alert_level: 'ok' | 'warning' | 'critical' | 'no_balance'
  }
  totals: {
    images_total: number
    images_month: number
    requests_total: number
  }
  top_partners: TopPartner[]
  daily: DailyPoint[]
}

function fmtUsd(v: number) {
  return `$${v.toFixed(2)}`
}

function fmtBrl(usd: number, rate = 5.2) {
  return `R$ ${(usd * rate).toFixed(2).replace('.', ',')}`
}

export default function FalAdminPage() {
  const [stats, setStats] = useState<FalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingBalance, setEditingBalance] = useState(false)
  const [balanceInput, setBalanceInput] = useState('')

  async function load() {
    setRefreshing(true)
    try {
      const data = await api.get<FalStats>('/api/admin/fal/stats')
      setStats(data)
      setBalanceInput(String(data.balance.purchased))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function salvarSaldo() {
    const val = parseFloat(balanceInput.replace(',', '.'))
    if (Number.isNaN(val) || val < 0) {
      alert('Valor invalido')
      return
    }
    setSaving(true)
    try {
      await api.patch('/api/admin/fal/balance', { purchased_usd: val })
      setEditingBalance(false)
      await load()
    } catch (err: any) {
      alert(err?.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const maxDaily = useMemo(() => {
    if (!stats?.daily?.length) return 0
    return Math.max(...stats.daily.map((d) => d.spent))
  }, [stats])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-gray-400 text-sm">Falha ao carregar estatisticas</div>
    )
  }

  const b = stats.balance
  const alertBg =
    b.alert_level === 'critical' || b.alert_level === 'no_balance'
      ? 'bg-red-500/10 border-red-500/40 text-red-300'
      : b.alert_level === 'warning'
        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
        : 'bg-green-500/10 border-green-500/40 text-green-300'

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">fal.ai (geracao de imagem)</h2>
          <p className="text-sm text-gray-400 mt-1">
            Saldo comprado, consumo real por parceiro e alertas. Atualize o
            saldo manualmente apos recarregar em{' '}
            <a
              href="https://fal.ai/dashboard/settings/credits"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              fal.ai <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={load}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Alerta */}
      {b.alert_level !== 'ok' && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${alertBg}`}>
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            {b.alert_level === 'no_balance' && (
              <>
                <strong>Saldo nao cadastrado.</strong> Nao ha registro de
                recarga no fal.ai. Cadastre o valor comprado abaixo pra ativar
                o monitoramento de saldo.
              </>
            )}
            {b.alert_level === 'critical' && (
              <>
                <strong>Saldo critico ({fmtUsd(b.remaining)}).</strong> Geracao
                de imagem ja foi bloqueada preventivamente pros parceiros.
                Recarregue em fal.ai e atualize aqui.
              </>
            )}
            {b.alert_level === 'warning' && (
              <>
                <strong>Saldo baixo ({fmtUsd(b.remaining)}).</strong> Recomendado
                recarregar em breve pra evitar interrupcao.
              </>
            )}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Saldo restante
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {fmtUsd(b.remaining)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {fmtBrl(b.remaining)} · ~{Math.floor(b.remaining / 0.05)} imagens
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Gasto no mes
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {fmtUsd(b.spent_month)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totals.images_month} imagens · {fmtBrl(b.spent_month)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Gasto total
              </CardTitle>
              <ImageIcon className="w-4 h-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {fmtUsd(b.spent_total)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totals.images_total} imagens no total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Saldo comprado
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {editingBalance ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="h-8"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={salvarSaldo}
                  disabled={saving}
                  className="gap-1 h-8"
                >
                  {saving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  {fmtUsd(b.purchased)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-gray-500">
                    {b.last_synced
                      ? `atualizado ${formatDateTime(b.last_synced)}`
                      : 'nunca sincronizado'}
                  </div>
                  <button
                    onClick={() => setEditingBalance(true)}
                    className="text-xs text-purple-400 hover:underline"
                  >
                    Editar
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily chart (barras simples) */}
      {stats.daily.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white">
              Consumo diario (ultimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {stats.daily.map((d) => {
                const h = maxDaily ? (d.spent / maxDaily) * 100 : 0
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div
                      className="w-full bg-purple-500/60 hover:bg-purple-500 rounded-t transition-all"
                      style={{ height: `${Math.max(h, 2)}%` }}
                    />
                    <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap z-10">
                      {d.date}: {fmtUsd(d.spent)} · {d.count} img
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
              <span>{stats.daily[0]?.date}</span>
              <span>{stats.daily[stats.daily.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top parceiros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Top parceiros — consumo no mes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  #
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Parceiro
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Plano
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Imagens
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Gasto (USD)
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Gasto (BRL)
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                  Ultima geracao
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {stats.top_partners.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-gray-500"
                  >
                    Nenhum parceiro gerou imagens neste mes ainda
                  </td>
                </tr>
              ) : (
                stats.top_partners.map((p, idx) => (
                  <tr key={p.company_id} className="hover:bg-brand-surface/50">
                    <td className="p-4 text-sm text-gray-400">#{idx + 1}</td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-200">
                        {p.company_name}
                      </div>
                      <div className="text-xs text-gray-500">{p.slug}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="text-[10px]">
                        {p.plan}
                      </Badge>
                    </td>
                    <td className="p-4 text-right text-sm text-gray-300">
                      {p.image_count}
                    </td>
                    <td className="p-4 text-right text-sm font-medium text-white">
                      {fmtUsd(p.spent_usd)}
                    </td>
                    <td className="p-4 text-right text-xs text-gray-400">
                      {fmtBrl(p.spent_usd)}
                    </td>
                    <td className="p-4 text-right text-xs text-gray-500">
                      {p.last_used ? formatDateTime(p.last_used) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
