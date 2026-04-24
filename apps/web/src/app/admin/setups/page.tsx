'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Phone,
  PlayCircle,
  RefreshCw,
  User,
} from 'lucide-react'

interface SetupItem {
  _id: string
  tipo: 'agendamento' | 'credenciais'
  empresa_id: string
  empresa: { name: string; whatsapp: string; responsible_name: string } | null
  nome?: string
  whatsapp?: string
  data_preferida?: string
  horario_preferido?: string
  nome_conta?: string
  email?: string
  plataformas?: string[]
  observacoes?: string
  status: string
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Aguardando',
  aguardando_setup: 'Aguardando',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'destructive'> = {
  pendente: 'secondary',
  aguardando_setup: 'secondary',
  em_andamento: 'default',
  concluido: 'success',
}

export default function AdminSetupsPage() {
  const [itens, setItens] = useState<SetupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const [confirmItem, setConfirmItem] = useState<SetupItem | null>(null)
  const [confirmAction, setConfirmAction] = useState<'iniciar' | 'concluir' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const [senhaItem, setSenhaItem] = useState<SetupItem | null>(null)
  const [senhaRevelada, setSenhaRevelada] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [senhaLoading, setSenhaLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const endpoint = showAll ? '/api/admin/setups/todos' : '/api/admin/setups'
      const data = await api.get<{ itens: SetupItem[] }>(endpoint)
      setItens(data?.itens || [])
    } catch {
      toast.error('Erro ao carregar setups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [showAll])

  async function handleAction() {
    if (!confirmItem || !confirmAction) return
    setActionLoading(true)
    try {
      await api.post(`/api/admin/setups/${confirmItem._id}/${confirmAction}`, {
        tipo: confirmItem.tipo,
      })
      toast.success(confirmAction === 'iniciar' ? 'Setup iniciado!' : 'Setup concluído!')
      setConfirmItem(null)
      setConfirmAction(null)
      load()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao executar ação')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRevelarSenha(item: SetupItem) {
    setSenhaItem(item)
    setSenhaRevelada('')
    setShowSenha(false)
    setSenhaLoading(true)
    try {
      const data = await api.post<{ senha: string }>(`/api/admin/setups/${item._id}/revelar-senha`, {})
      setSenhaRevelada(data?.senha || '')
    } catch {
      toast.error('Erro ao revelar senha')
    } finally {
      setSenhaLoading(false)
    }
  }

  const pending = itens.filter((i) => ['pendente', 'aguardando_setup'].includes(i.status))
  const inProgress = itens.filter((i) => i.status === 'em_andamento')
  const done = itens.filter((i) => i.status === 'concluido')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Setups Pendentes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gerencie as solicitações de configuração dos parceiros</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Só pendentes' : 'Ver todos'}
          </Button>
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aguardando', value: pending.length, color: 'text-amber-400' },
          { label: 'Em andamento', value: inProgress.length, color: 'text-blue-400' },
          { label: 'Concluídos', value: done.length, color: 'text-emerald-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
        </div>
      ) : itens.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-gray-300 font-medium">Nenhum setup pendente</p>
            <p className="text-gray-500 text-sm mt-1">Todos os parceiros já estão configurados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {itens.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">
                        {item.empresa?.name || item.nome || 'Empresa desconhecida'}
                      </p>
                      <Badge
                        variant={item.tipo === 'agendamento' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {item.tipo === 'agendamento' ? (
                          <><Calendar className="w-3 h-3 mr-1" />Agendado</>
                        ) : (
                          <><Key className="w-3 h-3 mr-1" />Credenciais</>
                        )}
                      </Badge>
                      <Badge variant={STATUS_VARIANT[item.status] || 'secondary'} className="text-[10px]">
                        {STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      {item.empresa?.responsible_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.empresa.responsible_name}
                        </span>
                      )}
                      {(item.whatsapp || item.empresa?.whatsapp) && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {item.whatsapp || item.empresa?.whatsapp}
                        </span>
                      )}
                      {item.tipo === 'agendamento' && item.data_preferida && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.data_preferida).toLocaleDateString('pt-BR')} às {item.horario_preferido}
                        </span>
                      )}
                      {item.tipo === 'credenciais' && item.email && (
                        <span className="flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          {item.email} · {item.plataformas?.join(', ')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {item.observacoes && (
                      <p className="mt-2 text-xs text-gray-500 italic">"{item.observacoes}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {['pendente', 'aguardando_setup'].includes(item.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => { setConfirmItem(item); setConfirmAction('iniciar') }}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        Iniciar
                      </Button>
                    )}
                    {item.status === 'em_andamento' && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => { setConfirmItem(item); setConfirmAction('concluir') }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Concluir
                      </Button>
                    )}
                    {item.tipo === 'credenciais' && item.status !== 'concluido' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => handleRevelarSenha(item)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver senha
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm action modal */}
      <Dialog open={!!confirmItem} onOpenChange={() => { setConfirmItem(null); setConfirmAction(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'iniciar' ? 'Confirmar início do setup' : 'Marcar como concluído'}
            </DialogTitle>
          </DialogHeader>
          {confirmItem && (
            <div className="space-y-4">
              <div className="rounded-lg bg-white/[0.04] border border-white/10 p-3 space-y-2 text-sm">
                <p><span className="text-gray-500">Empresa:</span> <span className="text-gray-200">{confirmItem.empresa?.name}</span></p>
                <p><span className="text-gray-500">Tipo:</span> <span className="text-gray-200">{confirmItem.tipo === 'agendamento' ? 'Reunião agendada' : 'Credenciais fornecidas'}</span></p>
                {confirmItem.tipo === 'agendamento' && confirmItem.data_preferida && (
                  <p><span className="text-gray-500">Data:</span> <span className="text-gray-200">{new Date(confirmItem.data_preferida).toLocaleDateString('pt-BR')} às {confirmItem.horario_preferido}</span></p>
                )}
                {confirmItem.tipo === 'credenciais' && (
                  <p><span className="text-gray-500">E-mail:</span> <span className="text-gray-200">{confirmItem.email}</span></p>
                )}
                {confirmItem.whatsapp && (
                  <p><span className="text-gray-500">WhatsApp:</span> <span className="text-gray-200">{confirmItem.whatsapp}</span></p>
                )}
              </div>

              {confirmAction === 'iniciar' && (
                <p className="text-xs text-gray-400">
                  O cliente receberá uma mensagem WhatsApp informando que o setup foi iniciado.
                </p>
              )}
              {confirmAction === 'concluir' && (
                <p className="text-xs text-gray-400">
                  O cliente receberá uma mensagem WhatsApp de conclusão e o acesso às integrações será liberado.
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setConfirmItem(null); setConfirmAction(null) }}
                >
                  Cancelar
                </Button>
                <Button
                  className={`flex-1 ${confirmAction === 'concluir' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  onClick={handleAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : confirmAction === 'iniciar' ? (
                    'Confirmar início'
                  ) : (
                    'Marcar concluído'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reveal password modal */}
      <Dialog open={!!senhaItem} onOpenChange={() => { setSenhaItem(null); setSenhaRevelada('') }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Credenciais de acesso</DialogTitle>
          </DialogHeader>
          {senhaItem && (
            <div className="space-y-4">
              <div className="rounded-lg bg-white/[0.04] border border-white/10 p-3 space-y-2 text-sm">
                <p><span className="text-gray-500">Conta:</span> <span className="text-gray-200">{senhaItem.nome_conta}</span></p>
                <p><span className="text-gray-500">E-mail:</span> <span className="text-gray-200">{senhaItem.email}</span></p>
                <p><span className="text-gray-500">Plataformas:</span> <span className="text-gray-200">{senhaItem.plataformas?.join(', ')}</span></p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Senha (acesso registrado)</p>
                {senhaLoading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2.5 font-mono text-sm text-gray-200 pr-10">
                      {showSenha ? senhaRevelada : '••••••••••••'}
                    </div>
                    <button
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-amber-400/80">
                Este acesso foi registrado para auditoria.
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setSenhaItem(null); setSenhaRevelada('') }}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
