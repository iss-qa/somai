'use client'

import { cn, formatDateTime, truncate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Instagram, Facebook, Clock, Image as ImageIcon } from 'lucide-react'

interface PostItemProps {
  post: {
    _id: string
    title?: string
    caption: string
    card_id?: { generated_image_url?: string }
    platforms: string[]
    published_at: string | null
    created_at: string
    status: 'published' | 'failed' | 'cancelled'
  }
  compact?: boolean
}

const statusMap = {
  published: { label: 'Publicado', variant: 'success' as const },
  failed: { label: 'Falhou', variant: 'destructive' as const },
  cancelled: { label: 'Cancelado', variant: 'secondary' as const },
}

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
}

export function PostItem({ post, compact = false }: PostItemProps) {
  const status = statusMap[post.status] || statusMap.cancelled

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-brand-border bg-brand-surface p-3 transition-colors hover:border-gray-700',
        compact && 'p-2'
      )}
    >
      {/* Thumbnail */}
      <div className={cn(
        'flex-shrink-0 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden',
        compact ? 'w-10 h-10' : 'w-14 h-14'
      )}>
        {post.card_id?.generated_image_url ? (
          <img src={post.card_id.generated_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-5 h-5 text-gray-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {post.title && (
          <p className="text-sm font-medium text-gray-100 truncate">
            {post.title}
          </p>
        )}
        {post.caption && (
          <p className={cn('text-xs text-gray-400', compact ? 'line-clamp-1' : 'line-clamp-1', post.title && 'mt-0.5')}>
            {truncate(post.caption, compact ? 40 : 60)}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            {post.platforms.map((p) => {
              const Icon = platformIcons[p]
              return Icon ? (
                <Icon key={p} className="w-3 h-3 text-gray-500" />
              ) : null
            })}
          </div>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(post.published_at || post.created_at)}
          </span>
        </div>
      </div>

      {/* Status */}
      <Badge variant={status.variant} className="flex-shrink-0">
        {status.label}
      </Badge>
    </div>
  )
}
