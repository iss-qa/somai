'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/admin/StatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import {
  ScrollText,
  Download,
  Filter,
  Loader2,
  Instagram,
  Facebook,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  Bug,
  Clock,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Search,
  Copy,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'live' | 'postagens' | 'erros' | 'fila' | 'auditoria'

interface AppLogEntry {
  _id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  category: string
  event: string
  message: string
  company_name?: string
  metadata?: Record<string, unknown>
  duration_ms?: number
  created_at: string
}

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

interface QueueData {
  queue: {
    pending: number
    processing: number
    failed: number
    done: number
    recent_items: Array<{
      _id: string
      company_id: { name: string } | null
      card_id: { headline: string; format: string } | null
      scheduled_at: string
      platforms: string[]
      status: string
      post_type: string
    }>
  }
}

interface AuditEntry {
  _id: string
  admin_user_id: { name: string; email: string } | null
  action: string
  target_type: string
  target_id: string
  details: Record<string, unknown>
  ip: string
  created_at: string
}

interface Stats {
  total24h: number
  errors24h: number
  postsPublished24h: number
  postsFailed24h: number
  queuePending: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  info: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'INFO', icon: Info },
  warn: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'WARN', icon: AlertTriangle },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'ERROR', icon: AlertCircle },
  debug: { color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'DEBUG', icon: Bug },
} as const

const CATEGORY_COLORS: Record<string, string> = {
  post: 'text-pink-400',
  queue: 'text-blue-400',
  worker: 'text-purple-400',
  auth: 'text-yellow-400',
  api: 'text-cyan-400',
  integration: 'text-orange-400',
  system: 'text-gray-400',
  card: 'text-indigo-400',
  billing: 'text-green-400',
}

function terminalTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour12: false })
}

function terminalDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number | string
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}

// ── Live Terminal Tab ──────────────────────────────────────────────────────────

function LiveTab() {
  const [logs, setLogs] = useState<AppLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [lastFetch, setLastFetch] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef = useRef(paused)

  pausedRef.current = paused

  const fetchLogs = useCallback(async (since?: string) => {
    if (pausedRef.current) return
    try {
      const url = since
        ? `/api/admin/applogs/live?limit=100&since=${encodeURIComponent(since)}`
        : '/api/admin/applogs/live?limit=100'
      const data = await api.get<{ logs: AppLogEntry[] }>(url)
      const incoming = data.logs || []

      if (incoming.length > 0) {
        setLogs((prev) => {
          const combined = since ? [...prev, ...incoming] : incoming
          return combined.slice(-300)
        })
        setLastFetch(incoming[incoming.length - 1].created_at)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) {
        fetchLogs(lastFetch || undefined)
      }
    }, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchLogs, lastFetch])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, paused])

  const filtered = levelFilter === 'all'
    ? logs
    : logs.filter((l) => l.level === levelFilter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={paused ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? (
            <>
              <Play className="w-3.5 h-3.5" /> Retomar
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5" /> Pausar
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setPaused(false)
            setLogs([])
            setLastFetch(null)
            fetchLogs()
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recarregar
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-red-400 hover:text-red-300"
          onClick={() => setLogs([])}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar
        </Button>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="info">INFO</SelectItem>
            <SelectItem value="warn">WARN</SelectItem>
            <SelectItem value="error">ERROR</SelectItem>
            <SelectItem value="debug">DEBUG</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
          {!paused && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          {paused ? 'Pausado' : 'Ao vivo · atualiza a cada 5s'}
          <span className="text-gray-700">· {filtered.length} entradas</span>
        </div>
      </div>

      {/* Terminal */}
      <div className="bg-[#0a0a0f] border border-brand-border rounded-xl overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-brand-border bg-[#0d0d16]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-gray-600 font-mono">soma.ai — logs ao vivo</span>
        </div>

        {/* Log lines */}
        <div className="h-[480px] overflow-y-auto p-4 font-mono text-xs space-y-0.5 scroll-smooth">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-700">Aguardando eventos...</p>
            </div>
          ) : (
            filtered.map((log) => {
              const cfg = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.info
              const catColor = CATEGORY_COLORS[log.category] ?? 'text-gray-400'

              return (
                <div key={log._id} className="flex items-start gap-2 py-0.5 hover:bg-white/3 px-1 rounded group">
                  {/* Timestamp */}
                  <span className="text-gray-700 shrink-0 w-[80px]">
                    {terminalTime(log.created_at)}
                  </span>

                  {/* Level */}
                  <span className={cn('shrink-0 w-[42px] font-semibold', cfg.color)}>
                    {cfg.label}
                  </span>

                  {/* Category */}
                  <span className={cn('shrink-0 w-[80px] uppercase text-[10px] font-medium', catColor)}>
                    [{log.category}]
                  </span>

                  {/* Message */}
                  <span className={cn(
                    'flex-1 break-all',
                    log.level === 'error' ? 'text-red-300' :
                    log.level === 'warn' ? 'text-amber-300' :
                    log.level === 'debug' ? 'text-gray-600' :
                    'text-gray-300'
                  )}>
                    {log.message}
                    {log.company_name && (
                      <span className="text-gray-600 ml-1.5">
                        · {log.company_name}
                      </span>
                    )}
                    {typeof log.duration_ms === 'number' && (
                      <span className="text-gray-700 ml-1.5">{log.duration_ms}ms</span>
                    )}
                  </span>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

// ── Postagens Tab ──────────────────────────────────────────────────────────────

function PostagensTab() {
  const [logs, setLogs] = useState<PostLog[]>([])
  const [loading, setLoading] = useState(true)
  const [companyFilter, setCompanyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    api.get<{ posts: PostLog[] }>('/api/admin/logs')
      .then((data) => setLogs(data.posts || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter((l) => {
    if (companyFilter !== 'all' && l.companyName !== companyFilter) return false
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (platformFilter !== 'all' && !l.platforms.includes(platformFilter)) return false
    return true
  })

  const companies = [...new Set(logs.map((l) => l.companyName))]

  function handleCopyError(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleExport() {
    const rows = [
      ['Data', 'Empresa', 'Tipo', 'Formato', 'Plataformas', 'Status', 'Erro'],
      ...filtered.map((l) => [
        formatDateTime(l.date),
        l.companyName,
        l.type,
        l.format,
        l.platforms.join(', '),
        l.status,
        l.errorDetail || '',
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-postagens-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas empresas</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
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
            <SelectItem value="instagram_feed">Instagram Feed</SelectItem>
            <SelectItem value="instagram_stories">Instagram Stories</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={handleExport}>
          <Download className="w-4 h-4" />
          CSV
        </Button>

        <span className="text-xs text-gray-500">{filtered.length} registros</span>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  {['Data', 'Empresa', 'Tipo', 'Formato', 'Plataformas', 'Status', 'Detalhe'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filtered.length > 0 ? (
                  filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-brand-surface/50 transition-colors">
                      <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                        {formatDateTime(log.date)}
                      </td>
                      <td className="p-4 text-sm text-gray-200">{log.companyName}</td>
                      <td className="p-4">
                        <Badge variant="secondary">{log.type}</Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{log.format}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {log.platforms.map((p) => (
                            <span key={p}>
                              {(p === 'instagram_feed' || p === 'instagram_stories') && (
                                <Instagram className="w-4 h-4 text-pink-400" />
                              )}
                              {p === 'facebook' && (
                                <Facebook className="w-4 h-4 text-blue-400" />
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="p-4">
                        {log.errorDetail ? (
                          <div className="flex items-start gap-2 max-w-[240px]">
                            <span className="text-xs text-red-400 truncate flex-1">
                              {log.errorDetail}
                            </span>
                            <button
                              onClick={() => handleCopyError(log.errorDetail!, log.id)}
                              className="text-gray-600 hover:text-gray-400 shrink-0"
                              title="Copiar erro"
                            >
                              {copiedId === log.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-700">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <ScrollText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Nenhum log encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-3">
        {filtered.map((log) => (
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
                      {(p === 'instagram_feed' || p === 'instagram_stories') && (
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      )}
                      {p === 'facebook' && (
                        <Facebook className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
              {log.errorDetail && (
                <>
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="flex items-center gap-1 text-xs text-red-400 mt-2"
                  >
                    {expandedLog === log.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Ver erro
                  </button>
                  {expandedLog === log.id && (
                    <p className="text-xs text-red-400/80 mt-1 p-2 rounded bg-red-500/5 border border-red-500/10">
                      {log.errorDetail}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Erros Tab ──────────────────────────────────────────────────────────────────

function ErrosTab() {
  const [logs, setLogs] = useState<AppLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    api.get<{ logs: AppLogEntry[] }>('/api/admin/applogs?level=error&limit=100')
      .then((data) => setLogs(data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = categoryFilter === 'all'
    ? logs
    : logs.filter((l) => l.category === categoryFilter)

  const categories = [...new Set(logs.map((l) => l.category))]

  function handleCopy(msg: string, id: string) {
    const meta = logs.find((l) => l._id === id)
    const text = meta?.metadata ? `${msg}\n\n${JSON.stringify(meta.metadata, null, 2)}` : msg
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Erro copiado')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-500">{filtered.length} erros</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Nenhum erro registrado</p>
          <p className="text-xs text-gray-600 mt-1">Tudo funcionando normalmente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const catColor = CATEGORY_COLORS[log.category] ?? 'text-gray-400'
            return (
              <Card key={log._id} className="border-red-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px]', catColor)}
                        >
                          {log.category}
                        </Badge>
                        <span className="text-[10px] font-mono text-gray-600">{log.event}</span>
                        <span className="text-xs text-gray-600 ml-auto whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-red-300 break-words">{log.message}</p>
                      {log.company_name && (
                        <p className="text-xs text-gray-500 mt-1">Empresa: {log.company_name}</p>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400">
                            Ver metadados
                          </summary>
                          <pre className="mt-2 text-[10px] text-gray-500 bg-brand-surface rounded p-2 overflow-x-auto border border-brand-border">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(log.message, log._id)}
                      className="text-gray-600 hover:text-gray-400 shrink-0"
                      title="Copiar"
                    >
                      {copiedId === log._id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Fila Tab ───────────────────────────────────────────────────────────────────

function FilaTab() {
  const [data, setData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const result = await api.get<QueueData>('/api/admin/health/queue')
      setData(result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    )
  }

  const queue = data?.queue
  const items = queue?.recent_items || []

  const statusMap: Record<string, string> = {
    queued: 'text-amber-400',
    processing: 'text-blue-400',
    done: 'text-emerald-400',
    failed: 'text-red-400',
    cancelled: 'text-gray-500',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Status atual da fila de publicacoes</span>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={refreshing}
          onClick={() => { setRefreshing(true); load() }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{queue?.pending ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Aguardando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{queue?.processing ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Processando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{queue?.failed ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Falharam</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{queue?.done ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue items */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-primary-400" />
              Itens ativos na fila
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-brand-border">
              {items.map((item) => (
                <div key={item._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {item.company_id?.name ?? '–'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.card_id?.headline ?? item.post_type}
                      {item.card_id?.format && ` · ${item.card_id.format}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1">
                      {item.platforms.map((p) => (
                        <span key={p}>
                          {(p === 'instagram_feed' || p === 'instagram_stories') && (
                            <Instagram className="w-3.5 h-3.5 text-pink-400" />
                          )}
                          {p === 'facebook' && (
                            <Facebook className="w-3.5 h-3.5 text-blue-400" />
                          )}
                        </span>
                      ))}
                    </div>
                    <span className={cn('text-xs font-medium', statusMap[item.status] ?? 'text-gray-400')}>
                      {item.status}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(item.scheduled_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Auditoria Tab ──────────────────────────────────────────────────────────────

function AuditoriaTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    api.get<{ entries: AuditEntry[]; pagination: { total: number } }>('/api/admin/applogs/audit')
      .then((data) => {
        setEntries(data.entries || [])
        setTotal(data.pagination?.total ?? 0)
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Nenhuma acao administrativa registrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{total} acoes registradas</p>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-brand-border">
            {entries.map((entry) => (
              <div key={entry._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <Badge variant="secondary" className="text-[10px]">{entry.action}</Badge>
                      <span className="text-xs text-gray-500">{entry.target_type}</span>
                      {entry.ip && (
                        <span className="text-[10px] text-gray-700 font-mono">{entry.ip}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">
                      {entry.admin_user_id?.name ?? 'Admin'}{' '}
                      <span className="text-gray-600 text-xs">
                        ({entry.admin_user_id?.email ?? '–'})
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {formatDateTime(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('live')
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    api.get<Stats>('/api/admin/applogs/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))

    // Refresh stats every 30s
    const interval = setInterval(() => {
      api.get<Stats>('/api/admin/applogs/stats').then(setStats).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'live', label: 'Ao vivo', icon: Play },
    { id: 'postagens', label: 'Postagens', icon: Instagram },
    { id: 'erros', label: 'Erros', icon: AlertCircle },
    { id: 'fila', label: 'Fila', icon: Layers },
    { id: 'auditoria', label: 'Auditoria', icon: ShieldCheck },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Logs do Sistema</h2>
          <p className="text-sm text-gray-400 mt-1">
            Monitoramento completo da aplicacao em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-gray-500">Ao vivo</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-8 bg-brand-surface rounded animate-pulse mb-1" />
                <div className="h-3 bg-brand-surface rounded animate-pulse w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard label="Eventos (24h)" value={stats?.total24h ?? 0} color="text-white" />
            <StatCard label="Erros (24h)" value={stats?.errors24h ?? 0} color="text-red-400" />
            <StatCard label="Publicados (24h)" value={stats?.postsPublished24h ?? 0} color="text-emerald-400" />
            <StatCard label="Falhas (24h)" value={stats?.postsFailed24h ?? 0} color="text-amber-400" />
            <StatCard label="Fila pendente" value={stats?.queuePending ?? 0} color="text-blue-400" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div>
        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b border-brand-border overflow-x-auto pb-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === id
                  ? 'border-primary-500 text-primary-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'erros' && stats && stats.errors24h > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                  {stats.errors24h}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pt-6">
          {activeTab === 'live' && <LiveTab />}
          {activeTab === 'postagens' && <PostagensTab />}
          {activeTab === 'erros' && <ErrosTab />}
          {activeTab === 'fila' && <FilaTab />}
          {activeTab === 'auditoria' && <AuditoriaTab />}
        </div>
      </div>
    </div>
  )
}
