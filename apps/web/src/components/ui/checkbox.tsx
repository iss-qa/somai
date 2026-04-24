'use client'

import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

function Checkbox({ checked, onCheckedChange, className, disabled }: CheckboxProps) {
  return (
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) onCheckedChange?.(!checked)
        }}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
            e.preventDefault()
            onCheckedChange?.(!checked)
          }
        }}
        className={cn(
          'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50',
          checked
            ? 'bg-violet-600 border-violet-600'
            : 'bg-transparent border-white/30 hover:border-white/50',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
  )
}

export { Checkbox }
