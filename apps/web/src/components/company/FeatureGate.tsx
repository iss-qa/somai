'use client'

import { useState, useEffect } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

interface FeatureGateProps {
  children: React.ReactNode
  feature: string
}

export function FeatureGate({ children, feature }: FeatureGateProps) {
  const isPro = useAuthStore((s) => s.isPro)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Before hydration, always render children to avoid mismatch
  if (!mounted || isPro()) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center p-8 rounded-2xl bg-brand-card/90 backdrop-blur-sm border border-brand-border max-w-sm mx-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/15 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Recurso Pro
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {feature} esta disponivel no plano Pro. Faca upgrade para desbloquear todos os recursos.
          </p>
          <Button className="gap-2">
            <Sparkles className="w-4 h-4" />
            Upgrade para Pro
          </Button>
        </div>
      </div>
    </div>
  )
}
