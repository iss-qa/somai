'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react'

type AlertLevel = 'critical' | 'warning' | 'info' | 'success'

interface AlertItemProps {
  title: string
  description: string
  level: AlertLevel
  timestamp?: string
  action?: {
    label: string
    onClick: () => void
  }
}

const levelConfig = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    iconColor: 'text-red-400',
    dot: 'bg-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
}

export function AlertItem({
  title,
  description,
  level,
  timestamp,
  action,
}: AlertItemProps) {
  const config = levelConfig[level]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
        config.bg,
        config.border
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={cn('w-4 h-4', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-200">{title}</p>
          <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', config.dot)} />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        {timestamp && (
          <p className="text-xs text-gray-600 mt-1">{timestamp}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex-shrink-0 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
