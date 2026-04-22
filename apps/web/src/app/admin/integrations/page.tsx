'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Plug,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Instagram,
  Facebook,
  MessageCircle,
  Clock,
  Search,
  ChevronRight,
  Settings2,
  Wifi,
  WifiOff,
  ExternalLink,
  Key,
  Hash,
  FileText,
  Save,
  Eye,
  EyeOff,
  Building2,
  ArrowLeft,
} from 'lucide-react'

const SOMA_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'somai.issqa.com.br'
const SOMA_ORIGIN = `https://${SOMA_DOMAIN}`
const ADMIN_REDIRECT_PATH = '/admin/integrations'

const META_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
].join(',')

// ── Types ────────────────────────────────────────────────────────────────────

interface IntegrationItem {
  company: { _id: string; name: string; slug: string }
  meta: {
    connected: boolean
    status: string
    token_expires_at: string | null
    token_expired: boolean
  }
  whatsapp: { connected: boolean; status: string }
}

interface Company {
  _id: string
  name: string
  slug: string
  niche: string
  status: string
  createdAt: string
}

type IntegrationStatus = 'pending' | 'active' | 'expired' | 'disconnected'

interface CompanyWithStatus {
  company: Company
  integrationStatus: IntegrationStatus
  integration: IntegrationItem | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getIntegrationStatus(item: IntegrationItem | null): IntegrationStatus {
  if (!item) return 'pending'
  if (item.meta.connected && item.meta.token_expired) return 'expired'
  if (item.meta.connected) return 'active'
  return 'disconnected'
}

function buildFacebookOAuthUrl(appId: string, companyId: string) {
  const redirectUri = `${SOMA_ORIGIN}${ADMIN_REDIRECT_PATH}`
  const state = JSON.stringify({ nonce: Math.random().toString(36), companyId })
  try { sessionStorage.setItem('fb_oauth_state', state) } catch {}
  return (
    `https://www.facebook.com/v25.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(META_SCOPES)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}`
  )
}

function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const map: Record<IntegrationStatus, { label: string; cls: string }> = {
    pending: { label: 'Pendente', cls: 'bg-gray-700 text-gray-300 border-gray-600' },
    active: { label: 'Ativa', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    expired: { label: 'Expirada', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    disconnected: { label: 'Desconectada', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
  }
  const { label, cls } = map[status] ?? map.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {label}
    </span>
  )
}

// ── Mini Dashboard ───────────────────────────────────────────────────────────

function MiniDash({ items }: { items: CompanyWithStatus[] }) {
  const counts = {
    total: items.length,
    pending: items.filter((i) => i.integrationStatus === 'pending').length,
    active: items.filter((i) => i.integrationStatus === 'active').length,
    expired: items.filter((i) => i.integrationStatus === 'expired').length,
    disconnected: items.filter((i) => i.integrationStatus === 'disconnected').length,
  }

  const cards = [
    { label: 'Total', value: counts.total, color: 'text-gray-200', Icon: Building2, iconColor: 'text-gray-500' },
    { label: 'Pendentes', value: counts.pending, color: 'text-amber-400', Icon: Clock, iconColor: 'text-amber-500' },
    { label: 'Ativas', value: counts.active, color: 'text-emerald-400', Icon: CheckCircle, iconColor: 'text-emerald-500' },
    { label: 'Expiradas', value: counts.expired, color: 'text-orange-400', Icon: AlertTriangle, iconColor: 'text-orange-500' },
    { label: 'Desconectadas', value: counts.disconnected, color: 'text-red-400', Icon: XCircle, iconColor: 'text-red-500' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="mb-2">
              <c.Icon className={`w-4 h-4 ${c.iconColor}`} />
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Company Integration Panel ────────────────────────────────────────────────

function CompanyIntegrationPanel({
  company,
  onClose,
  onRefresh,
}: {
  company: Company
  onClose: () => void
  onRefresh: () => void
}) {
  const [panelLoading, setPanelLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingApp, setSavingApp] = useState(false)
  const [testing, setTesting] = useState(false)

  const [connected, setConnected] = useState(false)
  const [connectedUsername, setConnectedUsername] = useState('')
  const [connectedPageName, setConnectedPageName] = useState('')
  const [igProfileUrl, setIgProfileUrl] = useState('')
  const [fbPageUrl, setFbPageUrl] = useState('')
  const [connectedAt, setConnectedAt] = useState('')

  const [metaAppId, setMetaAppId] = useState('')
  const [metaAppSecret, setMetaAppSecret] = useState('')
  const [showAppSecret, setShowAppSecret] = useState(false)
  const [igToken, setIgToken] = useState('')
  const [igAccountId, setIgAccountId] = useState('')
  const [fbPageId, setFbPageId] = useState('')
  const [showToken, setShowToken] = useState(false)

  const baseUrl = `/api/admin/integrations/${company._id}`

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<any>(`${baseUrl}/meta`)
        if (data?.integration?.meta) {
          const meta = data.integration.meta
          setMetaAppId(meta.app_id || '')
          setMetaAppSecret(meta.app_secret ? '••••••••••••' : '')
          setIgToken(meta.access_token ? '••••••••••••••••••••••' : '')
          setIgAccountId(meta.instagram_account_id || '')
          setFbPageId(meta.facebook_page_id || '')
          setConnected(meta.connected || false)
          setConnectedUsername(meta.instagram_username || '')
          setConnectedPageName(meta.facebook_page_name || '')
          setIgProfileUrl(meta.instagram_profile_url || '')
          setFbPageUrl(meta.facebook_page_url || '')
          setConnectedAt(meta.connected_at || '')
        }
      } catch {
        // No integration yet
      } finally {
        setPanelLoading(false)
      }
    }
    load()
  }, [baseUrl])

  async function handleSaveAppCredentials() {
    if (!metaAppId.trim()) { toast.error('Preencha o Facebook App ID'); return }
    setSavingApp(true)
    try {
      await api.post(`${baseUrl}/meta/app`, {
        app_id: metaAppId,
        app_secret: metaAppSecret.startsWith('••') ? undefined : metaAppSecret,
      })
      toast.success('Credenciais do App salvas!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    } finally {
      setSavingApp(false)
    }
  }

  async function handleSaveCredentials() {
    if (!connected && (!igToken || igToken.startsWith('••'))) {
      toast.error('Cole o Access Token')
      return
    }
    if (!igAccountId) { toast.error('Preencha o Instagram Business Account ID'); return }
    setSaving(true)
    try {
      await api.post(`${baseUrl}/meta`, {
        ...(igToken.startsWith('••') ? {} : { access_token: igToken }),
        instagram_account_id: igAccountId,
        facebook_page_id: fbPageId || undefined,
      })
      toast.success('Credenciais salvas!')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    try {
      const result = await api.post<any>(`${baseUrl}/meta/test`, {})
      setConnected(result?.valid || false)
      toast[result?.valid ? 'success' : 'error'](result?.message || 'Teste concluído')
    } catch {
      toast.error('Falha na conexão')
    } finally {
      setTesting(false)
    }
  }

  async function handleDisconnect() {
    try {
      await api.post(`${baseUrl}/meta/disconnect`, {})
      setConnected(false)
      setConnectedUsername('')
      setConnectedPageName('')
      setIgToken('')
      setIgAccountId('')
      setFbPageId('')
      toast.success('Desconectado')
      onRefresh()
    } catch {
      toast.error('Erro ao desconectar')
    }
  }

  function handleConnectFacebook() {
    if (!metaAppId.trim()) { toast.error('Primeiro salve o Facebook App ID'); return }
    window.location.href = buildFacebookOAuthUrl(metaAppId, company._id)
  }

  if (panelLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-brand-border">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-brand-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-100 truncate">{company.name}</p>
            <p className="text-xs text-gray-500">@{company.slug}</p>
          </div>
        </div>
        <Badge variant={connected ? 'success' : 'secondary'}>
          {connected ? 'Conectado' : 'Desconectado'}
        </Badge>
      </div>

      {/* Conta Conectada */}
      <Card className={connected ? 'border-emerald-500/30' : ''}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-gray-100">Conta Conectada</h3>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {connected ? (
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <WifiOff className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-100">
                  {connected ? 'Conectado' : 'Desconectado'}
                </span>
                {connected && (connectedUsername || connectedPageName) && (
                  <p className="text-xs text-gray-400">
                    {connectedUsername ? `@${connectedUsername}` : connectedPageName}
                  </p>
                )}
              </div>
            </div>
            {connected ? (
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                Desconectar
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConnectFacebook}
              >
                <Facebook className="w-4 h-4" />
                Conectar Facebook/Instagram
              </Button>
            )}
          </div>

          {connected && (connectedUsername || connectedPageName || igAccountId) && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-border">
              {connectedUsername && (
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Instagram</p>
                  <a
                    href={igProfileUrl || `https://instagram.com/${connectedUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
                  >
                    @{connectedUsername}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {connectedPageName && (
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Página Facebook</p>
                  <a
                    href={fbPageUrl || `https://facebook.com/${fbPageId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
                  >
                    {connectedPageName}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {igAccountId && (
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">IG Account ID</p>
                  <p className="text-xs text-gray-300 font-mono">{igAccountId}</p>
                </div>
              )}
              {connectedAt && (
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Conectado em</p>
                  <p className="text-xs text-gray-300">
                    {new Date(connectedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Credentials */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-gray-100">Credenciais do App</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Facebook App ID</Label>
              <Input placeholder="Ex: 1234567890" value={metaAppId} onChange={(e) => setMetaAppId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">App Secret</Label>
              <div className="relative">
                <Input
                  type={showAppSecret ? 'text' : 'password'}
                  placeholder={metaAppSecret.startsWith('••') ? 'Ja configurado' : 'Cole o App Secret'}
                  value={metaAppSecret}
                  onChange={(e) => setMetaAppSecret(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAppSecret(!showAppSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showAppSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button size="sm" className="gap-2" disabled={savingApp} onClick={handleSaveAppCredentials}>
              {savingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar credenciais do App
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Token */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-gray-100">Token de Acesso</h3>
            {connected && igToken.startsWith('••') && (
              <Badge variant="success" className="text-[10px]">Salvo via OAuth</Badge>
            )}
          </div>

          {connected && igToken.startsWith('••') ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-300">Token salvo automaticamente via OAuth.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Key className="w-3 h-3 text-gray-500" />
                Access Token (long-lived)
              </Label>
              <div className="relative">
                <Input
                  type={showToken ? 'text' : 'password'}
                  placeholder="Cole aqui o Access Token"
                  value={igToken}
                  onChange={(e) => setIgToken(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <Hash className="w-3 h-3 text-gray-500" />
              Instagram Business Account ID
            </Label>
            <Input placeholder="Preenchido ao conectar" value={igAccountId} onChange={(e) => setIgAccountId(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <FileText className="w-3 h-3 text-gray-500" />
              Facebook Page ID
            </Label>
            <Input placeholder="Preenchido ao conectar" value={fbPageId} onChange={(e) => setFbPageId(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" className="gap-2" disabled={saving} onClick={handleSaveCredentials}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </Button>
            <Button variant="outline" size="sm" className="gap-2" disabled={testing} onClick={handleTestConnection}>
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : connected ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Testar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminIntegrationsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [processingOAuth, setProcessingOAuth] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [companiesData, integrationsData] = await Promise.all([
        api.get<{ companies: Company[] }>('/api/companies'),
        api.get<{ integrations: IntegrationItem[] }>('/api/admin/health/integrations'),
      ])
      setCompanies(companiesData.companies || [])
      setIntegrations(integrationsData.integrations || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Detect OAuth callback from URL (admin flow — no useSearchParams needed)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const stateRaw = params.get('state')

    if (code && stateRaw) {
      let companyId: string | null = null
      try {
        const parsed = JSON.parse(decodeURIComponent(stateRaw))
        companyId = parsed.companyId || null
      } catch {}

      if (companyId) {
        setProcessingOAuth(true)
        const redirectUri = `${SOMA_ORIGIN}${ADMIN_REDIRECT_PATH}`
        api
          .post<any>(`/api/admin/integrations/${companyId}/meta/callback`, {
            code,
            redirect_uri: redirectUri,
          })
          .then((result) => {
            if (result?.success) {
              toast.success(
                result.instagram_username
                  ? `Conectado! Instagram: @${result.instagram_username}`
                  : `Conectado! Página: ${result.facebook_page_name}`,
              )
            }
          })
          .catch((err: any) => {
            toast.error(err.message || 'Erro ao conectar com Facebook')
          })
          .finally(() => {
            setProcessingOAuth(false)
            window.history.replaceState({}, '', window.location.pathname)
            loadData()
          })
        return
      }
    }

    loadData()
  }, [loadData])

  function handleRefresh() {
    setRefreshing(true)
    loadData()
  }

  // Merge companies with their integration status
  const merged: CompanyWithStatus[] = companies.map((company) => {
    const item = integrations.find((i) => i.company?._id === company._id) || null
    return { company, integration: item, integrationStatus: getIntegrationStatus(item) }
  })

  const filtered = merged.filter(
    (m) =>
      m.company.name.toLowerCase().includes(search.toLowerCase()) ||
      m.company.slug.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading || processingOAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        {processingOAuth && (
          <p className="text-sm text-gray-400">Processando callback OAuth...</p>
        )}
      </div>
    )
  }

  // Company integration panel
  if (selectedCompany) {
    return (
      <div className="max-w-2xl animate-fadeIn">
        <CompanyIntegrationPanel
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onRefresh={handleRefresh}
        />
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Integrações</h2>
          <p className="text-sm text-gray-400 mt-1">Gerencie as integrações de cada empresa</p>
        </div>
        <Button variant="outline" className="gap-2" disabled={refreshing} onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Mini-dash */}
      <MiniDash items={merged} />

      {/* Company list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="w-4 h-4 text-primary-400" />
            Empresas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="divide-y divide-brand-border -mx-6">
            {filtered.length === 0 ? (
              <div className="text-center py-10 px-6">
                <Building2 className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma empresa encontrada</p>
              </div>
            ) : (
              filtered.map(({ company, integration, integrationStatus }) => (
                <button
                  key={company._id}
                  onClick={() => setSelectedCompany(company)}
                  className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-brand-surface/50 transition-colors text-left"
                >
                  {/* Status dot */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      integrationStatus === 'active'
                        ? 'bg-emerald-400'
                        : integrationStatus === 'expired'
                        ? 'bg-amber-400'
                        : integrationStatus === 'disconnected'
                        ? 'bg-red-400'
                        : 'bg-gray-600'
                    }`}
                  />

                  {/* Company info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-200 truncate">
                        {company.name}
                      </span>
                      <IntegrationStatusBadge status={integrationStatus} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">@{company.slug}</span>
                      {integration?.meta.token_expires_at && (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(integration.meta.token_expires_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Integration icons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-brand-surface border border-brand-border">
                      <Instagram className="w-3 h-3 text-pink-400" />
                      <Facebook className="w-3 h-3 text-blue-400" />
                      {integration?.meta.connected ? (
                        integration.meta.token_expired ? (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        ) : (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        )
                      ) : (
                        <XCircle className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-brand-surface border border-brand-border">
                      <MessageCircle className="w-3 h-3 text-green-400" />
                      {integration?.whatsapp.connected ? (
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
