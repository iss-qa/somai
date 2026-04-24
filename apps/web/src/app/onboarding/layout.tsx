'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode
}) {
  const [completo, setCompleto] = useState<boolean | null>(null)

  useEffect(() => {
    api
      .get<{ onboardingCompleto: boolean }>('/api/onboarding/state')
      .then((s) => setCompleto(!!s.onboardingCompleto))
      .catch(() => setCompleto(null))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {completo ? (
          <Link
            href="/app/dashboard"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao painel
          </Link>
        ) : (
          <span />
        )}
      </div>
      {children}
    </div>
  )
}
