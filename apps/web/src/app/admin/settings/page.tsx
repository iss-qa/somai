'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
  Settings,
  CreditCard,
  Store,
  Server,
  Info,
  CheckCircle,
  Instagram,
  Facebook,
  MessageCircle,
  Video,
  Megaphone,
  Layers,
} from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    setup: 50,
    monthly: 29.9,
    features: ['Instagram', 'Cards ilimitados'],
    badge: 'default' as const,
    badgeLabel: 'Básico',
  },
  {
    name: 'Pro',
    setup: 50,
    monthly: 50,
    features: [
      'Instagram + Facebook',
      'Cards ilimitados',
      'Vídeos 2/dia',
      'WhatsApp',
      'Campanhas',
    ],
    badge: 'success' as const,
    badgeLabel: 'Recomendado',
  },
  {
    name: 'Enterprise',
    setup: 50,
    monthly: 69.9,
    features: [
      'Instagram + Facebook',
      'Cards ilimitados',
      'Vídeos 5/dia',
      'WhatsApp',
      'Campanhas',
      'Tráfego Pago',
      'Reconhecimento',
    ],
    badge: 'info' as const,
    badgeLabel: 'Premium',
  },
]

const niches = [
  'Farmacia',
  'Pet Shop',
  'Moda',
  'Cosmeticos',
  'Mercearia',
  'Calcados',
  'Outro',
]

const systemConfig = {
  apiUrl: 'http://localhost:3001',
  services: [
    { name: 'Evolution API', status: 'online' as const },
    { name: 'Redis', status: 'online' as const },
  ],
}

const featureIcons: Record<string, React.ElementType> = {
  Instagram: Instagram,
  'Instagram + Facebook': Facebook,
  'Cards ilimitados': Layers,
  'Videos 2/dia': Video,
  'Videos 5/dia': Video,
  WhatsApp: MessageCircle,
  Campanhas: Megaphone,
  'Trafego Pago': Megaphone,
  Reconhecimento: CheckCircle,
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-400" />
          Configurações Globais
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Planos, nichos e configurações do sistema
        </p>
      </div>

      {/* Plans section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-4 h-4 text-primary-400" />
            Planos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="rounded-lg border border-brand-border bg-brand-surface p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {plan.name}
                  </h3>
                  <Badge variant={plan.badge}>
                    {plan.badgeLabel}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {formatCurrency(plan.monthly)}
                    </span>
                    <span className="text-sm text-gray-500">/mês</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Setup: {formatCurrency(plan.setup)}
                  </p>
                </div>

                <div className="border-t border-brand-border pt-4 space-y-2.5">
                  {plan.features.map((feature) => {
                    const FeatureIcon = featureIcons[feature] || CheckCircle
                    return (
                      <div
                        key={feature}
                        className="flex items-center gap-2.5 text-sm text-gray-300"
                      >
                        <FeatureIcon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                        {feature}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Niches section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="w-4 h-4 text-primary-400" />
            Nichos configurados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {niches.map((niche) => (
              <Badge key={niche} variant="secondary" className="text-sm px-3 py-1">
                {niche}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* System config section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="w-4 h-4 text-primary-400" />
              Configurações do sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API URL */}
            <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
              <p className="text-xs text-gray-500 mb-1">API URL</p>
              <p className="text-sm font-mono text-gray-200">
                {systemConfig.apiUrl}
              </p>
            </div>

            {/* Service statuses */}
            {systemConfig.services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-surface p-4"
              >
                <span className="text-sm text-gray-300">{service.name}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      service.status === 'online'
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                        : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'
                    }`}
                  />
                  <Badge
                    variant={service.status === 'online' ? 'success' : 'destructive'}
                  >
                    {service.status === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* About section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="w-4 h-4 text-primary-400" />
              Sobre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-brand-border bg-brand-surface p-5 text-center space-y-3">
              <div>
                <h3 className="text-lg font-bold text-white">Soma.ai</h3>
                <Badge variant="outline" className="mt-1">
                  v0.0.1
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Plataforma de automacao de conteudo para parceiros
              </p>
            </div>

            <div className="rounded-lg border border-brand-border bg-brand-surface p-4 space-y-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {['Next.js', 'Fastify', 'MongoDB', 'BullMQ'].map((tech) => (
                  <Badge key={tech} variant="info" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
