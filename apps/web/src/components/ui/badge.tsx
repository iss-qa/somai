import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-500/15 text-primary-600 border border-primary-500/20 dark:text-primary-400',
        secondary: 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
        success: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400',
        warning: 'bg-amber-500/15 text-amber-600 border border-amber-500/20 dark:text-amber-400',
        destructive: 'bg-red-500/15 text-red-600 border border-red-500/20 dark:text-red-400',
        outline: 'border border-gray-200 text-gray-600 dark:border-brand-border dark:text-gray-400',
        info: 'bg-blue-500/15 text-blue-600 border border-blue-500/20 dark:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
