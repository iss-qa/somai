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

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
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

          <button
            onClick={() => router.push('/app/cards/generate')}
            className="w-full group rounded-xl border border-brand-border bg-brand-card p-5 text-left transition-all hover:border-primary-500/40 hover:bg-primary-500/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/15 flex items-center justify-center group-hover:bg-primary-500/25 transition-colors">
                <Sparkles className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="font-medium text-white">Gerar Card</p>
                <p className="text-xs text-gray-500">Crie um card com IA</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/app/calendar')}
            className="w-full group rounded-xl border border-brand-border bg-brand-card p-5 text-left transition-all hover:border-blue-500/40 hover:bg-blue-500/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/25 transition-colors">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">Agendar Post</p>
                <p className="text-xs text-gray-500">Programe publicacoes</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/app/videos')}
            className="w-full group rounded-xl border border-brand-border bg-brand-card p-5 text-left transition-all hover:border-purple-500/40 hover:bg-purple-500/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center group-hover:bg-purple-500/25 transition-colors">
                <Video className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">Criar Video</p>
                <p className="text-xs text-gray-500">Gere videos com IA</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
