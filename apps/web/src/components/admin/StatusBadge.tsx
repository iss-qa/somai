'use client'

import { Badge } from '@/components/ui/badge'

type StatusType =
  | 'active'
  | 'published'
  | 'blocked'
  | 'failed'
  | 'setup_pending'
  | 'queued'
  | 'trial'
  | 'processing'
  | 'inactive'
  | 'overdue'
  | 'paid'
  | 'pending'
  | 'cancelled'

const statusConfig: Record<StatusType, { label: string; variant: 'success' | 'destructive' | 'warning' | 'info' | 'secondary' | 'default' }> = {
  active: { label: 'Ativo', variant: 'success' },
  published: { label: 'Publicado', variant: 'success' },
  paid: { label: 'Pago', variant: 'success' },
  blocked: { label: 'Bloqueado', variant: 'destructive' },
  failed: { label: 'Falhou', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  overdue: { label: 'Inadimplente', variant: 'destructive' },
  setup_pending: { label: 'Setup Pendente', variant: 'warning' },
  queued: { label: 'Na Fila', variant: 'warning' },
  pending: { label: 'Pendente', variant: 'warning' },
  trial: { label: 'Trial', variant: 'info' },
  processing: { label: 'Processando', variant: 'info' },
  inactive: { label: 'Inativo', variant: 'secondary' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status,
    variant: 'secondary' as const,
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
