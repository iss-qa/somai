'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import IntegrationChecklist from '@/components/integrations/IntegrationChecklist'
import SetupModal from '@/components/setup/SetupModal'
import { useAuthStore } from '@/store/authStore'
import {
  Facebook,
  Save,
  Loader2,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  ExternalLink,
  Key,
  Hash,
  FileText,
  PlugZap,
} from 'lucide-react'

const SOMA_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'somai.issqa.com.br'
const SOMA_ORIGIN = `https://${SOMA_DOMAIN}`
const REDIRECT_PATH = '/app/settings/integrations'

const META_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
].join(',')

function buildFacebookOAuthUrl(appId: string) {
  // Use production URL to match what's registered in Facebook OAuth settings
  const redirectUri = `${SOMA_ORIGIN}${REDIRECT_PATH}`
  const state = crypto.randomUUID()
  sessionStorage.setItem('fb_oauth_state', state)

  return (
    `https://www.facebook.com/v25.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(META_SCOPES)}` +
    `&response_type=code` +
    `&state=${state}`
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>}>
      <IntegrationsContent />
    </Suspense>
  )
}

function IntegrationsContent() {
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin)

  // Setup modal — mostrar se integracao ainda não configurada (incluindo empresas retroativas)
  const needsSetup = !isAdmin() && user?.integracaoConfigurada === false
  const agendar = searchParams.get('agendar') === 'true'
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [setupInitialStep, setSetupInitialStep] = useState<'checklist' | 'method' | 'schedule' | 'credentials'>('checklist')

  useEffect(() => {
    if (needsSetup) {
      if (agendar) {
        setSetupInitialStep('schedule')
      }
      setShowSetupModal(true)
    }
  }, [needsSetup, agendar])

  // Connection state
  const [connected, setConnected] = useState(false)
  const [connectedUsername, setConnectedUsername] = useState('')
  const [connectedPageName, setConnectedPageName] = useState('')
  const [igProfileUrl, setIgProfileUrl] = useState('')
  const [fbPageUrl, setFbPageUrl] = useState('')
  const [connectedAt, setConnectedAt] = useState('')

  // App credentials (per company)
  const [metaAppId, setMetaAppId] = useState('')
  const [metaAppSecret, setMetaAppSecret] = useState('')
  const [showAppSecret, setShowAppSecret] = useState(false)

  // Token fields
  const [igToken, setIgToken] = useState('')
  const [igAccountId, setIgAccountId] = useState('')
  const [fbPageId, setFbPageId] = useState('')
  const [showToken, setShowToken] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [savingApp, setSavingApp] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connectingOAuth, setConnectingOAuth] = useState(false)

  // Save App ID / Secret before connecting
  async function handleSaveAppCredentials() {
    if (!metaAppId.trim()) {
      toast.error('Preencha o Facebook App ID')
      return
    }
    if (!metaAppSecret.trim() && !metaAppSecret.startsWith('••')) {
      toast.error('Preencha o App Secret')
      return
    }
    setSavingApp(true)
    try {
      await api.post('/api/integrations/meta/app', {
        app_id: metaAppId,
        app_secret: metaAppSecret.startsWith('••') ? undefined : metaAppSecret,
      })
      toast.success('Credenciais do App salvas!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar credenciais do App')
    } finally {
      setSavingApp(false)
    }
  }

  // Handle OAuth callback from Facebook
  const handleOAuthCallback = useCallback(async (code: string) => {
    setConnectingOAuth(true)
    try {
      const redirectUri = `${SOMA_ORIGIN}${REDIRECT_PATH}`
      const result = await api.post<any>('/api/integrations/meta/callback', {
        code,
        redirect_uri: redirectUri,
      })

      if (result?.success) {
        setConnected(true)
        setConnectedUsername(result.instagram_username || '')
        setConnectedPageName(result.facebook_page_name || '')
        setIgAccountId(result.instagram_account_id || '')
        setFbPageId(result.facebook_page_id || '')
        setIgProfileUrl(result.instagram_profile_url || '')
        setFbPageUrl(result.facebook_page_url || '')
        setConnectedAt(new Date().toISOString())
        setIgToken('••••••••••••••••••••••')
        toast.success(
          result.instagram_username
            ? `Conectado! Instagram: @${result.instagram_username}`
            : `Conectado! Página: ${result.facebook_page_name}`,
        )
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar com Facebook')
    } finally {
      setConnectingOAuth(false)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Load existing integration + detect OAuth callback
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      handleOAuthCallback(code)
      return
    }

    async function loadIntegration() {
      try {
        const data = await api.get<any>('/api/integrations/meta')
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
        setLoading(false)
      }
    }
    loadIntegration()
  }, [searchParams, handleOAuthCallback])

  async function handleSaveCredentials() {
    const tokenIsFromOAuth = igToken.startsWith('••')
    // If not connected via OAuth, require a real token
    if (!connected && (!igToken || tokenIsFromOAuth)) {
      toast.error('Cole o Access Token do Instagram')
      return
    }
    if (!igAccountId) {
      toast.error('Preencha o Instagram Business Account ID')
      return
    }
    setSaving(true)
    try {
      await api.post('/api/integrations/meta', {
        // Only send token if it's a new value (not the masked placeholder)
        ...(tokenIsFromOAuth ? {} : { access_token: igToken }),
        instagram_account_id: igAccountId,
        facebook_page_id: fbPageId || undefined,
      })
      toast.success('Credenciais salvas com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar credenciais')
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    try {
      const result = await api.post<any>('/api/integrations/meta/test', {
        token: igToken.startsWith('••') ? undefined : igToken,
        accountId: igAccountId,
        pageId: fbPageId,
      })
      if (result?.valid === false) {
        setConnected(false)
        toast.error(result.message || 'Token invalido. Reconecte sua conta.')
        return
      }
      setConnected(true)
      setConnectedUsername(result?.username || igAccountId)
      toast.success(
        `Conectado com sucesso! ${result?.username ? `Instagram: @${result.username}` : ''}`,
      )
    } catch {
      setConnected(false)
      toast.error('Falha na conexao. Verifique as credenciais.')
    } finally {
      setTesting(false)
    }
  }

  async function handleDisconnect() {
    try {
      await api.post('/api/integrations/meta/disconnect', {})
      setConnected(false)
      setConnectedUsername('')
      setConnectedPageName('')
      setIgToken('')
      setIgAccountId('')
      setFbPageId('')
      toast.success('Desconectado')
    } catch {
      toast.error('Erro ao desconectar')
    }
  }

  function handleConnectFacebook() {
    if (!metaAppId.trim()) {
      toast.error('Primeiro salve o Facebook App ID')
      return
    }
    window.location.href = buildFacebookOAuthUrl(metaAppId)
  }

  if (loading || connectingOAuth) {
    return (
      <>
        <SetupModal
          open={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onSelfSetup={() => setShowSetupModal(false)}
          initialStep={setupInitialStep}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          {connectingOAuth && (
            <p className="text-sm text-gray-400">Conectando com Facebook/Instagram...</p>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn">
      <SetupModal
        open={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSelfSetup={() => setShowSetupModal(false)}
        initialStep={setupInitialStep}
      />
      <div>
        <h2 className="text-xl font-semibold text-white">Integrações</h2>
        <p className="text-sm text-gray-400 mt-1">
          Conecte suas redes sociais para publicar automaticamente
        </p>
      </div>

      {/* ── Conta Conectada ──────────────────────────── */}
      <Card className={connected ? 'border-emerald-500/30' : ''}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlugZap className="w-5 h-5 text-primary-400" />
              <h3 className="text-base font-semibold text-gray-100">Conta Conectada</h3>
            </div>
            <Badge variant={connected ? 'success' : 'secondary'}>
              {connected ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connected ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-emerald-400" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <WifiOff className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-100">
                  {connected ? 'Conectado' : 'Desconectado'}
                </span>
                {connected && (connectedUsername || connectedPageName) && (
                  <p className="text-sm text-gray-400">
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
                disabled={connectingOAuth}
              >
                {connectingOAuth ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Facebook className="w-4 h-4" />
                )}
                Conectar com Facebook/Instagram
              </Button>
            )}
          </div>

          {/* Connected account details */}
          {connected && (
            <div className="space-y-3 pt-2 border-t border-brand-border">
              <div className="grid grid-cols-2 gap-3">
                {connectedUsername && (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Instagram</p>
                    <a
                      href={igProfileUrl || `https://instagram.com/${connectedUsername}`}
                      target="_blank"
                      rel="noopener"
                      className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
                    >
                      @{connectedUsername}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {connectedPageName && (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Página Facebook</p>
                    <a
                      href={fbPageUrl || `https://facebook.com/${fbPageId}`}
                      target="_blank"
                      rel="noopener"
                      className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
                    >
                      {connectedPageName}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {igAccountId && (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">IG Account ID</p>
                    <p className="text-sm text-gray-300 font-mono">{igAccountId}</p>
                  </div>
                )}
                {fbPageId && (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Page ID</p>
                    <p className="text-sm text-gray-300 font-mono">{fbPageId}</p>
                  </div>
                )}
                {metaAppId && (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">App ID</p>
                    <p className="text-sm text-gray-300 font-mono">{metaAppId}</p>
                  </div>
                )}
                {connectedAt && (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Conectado em</p>
                    <p className="text-sm text-gray-300">
                      {new Date(connectedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Checklist de Integração ──────────────────── */}
      <Card>
        <CardContent className="p-5">
          <IntegrationChecklist
            onAllCompleted={(done) => {
              if (done && !connected) {
                toast.success('Checklist completa! Agora conecte com Facebook/Instagram.')
              }
            }}
            metaAppId={metaAppId}
            metaAppSecret={metaAppSecret}
            showAppSecret={showAppSecret}
            savingApp={savingApp}
            onMetaAppIdChange={setMetaAppId}
            onMetaAppSecretChange={setMetaAppSecret}
            onToggleShowAppSecret={() => setShowAppSecret(!showAppSecret)}
            onSaveAppCredentials={handleSaveAppCredentials}
          />
        </CardContent>
      </Card>

      {/* ── Token de Acesso (preenchido automaticamente) ── */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary-400" />
            <h3 className="text-base font-semibold text-gray-100">Token de Acesso</h3>
            {connected && igToken.startsWith('••') ? (
              <Badge variant="success" className="text-[10px]">
                Salvo via OAuth
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Preenchido automaticamente ao conectar
              </Badge>
            )}
          </div>

          {/* After OAuth: show saved state; otherwise show manual input */}
          {connected && igToken.startsWith('••') ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-emerald-300 space-y-1">
                <p className="font-medium">Token salvo automaticamente via OAuth</p>
                <p className="text-emerald-400/70">
                  O token de longa duração foi obtido e salvo durante a conexão com o Facebook.
                  Não e necessario preenchimento manual.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300 font-medium mb-1">Como obter o token manualmente:</p>
                <ol className="text-xs text-amber-200/70 space-y-1 list-decimal list-inside">
                  <li>Acesse <strong>developers.facebook.com/tools/explorer</strong></li>
                  <li>Selecione seu App no menu superior</li>
                  <li>Clique em <strong>&quot;Generate Access Token&quot;</strong> e autorize as permissoes</li>
                  <li>Copie o token gerado e cole abaixo</li>
                  <li>Para token de longa duracao: em <strong>Ferramentas &gt; Access Token Debugger</strong>, clique &quot;Extend Access Token&quot;</li>
                </ol>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-gray-500" />
                  Instagram User Access Token (long-lived)
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
            </div>
          )}

          {/* Account ID */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-gray-500" />
              Instagram Business Account ID
            </Label>
            <Input
              placeholder="Preenchido ao conectar"
              value={igAccountId}
              onChange={(e) => setIgAccountId(e.target.value)}
            />
          </div>

          {/* Facebook Page ID */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              Facebook Page ID
            </Label>
            <Input
              placeholder="Preenchido ao conectar"
              value={fbPageId}
              onChange={(e) => setFbPageId(e.target.value)}
            />
          </div>

          {/* Action buttons — only show when NOT from OAuth */}
          {!(connected && igToken.startsWith('••')) && (
            <div className="flex items-center gap-3 pt-2">
              <Button className="gap-2" disabled={saving} onClick={handleSaveCredentials}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar credenciais
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                disabled={testing}
                onClick={handleTestConnection}
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : connected ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Testar conexao
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
