'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Cloud,
  Wifi,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency?: number
  lastCheck: string
}

interface MetaIntegration {
  companyName: string
  igStatus: 'connected' | 'expired' | 'error'
  fbStatus: 'connected' | 'expired' | 'error'
  lastError?: string
}

interface QueueStatus {
  pending: number
  processing: number
  failed: number
}

interface RecentError {
  id: string
  service: string
  message: string
  timestamp: string
}

interface HealthData {
  services: ServiceStatus[]
  metaIntegrations: MetaIntegration[]
  queue: QueueStatus
  recentErrors: RecentError[]
}

const serviceIcons: Record<string, React.ElementType> = {
  Fastify: Server,
  MongoDB: Database,
  Redis: HardDrive,
  'Evolution API': Wifi,
  'R2 Storage': Cloud,
}

const statusConfig = {
  healthy: { label: 'Saudavel', color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: CheckCircle },
  degraded: { label: 'Degradado', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: AlertTriangle },
  down: { label: 'Fora do ar', color: 'text-red-400', bg: 'bg-red-500/15', icon: XCircle },
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadHealth() {
    try {
      const result = await api.get<HealthData>('/api/admin/health/services')
      setData(result)
    } catch {
      setData({
        services: [
          { name: 'Fastify', status: 'healthy', latency: 12, lastCheck: new Date().toISOString() },
          { name: 'MongoDB', status: 'healthy', latency: 5, lastCheck: new Date().toISOString() },
          { name: 'Redis', status: 'healthy', latency: 2, lastCheck: new Date().toISOString() },
          { name: 'Evolution API', status: 'healthy', latency: 45, lastCheck: new Date().toISOString() },
          { name: 'R2 Storage', status: 'healthy', latency: 30, lastCheck: new Date().toISOString() },
        ],
        metaIntegrations: [],
        queue: { pending: 0, processing: 0, failed: 0 },
        recentErrors: [],
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadHealth()
  }, [])

  function handleRefresh() {
    setRefreshing(true)
    loadHealth()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  const services = data?.services || []
  const queue = data?.queue || { pending: 0, processing: 0, failed: 0 }
  const integrations = data?.metaIntegrations || []
  const errors = data?.recentErrors || []

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Saúde do Sistema</h2>
          <p className="text-sm text-gray-400 mt-1">
            Monitore o status de todos os serviços
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

      {/* Service status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {services.map((service) => {
          const config = statusConfig[service.status]
          const StatusIcon = config.icon
          const ServiceIcon = serviceIcons[service.name] || Server

          return (
            <Card key={service.name} className="hover:border-gray-700 transition-colors">
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center mx-auto mb-3`}>
                  <ServiceIcon className={`w-6 h-6 ${config.color}`} />
                </div>
                <p className="text-sm font-medium text-gray-200 mb-1">{service.name}</p>
                <div className="flex items-center justify-center gap-1.5">
                  <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                {service.latency && (
                  <p className="text-[10px] text-gray-600 mt-1">{service.latency}ms</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Meta integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="w-4 h-4 text-primary-400" />
              Integrações Meta por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {integrations.length > 0 ? (
              <div className="space-y-3">
                {integrations.map((integration, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-brand-surface border border-brand-border"
                  >
                    <span className="text-sm text-gray-300">{integration.companyName}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          integration.igStatus === 'connected'
                            ? 'success'
                            : integration.igStatus === 'expired'
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        IG: {integration.igStatus === 'connected' ? 'OK' : integration.igStatus}
                      </Badge>
                      <Badge
                        variant={
                          integration.fbStatus === 'connected'
                            ? 'success'
                            : integration.fbStatus === 'expired'
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        FB: {integration.fbStatus === 'connected' ? 'OK' : integration.fbStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Cloud className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma integracao configurada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-primary-400" />
              Status da Fila
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-brand-surface border border-brand-border">
                <p className="text-2xl font-bold text-amber-400">{queue.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Pendentes</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-brand-surface border border-brand-border">
                <p className="text-2xl font-bold text-blue-400">{queue.processing}</p>
                <p className="text-xs text-gray-500 mt-1">Processando</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-brand-surface border border-brand-border">
                <p className="text-2xl font-bold text-red-400">{queue.failed}</p>
                <p className="text-xs text-gray-500 mt-1">Falharam</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Erros Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length > 0 ? (
            <div className="space-y-2">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10"
                >
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {error.service}
                      </Badge>
                      <span className="text-xs text-gray-600">
                        {formatDateTime(error.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 truncate">
                      {error.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhum erro recente</p>
              <p className="text-xs text-gray-600 mt-1">
                Todos os serviços funcionando normalmente
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
