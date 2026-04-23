'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MetricCard } from '@/components/company/MetricCard'
import { PostItem } from '@/components/company/PostItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { getGreeting } from '@/lib/utils'
import { SUPPORT_CONTACT } from '@/lib/contact'
import {
  Send,
  Image,
  Calendar,
  Video,
  CheckCircle2,
  Sparkles,
  Clock,
  ArrowRight,
  Loader2,
  Bell,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  CreditCard,
  Lock,
  Target,
  MessageSquare,
  Timer,
  MessageCircle,
  Mail,
} from 'lucide-react'

interface DashNotification {
  _id: string
  type: string
  title: string
  message: string
  read: boolean
  action_url: string
  created_at: string
  expires_at: string | null
}

const notifTypeIcons: Record<string, React.ElementType> = {
  token_expired: AlertTriangle,
  post_failed: AlertTriangle,
  payment_due: CreditCard,
  payment_overdue: CreditCard,
  access_blocked: Lock,
  setup_pending: Clock,
  video_ready: Video,
  video_failed: AlertTriangle,
  campaign_published: Target,
  campaign_completed: CheckCircle,
  card_publicado: Image,
  card_agendado: Calendar,
  comunicacao: MessageSquare,
}

const notifTypeColors: Record<string, { text: string; bg: string }> = {
  token_expired: { text: 'text-amber-400', bg: 'bg-amber-500/15' },
  post_failed: { text: 'text-red-400', bg: 'bg-red-500/15' },
  payment_due: { text: 'text-amber-400', bg: 'bg-amber-500/15' },
  payment_overdue: { text: 'text-red-400', bg: 'bg-red-500/15' },
  access_blocked: { text: 'text-red-400', bg: 'bg-red-500/15' },
  setup_pending: { text: 'text-blue-400', bg: 'bg-blue-500/15' },
  video_ready: { text: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  video_failed: { text: 'text-red-400', bg: 'bg-red-500/15' },
  campaign_published: { text: 'text-purple-400', bg: 'bg-purple-500/15' },
  campaign_completed: { text: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  card_publicado: { text: 'text-green-400', bg: 'bg-green-500/15' },
  card_agendado: { text: 'text-blue-400', bg: 'bg-blue-500/15' },
  comunicacao: { text: 'text-primary-400', bg: 'bg-primary-500/15' },
}

function notifTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `ha ${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `ha ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `ha ${diffD}d`
}

interface DashboardData {
  metrics: {
    postsThisMonth: number
    approvedCards: number
    scheduledToday: number
    videosGenerated: number
    publishedCards: number
  }
  upcomingPosts: Array<{
    _id: string
    caption: string
    card_id?: { generated_image_url?: string }
    platforms: string[]
    published_at: string | null
    created_at: string
    status: 'published' | 'failed' | 'cancelled'
  }>
}

function TrialBanner() {
  const user = useAuthStore((s) => s.user)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!user?.trialExpiresAt) return
    function update() {
      const diff = new Date(user!.trialExpiresAt!).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Expirado')
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      if (days > 0) {
        setTimeLeft(`${days} dia${days > 1 ? 's' : ''} e ${hours}h ${mins}min`)
      } else {
        setTimeLeft(`${hours}h ${mins}min`)
      }
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [user?.trialExpiresAt])

  // Admin liberou acesso — nao exibe mais o banner
  if (user?.accessEnabled === true) return null
  if (!user?.trialExpiresAt || !timeLeft) return null

  const expired = timeLeft === 'Expirado'

  const waMsg = 'Ola, meu periodo de teste do Soma.ai encerrou e quero ativar meu plano.'

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-xl border ${
      expired
        ? 'bg-red-500/10 border-red-500/20'
        : 'bg-amber-500/10 border-amber-500/20'
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          expired ? 'bg-red-500/15' : 'bg-amber-500/15'
        }`}>
          <Timer className={`w-5 h-5 ${expired ? 'text-red-400' : 'text-amber-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${expired ? 'text-red-300' : 'text-amber-300'}`}>
            {expired ? 'Periodo de teste encerrado' : 'Periodo de teste ativo'}
          </p>
          <p className={`text-xs ${expired ? 'text-red-400/70' : 'text-amber-400/70'}`}>
            {expired
              ? 'Fale com nosso time para ativar seu plano:'
              : `Tempo restante: ${timeLeft}`
            }
          </p>
        </div>
      </div>

      {expired && (
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <a
            href={SUPPORT_CONTACT.whatsappUrl(waMsg)}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
          <a
            href={SUPPORT_CONTACT.mailtoUrl('Ativar plano Soma.ai')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border hover:border-gray-600 text-gray-200 text-xs font-medium transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </a>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const trialExpired = useAuthStore((s) => s.isTrialExpired)()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<DashNotification[]>([])

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [result, notifData] = await Promise.all([
          api.get<DashboardData>('/api/dashboard/summary'),
          api.get<{ notifications: DashNotification[]; count: number }>('/api/notifications/unread').catch(() => ({ notifications: [], count: 0 })),
        ])
        setData(result)
        setNotifications(notifData.notifications.slice(0, 5))
      } catch {
        setData({
          metrics: {
            postsThisMonth: 0,
            approvedCards: 0,
            scheduledToday: 0,
            videosGenerated: 0,
            publishedCards: 0,
          },
          upcomingPosts: [],
        })
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  async function dismissNotification(id: string) {
    try {
      await api.post(`/api/notifications/${id}/dismiss`)
      setNotifications((prev) => prev.filter((n) => n._id !== id))
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  const metrics = data?.metrics || {
    postsThisMonth: 0,
    approvedCards: 0,
    scheduledToday: 0,
    videosGenerated: 0,
    publishedCards: 0,
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          {getGreeting()}, {user?.companyName || user?.name || 'bem-vindo'}!
        </h2>
        <p className="text-gray-400 mt-1">
          Aqui esta o resumo do seu marketing hoje.
        </p>
      </div>

      {/* Trial countdown banner */}
      <TrialBanner />

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Posts este mes"
          value={metrics.postsThisMonth}
          icon={Send}
          color="blue"
        />
        <MetricCard
          title="Cards aprovados"
          value={metrics.approvedCards}
          icon={Image}
          color="green"
        />
        <MetricCard
          title="Publicados"
          value={metrics.publishedCards}
          icon={CheckCircle2}
          color="pink"
        />
        <MetricCard
          title="Agendados hoje"
          value={metrics.scheduledToday}
          icon={Calendar}
          color="yellow"
        />
        <MetricCard
          title="Videos gerados"
          value={metrics.videosGenerated}
          icon={Video}
          color="purple"
        />
      </div>

      {/* Notifications / Alerts */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-400" />
              Alertas e Mensagens
            </CardTitle>
            <span className="text-xs text-gray-500">
              {notifications.length} pendente{notifications.length !== 1 ? 's' : ''}
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((n) => {
                const Icon = notifTypeIcons[n.type] || Info
                const colors = notifTypeColors[n.type] || { text: 'text-gray-400', bg: 'bg-gray-500/15' }
                return (
                  <div
                    key={n._id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-brand-surface border border-brand-border hover:border-gray-700 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (n.action_url) router.push(n.action_url)
                          }}
                        >
                          <p className="text-sm font-medium text-gray-200 leading-tight">
                            {n.title}
                          </p>
                          {n.message && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {n.message}
                            </p>
                          )}
                          <span className="text-[10px] text-gray-600 mt-1 inline-block">
                            {notifTimeAgo(n.created_at)}
                            {n.expires_at && (
                              <span className="text-amber-600 ml-2">
                                expira {notifTimeAgo(n.expires_at)}
                              </span>
                            )}
                          </span>
                        </div>
                        <button
                          onClick={() => dismissNotification(n._id)}
                          className="text-gray-700 hover:text-gray-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming posts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-400" />
              Proximas postagens
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/app/calendar')}
              className="gap-1"
            >
              Ver todas
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {data?.upcomingPosts && data.upcomingPosts.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingPosts.slice(0, 5).map((post) => (
                  <PostItem key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  Nenhuma postagem agendada
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Gere um card e agende sua primeira postagem
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Acoes rapidas
          </h3>

          <QuickAction
            title="Gerar Card"
            description="Crie um card com IA"
            icon={Sparkles}
            color="primary"
            onClick={() => router.push('/app/cards/generate')}
            locked={trialExpired}
          />

          <QuickAction
            title="Agendar Post"
            description="Programe publicacoes"
            icon={Calendar}
            color="blue"
            onClick={() => router.push('/app/calendar')}
            locked={trialExpired}
          />

          <QuickAction
            title="Criar Video"
            description="Gere videos com IA"
            icon={Video}
            color="purple"
            onClick={() => router.push('/app/videos')}
            locked={trialExpired}
          />
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  title, description, icon: Icon, color, onClick, locked,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'blue' | 'purple'
  onClick: () => void
  locked?: boolean
}) {
  const colorMap = {
    primary: { border: 'hover:border-primary-500/40', bg: 'hover:bg-primary-500/5', iconBg: 'bg-primary-500/15 group-hover:bg-primary-500/25', icon: 'text-primary-400' },
    blue: { border: 'hover:border-blue-500/40', bg: 'hover:bg-blue-500/5', iconBg: 'bg-blue-500/15 group-hover:bg-blue-500/25', icon: 'text-blue-400' },
    purple: { border: 'hover:border-purple-500/40', bg: 'hover:bg-purple-500/5', iconBg: 'bg-purple-500/15 group-hover:bg-purple-500/25', icon: 'text-purple-400' },
  }[color]

  if (locked) {
    return (
      <div
        title="Disponivel apos ativar seu plano"
        className="w-full rounded-xl border border-brand-border bg-brand-card/50 p-5 text-left opacity-50 cursor-not-allowed relative"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-400">{title}</p>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
          <Lock className="w-4 h-4 text-gray-600" />
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full group rounded-xl border border-brand-border bg-brand-card p-5 text-left transition-all ${colorMap.border} ${colorMap.bg}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colorMap.iconBg} flex items-center justify-center transition-colors`}>
          <Icon className={`w-5 h-5 ${colorMap.icon}`} />
        </div>
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  )
}
