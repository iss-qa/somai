'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/admin/StatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import {
  FileSearch,
  Download,
  Filter,
  Loader2,
  Instagram,
  Facebook,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PostLog {
  id: string
  date: string
  companyName: string
  type: string
  format: string
  platforms: string[]
  status: string
  errorDetail?: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<PostLog[]>([])
  const [loading, setLoading] = useState(true)
  const [companyFilter, setCompanyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await api.get<{ posts: PostLog[] }>('/api/admin/logs')
        setLogs(data.posts || [])
      } catch {
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (companyFilter !== 'all' && log.companyName !== companyFilter) return false
    if (statusFilter !== 'all' && log.status !== statusFilter) return false
    if (platformFilter !== 'all' && !log.platforms.includes(platformFilter)) return false
    return true
  })

  const uniqueCompanies = [...new Set(logs.map((l) => l.companyName))]

  function handleExport() {
    toast.success('Exportacao CSV iniciada')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Logs de Postagens</h2>
          <p className="text-sm text-gray-400 mt-1">
            Historico detalhado de todas as publicacoes
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas empresas</SelectItem>
            {uniqueCompanies.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="failed">Falhas</SelectItem>
            <SelectItem value="queued">Na fila</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
          </SelectContent>
        </Select>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs table - Desktop */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Data
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Empresa
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Tipo
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Formato
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Plataformas
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Detalhe
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-brand-surface/50 transition-colors">
                      <td className="p-4">
                        <span className="text-sm text-gray-400">{formatDateTime(log.date)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-200">{log.companyName}</span>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{log.type}</Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-400">{log.format}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {log.platforms.map((p) => (
                            <span key={p}>
                              {p === 'instagram' && <Instagram className="w-4 h-4 text-pink-400" />}
                              {p === 'facebook' && <Facebook className="w-4 h-4 text-blue-400" />}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-gray-500 truncate block max-w-[200px]">
                          {log.errorDetail || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <FileSearch className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Nenhum log encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{log.companyName}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(log.date)}</p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Badge variant="secondary" className="text-[10px]">{log.type}</Badge>
                  <span>{log.format}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {log.platforms.map((p) => (
                      <span key={p}>
                        {p === 'instagram' && <Instagram className="w-3.5 h-3.5 text-pink-400" />}
                        {p === 'facebook' && <Facebook className="w-3.5 h-3.5 text-blue-400" />}
                      </span>
                    ))}
                  </div>
                </div>

                {log.errorDetail && (
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="flex items-center gap-1 text-xs text-red-400 mt-2"
                  >
                    {expandedLog === log.id ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    Ver erro
                  </button>
                )}
                {expandedLog === log.id && log.errorDetail && (
                  <p className="text-xs text-red-400/80 mt-1 p-2 rounded bg-red-500/5 border border-red-500/10">
                    {log.errorDetail}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <FileSearch className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhum log encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
