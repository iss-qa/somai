'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  MessageSquare,
  Send,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RotateCcw,
  X,
  Filter,
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListChecks,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────

interface Mensagem {
  _id: string
  company_id: string
  company_name: string
  destinatario_nome: string
  destinatario_telefone: string
  tipo: string
  conteudo: string
  status: 'pendente' | 'enviado' | 'falha'
  data_envio?: string
  error_message?: string
  metadata?: Record<string, any>
  createdAt: string
}

interface HistoricoResponse {
  mensagens: Mensagem[]
  total: number
  page: number
  pages: number
}

interface CompanyOption {
  _id: string
  name: string
}

interface QueueStatus {
  waiting: number
  active: number
  failed: number
  completed: number
}

interface Stats {
  total_enviadas: number
  total_pendentes: number
  total_falhas: number
  enviadas_hoje: number
}

// ── Constants ────────────────────────────────────────

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'boas_vindas', label: 'Boas-vindas' },
  { value: 'card_publicado', label: 'Card Publicado' },
  { value: 'card_agendado', label: 'Card Agendado' },
  { value: 'lembrete_mensalidade', label: 'Lembrete Mensalidade' },
  { value: 'boleto_setup', label: 'Boleto Setup' },
  { value: 'boleto_mensalidade', label: 'Boleto Mensalidade' },
  { value: 'confirmacao_pagamento', label: 'Confirmação Pagamento' },
  { value: 'alerta_atraso', label: 'Alerta de Atraso' },
  { value: 'trial_expirando', label: 'Trial Expirando' },
  { value: 'acesso_bloqueado', label: 'Acesso Bloqueado' },
  { value: 'erro_postagem', label: 'Erro na Postagem' },
  { value: 'manual', label: 'Manual' },
]

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'falha', label: 'Falha' },
]

const tipoMensagemColors: Record<string, string> = {
  boas_vindas: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  card_publicado: 'bg-green-500/15 text-green-300 border-green-500/20',
  card_agendado: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  lembrete_mensalidade: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  boleto_setup: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  boleto_mensalidade: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  confirmacao_pagamento: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  alerta_atraso: 'bg-red-500/15 text-red-300 border-red-500/20',
  trial_expirando: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
  acesso_bloqueado: 'bg-red-500/15 text-red-300 border-red-500/20',
  erro_postagem: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
  manual: 'bg-gray-500/15 text-gray-300 border-gray-500/20',
}

const tipoMensagemLabels: Record<string, string> = {
  boas_vindas: 'Boas-vindas',
  card_publicado: 'Card Publicado',
  card_agendado: 'Card Agendado',
  lembrete_mensalidade: 'Lembrete Mensalidade',
  boleto_setup: 'Boleto Setup',
  boleto_mensalidade: 'Boleto Mensalidade',
  confirmacao_pagamento: 'Confirmação Pagamento',
  alerta_atraso: 'Alerta de Atraso',
  trial_expirando: 'Trial Expirando',
  acesso_bloqueado: 'Acesso Bloqueado',
  erro_postagem: 'Erro na Postagem',
  manual: 'Manual',
}

const statusConfig = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/20',
  },
  enviado: {
    label: 'Enviado',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/20',
  },
  falha: {
    label: 'Falha',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/15 border-red-500/20',
  },
}

// ── Firing rules for Soma.ai ─────────────────────────

const REGRAS_DISPARO = [
  {
    evento: 'Boas-vindas',
    gatilho: 'Empresa cadastrada/ativada',
    descricao: 'Mensagem de boas-vindas ao Soma.ai com resumo de funcionalidades',
  },
  {
    evento: 'Card Publicado',
    gatilho: 'Post publicado com sucesso',
    descricao: 'Notifica a empresa sobre a publicação do card com data/hora e plataforma',
  },
  {
    evento: 'Card Agendado',
    gatilho: 'Card adicionado à fila de agendamento',
    descricao: 'Notifica a empresa sobre o agendamento do card',
  },
  {
    evento: 'Lembrete Mensalidade',
    gatilho: 'Cron diário (1-5 dias antes do vencimento)',
    descricao: 'Lembrete de pagamento da mensalidade do plano',
  },
  {
    evento: 'Boleto Setup',
    gatilho: 'Boleto de setup gerado',
    descricao: 'Envia link do boleto de setup para o WhatsApp da empresa',
  },
  {
    evento: 'Boleto Mensalidade',
    gatilho: 'Boleto da mensalidade gerado',
    descricao: 'Envia link do boleto mensal para o WhatsApp da empresa',
  },
  {
    evento: 'Confirmação Pagamento',
    gatilho: 'Pagamento confirmado (webhook)',
    descricao: 'Confirma o pagamento via WhatsApp',
  },
  {
    evento: 'Alerta de Atraso',
    gatilho: 'Cron diário (após vencimento)',
    descricao: 'Alerta sobre mensalidade em atraso com risco de bloqueio',
  },
  {
    evento: 'Trial Expirando',
    gatilho: 'Cron diário (1-3 dias antes do fim do trial)',
    descricao: 'Aviso de que o período de teste está acabando',
  },
  {
    evento: 'Acesso Bloqueado',
    gatilho: 'Bloqueio por inadimplência',
    descricao: 'Notifica a empresa sobre o bloqueio do acesso',
  },
  {
    evento: 'Erro na Postagem',
    gatilho: 'Falha ao publicar post no Instagram/Facebook',
    descricao: 'Notifica a empresa sobre o erro com o nome do card, plataforma e motivo da falha',
  },
]

// ── Component ────────────────────────────────────────

export default function ComunicacaoPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)

  // Filters
  const [filterCompany, setFilterCompany] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')

  // Modals
  const [selectedMsg, setSelectedMsg] = useState<Mensagem | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)
  const [showRegrasModal, setShowRegrasModal] = useState(false)

  // Manual message form
  const [manualEscopo, setManualEscopo] = useState<'todos' | 'company_especifica'>('todos')
  const [manualCompanyId, setManualCompanyId] = useState('')
  const [manualMensagem, setManualMensagem] = useState('')
  const [sending, setSending] = useState(false)
  const [resending, setResending] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCompany) params.append('company_id', filterCompany)
    if (filterTipo !== 'todos') params.append('tipo', filterTipo)
    if (filterStatus !== 'todos') params.append('status', filterStatus)
    params.append('page', currentPage.toString())
    params.append('limit', '20')

    // Historico: carrega primeiro (bloqueia UI principal)
    try {
      const hist = await api.get<HistoricoResponse>(
        `/api/admin/comunicacao/historico?${params}`,
      )
      setMensagens(hist.mensagens)
      setTotal(hist.total)
      setPages(hist.pages)
    } catch (err: any) {
      console.error('Erro ao carregar historico:', err)
      toast.error(err?.message || 'Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }

    // Stats e queue-status: em paralelo, sem bloquear a UI
    api.get<Stats>('/api/admin/comunicacao/stats')
      .then(setStats)
      .catch(() => {})
    api.get<QueueStatus>('/api/admin/comunicacao/queue-status')
      .then(setQueueStatus)
      .catch(() => {})
  }, [filterCompany, filterTipo, filterStatus, currentPage])

  useEffect(() => {
    api
      .get<{ companies: CompanyOption[] }>('/api/companies')
      .then((data) => setCompanies(data.companies || []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function clearFilters() {
    setFilterCompany('')
    setFilterTipo('todos')
    setFilterStatus('todos')
    setCurrentPage(1)
  }

  async function handleResend(id: string) {
    setResending(id)
    try {
      await api.post(`/api/admin/comunicacao/resend/${id}`)
      toast.success('Mensagem reenviada para a fila')
      await loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao reenviar mensagem')
    } finally {
      setResending(null)
    }
  }

  async function handleSendManual() {
    if (!manualMensagem.trim()) {
      toast.error('Mensagem não pode ser vazia')
      return
    }
    if (manualEscopo === 'company_especifica' && !manualCompanyId) {
      toast.error('Selecione uma empresa')
      return
    }
    setSending(true)
    try {
      const result = await api.post<{ enviados: number; empresas: string[] }>(
        '/api/admin/comunicacao/enviar-manual',
        {
          mensagem: manualMensagem,
          escopo: manualEscopo,
          company_id: manualEscopo === 'company_especifica' ? manualCompanyId : undefined,
        },
      )
      toast.success(`Mensagem enviada para ${result.enviados} empresa(s)`)
      setShowManualModal(false)
      setManualMensagem('')
      setManualEscopo('todos')
      setManualCompanyId('')
      await loadData()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  if (loading && mensagens.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Gerenciar Comunicação</h2>
              <p className="text-sm text-gray-400">
                Histórico de mensagens automáticas enviadas via WhatsApp
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowRegrasModal(true)}
          >
            <ListChecks className="w-4 h-4" />
            Regras de Disparo
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {stats.enviadas_hoje}
              </p>
              <p className="text-xs text-gray-500 mt-1">Enviadas Hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {stats.total_enviadas}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Enviadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {stats.total_pendentes}
              </p>
              <p className="text-xs text-gray-500 mt-1">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">
                {stats.total_falhas}
              </p>
              <p className="text-xs text-gray-500 mt-1">Falhas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Company filter */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Empresa</label>
              <select
                value={filterCompany}
                onChange={(e) => {
                  setFilterCompany(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-lg border border-brand-border bg-brand-surface text-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Todas as empresas</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo filter */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Tipo de Mensagem
              </label>
              <select
                value={filterTipo}
                onChange={(e) => {
                  setFilterTipo(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-lg border border-brand-border bg-brand-surface text-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-lg border border-brand-border bg-brand-surface text-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <Button
                className="gap-2"
                size="sm"
                onClick={() => setShowManualModal(true)}
              >
                <Send className="w-3.5 h-3.5" />
                Enviar Mensagem Manual
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              {total} mensagens encontradas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Messages table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                    Data/Hora
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                    Empresa
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                    Destinatario
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                    Tipo
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {mensagens.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Nenhuma mensagem encontrada
                      </p>
                    </td>
                  </tr>
                ) : (
                  mensagens.map((msg) => {
                    const sc = statusConfig[msg.status]
                    const StatusIcon = sc.icon
                    return (
                      <tr
                        key={msg._id}
                        className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-600" />
                            <span className="text-sm text-gray-300">
                              {formatDateTime(msg.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-200">
                            {msg.company_name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-200">
                              {msg.destinatario_nome}
                            </p>
                            <p className="text-xs text-gray-500">
                              {msg.destinatario_telefone}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-[11px] border ${
                              tipoMensagemColors[msg.tipo] ||
                              'bg-gray-500/15 text-gray-300'
                            }`}
                          >
                            {tipoMensagemLabels[msg.tipo] || msg.tipo}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon
                              className={`w-3.5 h-3.5 ${sc.color}`}
                            />
                            <span
                              className={`text-xs font-medium ${sc.color}`}
                            >
                              {sc.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => setSelectedMsg(msg)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </Button>
                            {msg.status === 'falha' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs text-amber-400 hover:text-amber-300"
                                disabled={resending === msg._id}
                                onClick={() => handleResend(msg._id)}
                              >
                                {resending === msg._id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                Reenviar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
              <p className="text-xs text-gray-500">
                Página {currentPage} de {pages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === pages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal: Detalhes da Mensagem ─────────────── */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <h3 className="text-lg font-semibold text-white">
                Detalhes da Mensagem
              </h3>
              <button
                onClick={() => setSelectedMsg(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500">Empresa</p>
                <p className="text-sm text-gray-200 font-medium">
                  {selectedMsg.company_name}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Destinatario</p>
                  <p className="text-sm text-gray-200">
                    {selectedMsg.destinatario_nome}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedMsg.destinatario_telefone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <Badge
                    className={`mt-1 text-xs border ${
                      tipoMensagemColors[selectedMsg.tipo] || ''
                    }`}
                  >
                    {tipoMensagemLabels[selectedMsg.tipo] || selectedMsg.tipo}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {(() => {
                      const sc = statusConfig[selectedMsg.status]
                      const Icon = sc.icon
                      return (
                        <Badge className={`border ${sc.bg} ${sc.color}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {sc.label}
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data de Envio</p>
                  <p className="text-sm text-gray-200">
                    {selectedMsg.data_envio
                      ? formatDateTime(selectedMsg.data_envio)
                      : formatDateTime(selectedMsg.createdAt)}
                  </p>
                </div>
              </div>
              {selectedMsg.error_message && (
                <div>
                  <p className="text-xs text-red-400">Erro</p>
                  <p className="text-sm text-red-300 bg-red-500/10 rounded-lg p-3 mt-1">
                    {selectedMsg.error_message}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Conteúdo da Mensagem
                </p>
                <div className="bg-brand-surface border border-brand-border rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selectedMsg.conteudo}
                </div>
              </div>
            </div>
            <div className="flex justify-end p-5 border-t border-brand-border">
              <Button onClick={() => setSelectedMsg(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Enviar Mensagem Manual ────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <h3 className="text-lg font-semibold text-white">
                Enviar Mensagem Manual
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Escopo
                </label>
                <select
                  value={manualEscopo}
                  onChange={(e) =>
                    setManualEscopo(e.target.value as 'todos' | 'company_especifica')
                  }
                  className="w-full rounded-lg border border-brand-border bg-brand-surface text-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="todos">Todas as empresas ativas</option>
                  <option value="company_especifica">
                    Empresa específica
                  </option>
                </select>
              </div>

              {manualEscopo === 'company_especifica' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Empresa
                  </label>
                  <select
                    value={manualCompanyId}
                    onChange={(e) => setManualCompanyId(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-surface text-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Mensagem
                </label>
                <textarea
                  value={manualMensagem}
                  onChange={(e) => setManualMensagem(e.target.value)}
                  placeholder="Digite a mensagem para enviar via WhatsApp..."
                  rows={6}
                  className="w-full rounded-lg border border-brand-border bg-brand-surface text-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                />
                <p className="text-[11px] text-gray-600 mt-1">
                  Use *texto* para negrito no WhatsApp
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-brand-border">
              <Button
                variant="ghost"
                onClick={() => setShowManualModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="gap-2"
                disabled={
                  sending ||
                  !manualMensagem.trim() ||
                  (manualEscopo === 'company_especifica' && !manualCompanyId)
                }
                onClick={handleSendManual}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Regras de Disparo ─────────────────── */}
      {showRegrasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <h3 className="text-lg font-semibold text-white">
                Regras de Disparo Automático
              </h3>
              <button
                onClick={() => setShowRegrasModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-400 mb-4">
                Mensagens enviadas automaticamente conforme ações executadas no
                sistema.
              </p>
              <div className="space-y-3">
                {REGRAS_DISPARO.map((regra, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-brand-surface border border-brand-border"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary-400">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200">
                        {regra.evento}
                      </p>
                      <p className="text-xs text-primary-400 mt-0.5">
                        {regra.gatilho}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {regra.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end p-5 border-t border-brand-border">
              <Button onClick={() => setShowRegrasModal(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
