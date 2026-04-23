import { cn } from '@/lib/utils'

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-display', className)}>
      <span className="relative inline-grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary-400 via-primary-600 to-accent-cyan shadow-glow">
        <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 to-transparent mix-blend-overlay" />
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
          <path d="M7 16.5c0 1.8 1.7 3.2 4.7 3.2s4.7-1.2 4.7-3.1c0-2.2-1.8-2.9-4.5-3.5-2-.4-2.9-.7-2.9-1.4 0-.7.7-1.1 2-1.1 1.4 0 2.1.5 2.4 1.6h2.9c-.2-2.4-2.1-4-5.1-4-3.2 0-5 1.4-5 3.6 0 2 1.6 2.8 4.4 3.4 2.1.4 3 .6 3 1.4 0 .8-.9 1.2-2.2 1.2-1.5 0-2.4-.5-2.6-1.8H7z" />
        </svg>
      </span>
      {!iconOnly && (
        <span className="text-lg font-semibold tracking-tight">
          Soma<span className="text-primary-400">.ai</span>
        </span>
      )}
    </span>
  )
}
