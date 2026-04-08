'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
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
  Sparkles,
  Clock,
} from 'lucide-react'

interface IntegrationItem {
  company: { _id: string; name: string; slug: string }
  meta: {
    connected: boolean
    status: string
    token_expires_at: string | null
    token_expired: boolean
  }
  whatsapp: {
    connected: boolean
    status: string
  }
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadData() {
    try {
      const data = await api.get<{ integrations: IntegrationItem[] }>(
        '/api/admin/health/integrations',
      )
      setIntegrations(data.integrations || [])
    } catch {
      setIntegrations([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleRefresh() {
    setRefreshing(true)
    loadData()
  }

  const connectedMeta = integrations.filter((i) => i.meta.connected).length
  const expiredMeta = integrations.filter((i) => i.meta.token_expired).length
  const connectedWa = integrations.filter((i) => i.whatsapp.connected).length

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
          <h2 className="text-xl font-semibold text-white">Integracoes</h2>
          <p className="text-sm text-gray-400 mt-1">
            Status das integracoes por empresa
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={refreshing}
          onClick={handleRefresh}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{integrations.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total empresas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{connectedMeta}</p>
            <p className="text-xs text-gray-500 mt-1">Meta conectadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{expiredMeta}</p>
            <p className="text-xs text-gray-500 mt-1">Tokens expirados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{connectedWa}</p>
            <p className="text-xs text-gray-500 mt-1">WhatsApp conectados</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="w-4 h-4 text-primary-400" />
            Status por Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {integrations.length > 0 ? (
            <div className="divide-y divide-brand-border">
              {integrations.map((item) => (
                <div
                  key={item.company._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-brand-surface/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">{item.company.name}</p>
                    <p className="text-xs text-gray-600">@{item.company.slug}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Instagram/Facebook (Meta) */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-surface border border-brand-border">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      <Facebook className="w-3.5 h-3.5 text-blue-400" />
                      {item.meta.connected ? (
                        item.meta.token_expired ? (
                          <Badge variant="warning" className="text-[10px]">
                            Token expirado
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Conectado
                          </Badge>
                        )
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Desconectado
                        </Badge>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-surface border border-brand-border">
                      <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                      {item.whatsapp.connected ? (
                        <Badge variant="success" className="text-[10px]">
                          Conectado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Desconectado
                        </Badge>
                      )}
                    </div>

                    {/* Token expiry */}
                    {item.meta.token_expires_at && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(item.meta.token_expires_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Plug className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhuma integracao configurada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
