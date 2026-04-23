'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeatureGate } from '@/components/company/FeatureGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Video,
  Plus,
  Play,
  Download,
  Loader2,
  Film,
  Clock,
  Sparkles,
  Layers,
  Mic,
  MoreHorizontal,
  Trash2,
  Calendar,
  Eye,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

interface VideoItem {
  _id: string
  title: string
  template: string
  target_duration: number
  duration_seconds: number
  thumbnail_url: string
  video_url: string
  status: string
  generation_progress: number
  generation_method: string
  palette: string
  narration_text: string
  createdAt: string
}

const statusMap: Record<string, { label: string; variant: string; color: string }> = {
  queued: { label: 'Na fila', variant: 'warning', color: 'text-yellow-400' },
  generating: { label: 'Gerando...', variant: 'info', color: 'text-blue-400' },
  ready: { label: 'Pronto', variant: 'success', color: 'text-green-400' },
  failed: { label: 'Falhou', variant: 'destructive', color: 'text-red-400' },
  posted: { label: 'Publicado', variant: 'default', color: 'text-purple-400' },
}

const templateLabels: Record<string, string> = {
  dica_rapida: 'Dica Rápida',
  passo_a_passo: 'Passo a Passo',
  beneficio_destaque: 'Beneficio',
  depoimento: 'Depoimento',
  comparativo: 'Comparativo',
  lancamento: 'Lancamento',
}

const paletteColors: Record<string, string[]> = {
  juntix_verde: ['#22c55e', '#059669'],
  escuro_premium: ['#1e293b', '#0f172a'],
  vibrante_tropical: ['#fb923c', '#06b6d4'],
  minimalista_clean: ['#f8fafc', '#e2e8f0'],
}

function VideosContent() {
  const router = useRouter()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadVideos = async () => {
    try {
      const data = await api.get<{ videos: VideoItem[] }>('/api/videos')
      setVideos(data.videos || [])
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVideos()
    // Auto-refresh for generating videos
    const interval = setInterval(() => {
      if (videos.some((v) => v.status === 'generating' || v.status === 'queued')) {
        loadVideos()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [videos.length])

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/videos/${id}`)
      setVideos((prev) => prev.filter((v) => v._id !== id))
      toast.success('Vídeo removido')
    } catch {
      toast.error('Erro ao remover video')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-primary-400" />
            Vídeos
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Crie e gerencie videos com inteligencia artificial
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={() => router.push('/app/videos/generate')}
        >
          <Plus className="w-4 h-4" />
          Novo Vídeo
        </Button>
      </div>

      {/* Stats */}
      {videos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-brand-border bg-brand-surface">
            <p className="text-2xl font-bold text-white">{videos.length}</p>
            <p className="text-xs text-gray-500">Total de videos</p>
          </div>
          <div className="p-3 rounded-xl border border-brand-border bg-brand-surface">
            <p className="text-2xl font-bold text-green-400">
              {videos.filter((v) => v.status === 'ready').length}
            </p>
            <p className="text-xs text-gray-500">Prontos</p>
          </div>
          <div className="p-3 rounded-xl border border-brand-border bg-brand-surface">
            <p className="text-2xl font-bold text-blue-400">
              {videos.filter(
                (v) => v.status === 'generating' || v.status === 'queued',
              ).length}
            </p>
            <p className="text-xs text-gray-500">Em geracao</p>
          </div>
          <div className="p-3 rounded-xl border border-brand-border bg-brand-surface">
            <p className="text-2xl font-bold text-purple-400">
              {videos.filter((v) => v.status === 'posted').length}
            </p>
            <p className="text-xs text-gray-500">Publicados</p>
          </div>
        </div>
      )}

      {/* Video Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const status = statusMap[video.status] || statusMap.queued
            const colors = paletteColors[video.palette] || paletteColors.juntix_verde
            return (
              <Card
                key={video._id}
                className="overflow-hidden group hover:border-gray-600 transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                      }}
                    >
                      <Film className="w-10 h-10 text-white/30" />
                    </div>
                  )}

                  {/* Play overlay */}
                  {video.status === 'ready' && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Duration badge */}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded-md text-xs text-white font-medium">
                    {video.target_duration || video.duration_seconds || 15}s
                  </span>

                  {/* Template badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-md text-[10px] text-white/80">
                    {templateLabels[video.template] || video.template}
                  </span>

                  {/* Generating overlay */}
                  {video.status === 'generating' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-2" />
                      <p className="text-xs text-white/80">
                        Gerando... {video.generation_progress || 0}%
                      </p>
                      <div className="w-2/3 mt-2">
                        <Progress
                          value={video.generation_progress || 0}
                          className="h-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-200 line-clamp-1 flex-1">
                      {video.title}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 -mr-1 text-gray-500 hover:text-gray-300">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {video.status === 'ready' && (
                          <DropdownMenuItem>
                            <Calendar className="mr-2 h-3.5 w-3.5" />
                            Agendar publicação
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(video._id)}
                          className="text-red-400"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant={status.variant as any}
                      className="text-[10px]"
                    >
                      {status.label}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDate(video.createdAt)}
                    </span>
                  </div>

                  {/* Feature tags */}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {video.generation_method === 'gemini_veo' && (
                      <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                        <Sparkles className="w-3 h-3" />
                        Gemini
                      </span>
                    )}
                    {video.narration_text && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Mic className="w-3 h-3" />
                        Narracao
                      </span>
                    )}
                  </div>

                  {video.status === 'ready' && (
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 text-xs"
                      >
                        <Play className="w-3 h-3" />
                        Assistir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 text-xs"
                      >
                        <Download className="w-3 h-3" />
                        Baixar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Video className="w-14 h-14 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Nenhum video criado
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Gere videos automaticos a partir dos seus cards com IA, escolha
            templates, narracao e muito mais.
          </p>
          <Button
            className="gap-2"
            onClick={() => router.push('/app/videos/generate')}
          >
            <Sparkles className="w-4 h-4" />
            Criar primeiro video
          </Button>
        </div>
      )}
    </div>
  )
}

export default function VideosPage() {
  return (
    <FeatureGate feature="Vídeos com IA">
      <VideosContent />
    </FeatureGate>
  )
}
