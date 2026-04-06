'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Instagram,
  Facebook,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  Link2,
  Key,
  Hash,
  FileText,
} from 'lucide-react'

export default function IntegrationsPage() {
  // Connection state
  const [connected, setConnected] = useState(false)
  const [connectedUsername, setConnectedUsername] = useState('')

  // Token fields
  const [igToken, setIgToken] = useState('')
  const [igAccountId, setIgAccountId] = useState('')
  const [fbPageId, setFbPageId] = useState('')
  const [showToken, setShowToken] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showGuide, setShowGuide] = useState(false)

  // Load existing integration
  useEffect(() => {
    async function loadIntegration() {
      try {
        const data = await api.get<any>('/api/integrations/meta')
        if (data) {
          setIgToken(data.access_token ? '••••••••••••••••••••••' : '')
          setIgAccountId(data.instagram_account_id || '')
          setFbPageId(data.facebook_page_id || '')
          setConnected(data.connected || false)
          setConnectedUsername(data.instagram_username || '')
        }
      } catch {
        // No integration yet
      } finally {
        setLoading(false)
      }
    }
    loadIntegration()
  }, [])

  async function handleSaveCredentials() {
    if (!igToken || igToken.startsWith('••')) {
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
        access_token: igToken,
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
      setConnected(true)
      setConnectedUsername(result?.username || igAccountId)
      toast.success(`Conectado com sucesso! ${result?.username ? `Instagram: @${result.username}` : ''}`)
    } catch {
      setConnected(false)
      toast.error('Falha na conexao. Verifique as credenciais.')
    } finally {
      setTesting(false)
    }
  }

  async function handleDisconnect() {
    try {
      await api.post('/api/integrations/meta', {
        access_token: '',
        instagram_account_id: '',
        facebook_page_id: '',
      })
      setConnected(false)
      setConnectedUsername('')
      setIgToken('')
      setIgAccountId('')
      setFbPageId('')
      toast.success('Desconectado')
    } catch {
      toast.error('Erro ao desconectar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn">
      <div>
        <h2 className="text-xl font-semibold text-white">Integracoes</h2>
        <p className="text-sm text-gray-400 mt-1">
          Conecte suas redes sociais para publicar automaticamente
        </p>
      </div>

      {/* ── Connection Status ─────────────────────────── */}
      <Card className={connected ? 'border-emerald-500/30' : ''}>
        <CardContent className="p-5">
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-100">
                    {connected ? 'Conectado' : 'Desconectado'}
                  </span>
                  <Badge variant={connected ? 'success' : 'secondary'}>
                    {connected ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                {connected && connectedUsername && (
                  <p className="text-sm text-gray-400">@{connectedUsername}</p>
                )}
              </div>
            </div>

            {connected && (
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                Desconectar
              </Button>
            )}
          </div>

          {connected && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-emerald-300">
                Conectado com sucesso! Instagram: @{connectedUsername || igAccountId}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Token de Acesso ────────────────────────────── */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary-400" />
            <h3 className="text-base font-semibold text-gray-100">Token de Acesso</h3>
          </div>

          {/* How to guide - collapsible */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center gap-2 p-3 rounded-lg bg-brand-surface border border-brand-border hover:border-gray-700 transition-colors text-left"
          >
            <Info className="w-4 h-4 text-primary-400 flex-shrink-0" />
            <span className="text-sm text-gray-300 flex-1">Como preencher (clique nos links para abrir)</span>
            {showGuide ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {showGuide && (
            <div className="space-y-4 p-4 rounded-lg bg-brand-surface border border-brand-border">
              {/* Step 1 */}
              <div>
                <p className="text-sm font-semibold text-gray-200">1. Access Token</p>
                <p className="text-sm text-gray-400 mt-1">
                  Abra o{' '}
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noopener"
                    className="text-primary-400 hover:text-primary-300 underline inline-flex items-center gap-1"
                  >
                    Graph API Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                  , clique em <strong className="text-gray-200">&quot;Gerar Token de Acesso&quot;</strong>, copie o token que aparece no campo de texto superior.
                </p>
              </div>

              {/* Step 2 */}
              <div>
                <p className="text-sm font-semibold text-gray-200">2. Instagram Business Account ID</p>
                <p className="text-sm text-gray-400 mt-1">
                  No mesmo{' '}
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noopener"
                    className="text-primary-400 hover:text-primary-300 underline inline-flex items-center gap-1"
                  >
                    Graph Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                  , clique <strong className="text-gray-200">&quot;Enviar&quot;</strong>. Na resposta, copie o numero dentro de{' '}
                  <code className="px-1.5 py-0.5 rounded bg-gray-800 text-primary-300 text-xs">instagram_business_account.id</code>
                </p>
              </div>

              {/* Step 3 */}
              <div>
                <p className="text-sm font-semibold text-gray-200">3. Facebook Page ID</p>
                <p className="text-sm text-gray-400 mt-1">
                  Na mesma resposta acima, copie o campo{' '}
                  <code className="px-1.5 py-0.5 rounded bg-gray-800 text-primary-300 text-xs">id</code>{' '}
                  da pagina. Ou abra{' '}
                  <a
                    href="https://www.facebook.com/pages/?category=your_pages"
                    target="_blank"
                    rel="noopener"
                    className="text-primary-400 hover:text-primary-300 underline inline-flex items-center gap-1"
                  >
                    Configuracoes de Paginas do Facebook <ExternalLink className="w-3 h-3" />
                  </a>
                  .
                </p>
              </div>

              <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-300">
                  Requisito: conta Instagram do tipo Business/Creator vinculada a uma Pagina do Facebook.
                </p>
              </div>
            </div>
          )}

          {/* Token input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-gray-500" />
                Instagram User Access Token (long-lived)
              </Label>
            </div>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                placeholder="Cole o token do Graph Explorer"
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
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Cole o token do Graph Explorer</p>
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener"
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Abrir Graph Explorer
              </a>
            </div>
          </div>

          {/* Account ID */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-gray-500" />
              Instagram Business Account ID
            </Label>
            <Input
              placeholder="Ex: 17841480579168244"
              value={igAccountId}
              onChange={(e) => setIgAccountId(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Numero dentro de instagram_business_account.id</p>
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener"
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Buscar ID
              </a>
            </div>
          </div>

          {/* Facebook Page ID */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              Facebook Page ID
            </Label>
            <Input
              placeholder="Ex: 953082297899308"
              value={fbPageId}
              onChange={(e) => setFbPageId(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Campo &quot;id&quot; da Pagina na resposta do Graph Explorer</p>
              <a
                href="https://www.facebook.com/pages/?category=your_pages"
                target="_blank"
                rel="noopener"
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Ver Paginas
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              className="gap-2"
              disabled={saving}
              onClick={handleSaveCredentials}
            >
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
        </CardContent>
      </Card>
    </div>
  )
}
