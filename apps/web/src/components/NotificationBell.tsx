'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  CreditCard,
  Image,
  Calendar,
  Lock,
  Clock,
  Video,
  Target,
  MessageSquare,
} from 'lucide-react'

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  read: boolean
  action_url: string
  created_at: string
  expires_at: string | null
}

const typeIcons: Record<string, React.ElementType> = {
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

const typeColors: Record<string, string> = {
  token_expired: 'text-amber-400 bg-amber-500/15',
  post_failed: 'text-red-400 bg-red-500/15',
  payment_due: 'text-amber-400 bg-amber-500/15',
  payment_overdue: 'text-red-400 bg-red-500/15',
  access_blocked: 'text-red-400 bg-red-500/15',
  setup_pending: 'text-blue-400 bg-blue-500/15',
  video_ready: 'text-emerald-400 bg-emerald-500/15',
  video_failed: 'text-red-400 bg-red-500/15',
  campaign_published: 'text-purple-400 bg-purple-500/15',
  campaign_completed: 'text-emerald-400 bg-emerald-500/15',
  card_publicado: 'text-green-400 bg-green-500/15',
  card_agendado: 'text-blue-400 bg-blue-500/15',
  comunicacao: 'text-primary-400 bg-primary-500/15',
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d`
  return `${Math.floor(diffD / 7)}sem`
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchUnread = useCallback(async () => {
    try {
      const data = await api.get<{ notifications: Notification[]; count: number }>(
        '/api/notifications/unread',
      )
      setNotifications(data.notifications)
      setUnreadCount(data.count)
    } catch {
      // silently fail
    }
  }, [])

  // Poll every 30s
  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleMarkAllRead() {
    try {
      await api.post('/api/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  async function handleDismiss(id: string) {
    try {
      await api.post(`/api/notifications/${id}/dismiss`)
      setNotifications((prev) => prev.filter((n) => n._id !== id))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {}
  }

  async function handleClick(n: Notification) {
    // Mark as read
    if (!n.read) {
      try {
        await api.post(`/api/notifications/${n._id}/read`)
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)),
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {}
    }
    // Navigate if action_url
    if (n.action_url) {
      setOpen(false)
      router.push(n.action_url)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-brand-dark border border-brand-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <h3 className="text-sm font-semibold text-white">Notificacoes</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-brand-surface transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas lidas
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma notificacao</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type] || Info
                const color = typeColors[n.type] || 'text-gray-400 bg-gray-500/15'
                const [textColor, bgColor] = color.split(' ')

                return (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-brand-border/50 transition-colors cursor-pointer hover:bg-brand-surface/50 ${
                      !n.read ? 'bg-primary-500/5' : ''
                    }`}
                    onClick={() => handleClick(n)}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <Icon className={`w-4 h-4 ${textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-tight ${
                            n.read ? 'text-gray-400' : 'text-gray-200 font-medium'
                          }`}
                        >
                          {n.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDismiss(n._id)
                          }}
                          className="text-gray-600 hover:text-gray-400 p-0.5 flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {n.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-600">
                          {timeAgo(n.created_at)}
                        </span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                        )}
                        {n.expires_at && (
                          <span className="text-[10px] text-amber-600">
                            expira {timeAgo(n.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
