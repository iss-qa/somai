'use client'

import { useEffect, useState } from 'react'
import { MetricCard } from '@/components/company/MetricCard'
import { PostItem } from '@/components/company/PostItem'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn, formatDateTime, truncate } from '@/lib/utils'
import {
  Send,
  CheckCircle,
  Calendar,
  AlertCircle,
  Filter,
  Loader2,
  RotateCcw,
  Eye,
  Instagram,
  Facebook,
  Image as ImageIcon,
  Clock,
} from 'lucide-react'

type PostStatus = 'published' | 'failed' | 'cancelled' | 'queued'

interface Post {
  _id: string
  caption: string
  thumbnail?: string
  platforms: string[]
  published_at: string | null
  scheduled_at?: string | null
  created_at: string
  status: PostStatus
  card_id?: { generated_image_url?: string }
}

interface PostMetrics {
  total: number
  published: number
  queued: number
  cancelled: number
  failed: number
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [metrics, setMetrics] = useState<PostMetrics>({
    total: 0,
    published: 0,
    queued: 0,
    cancelled: 0,
    failed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')

  useEffect(() => {
    async function loadPosts() {
      try {
        const [postsRes, queueRes] = await Promise.all([
          api.get<{ posts: Post[]; pagination: any }>('/api/posts'),
          api.get<{ items: any[]; pagination: any }>('/api/post-queue?status=queued&limit=200').catch(() => ({ items: [] as any[] })),
        ])
        const loadedPosts = postsRes.posts || []
        const queuedItems: Post[] = (queueRes.items || []).map((q: any) => ({
          _id: q._id,
          caption: q.caption || '',
          platforms: q.platforms || [],
          published_at: null,
          scheduled_at: q.scheduled_at,
          created_at: q.created_at || q.createdAt,
          status: 'queued' as const,
          card_id: q.card_id && typeof q.card_id === 'object' ? { generated_image_url: q.card_id.generated_image_url } : undefined,
        }))
        const merged = [...queuedItems, ...loadedPosts]
        setPosts(merged)
        setMetrics({
          total: merged.length,
          published: loadedPosts.filter((p) => p.status === 'published').length,
          queued: queuedItems.length,
          cancelled: loadedPosts.filter((p) => p.status === 'cancelled').length,
          failed: loadedPosts.filter((p) => p.status === 'failed').length,
        })
      } catch {
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    loadPosts()
  }, [])

  const filteredPosts = posts.filter((post) => {
    if (statusFilter !== 'all' && post.status !== statusFilter) return false
    if (platformFilter !== 'all' && !post.platforms.includes(platformFilter)) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-semibold text-white">Postagens</h2>
        <p className="text-sm text-gray-400 mt-1">
          Historico e status das suas publicacoes
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total" value={metrics.total} icon={Send} color="blue" />
        <MetricCard title="Publicados" value={metrics.published} icon={CheckCircle} color="green" />
        <MetricCard title="Na fila" value={metrics.queued} icon={Clock} color="blue" />
        <MetricCard title="Cancelados" value={metrics.cancelled} icon={Calendar} color="yellow" />
        <MetricCard title="Falhas" value={metrics.failed} icon={AlertCircle} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="queued">Na fila</SelectItem>
            <SelectItem value="failed">Falhas</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas plataformas</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts list - Desktop table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Post
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Plataforma
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Data
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <tr key={post._id} className="hover:bg-brand-surface/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {post.card_id?.generated_image_url ? (
                              <img src={post.card_id.generated_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-1 max-w-[300px]">
                            {truncate(post.caption, 60)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {post.platforms.map((p) => (
                            <span key={p}>
                              {p === 'instagram' && <Instagram className="w-4 h-4 text-pink-400" />}
                              {p === 'facebook' && <Facebook className="w-4 h-4 text-blue-400" />}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-400">
                          {formatDateTime(post.status === 'queued' ? (post.scheduled_at || post.created_at) : (post.published_at || post.created_at))}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            post.status === 'published'
                              ? 'success'
                              : post.status === 'failed'
                              ? 'destructive'
                              : post.status === 'queued'
                              ? 'default'
                              : 'secondary'
                          }
                          className={post.status === 'queued' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : ''}
                        >
                          {post.status === 'published' && 'Publicado'}
                          {post.status === 'failed' && 'Falhou'}
                          {post.status === 'cancelled' && 'Cancelado'}
                          {post.status === 'queued' && 'Na fila'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="w-3 h-3" />
                            Ver
                          </Button>
                          {post.status === 'failed' && (
                            <Button variant="ghost" size="sm" className="gap-1 text-amber-400 hover:text-amber-300">
                              <RotateCcw className="w-3 h-3" />
                              Tentar novamente
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <Send className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Nenhuma postagem encontrada</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostItem key={post._id} post={post} />
          ))
        ) : (
          <div className="text-center py-12">
            <Send className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhuma postagem encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
