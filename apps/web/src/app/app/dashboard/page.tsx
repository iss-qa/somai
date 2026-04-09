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
} from 'lucide-react'

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

  useEffect(() => {
    async function loadDashboard() {
      try {
        const result = await api.get<DashboardData>('/api/dashboard/summary')
        setData(result)
      } catch {
        // Use placeholder data if API is not available
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
