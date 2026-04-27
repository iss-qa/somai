'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { AccessGate } from '@/components/company/AccessGate'
import { TopNav } from '@/components/v2/TopNav'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  // Rehidrata user e — se a marca ativa ainda não concluiu o onboarding —
  // leva o usuário pra `/onboarding` (primeira ação após login). Admins
  // não passam pelo fluxo.
  useEffect(() => {
    let cancelled = false
    api
      .get<{ user: any }>('/api/auth/me')
      .then((data) => {
        if (cancelled || !data?.user) return
        setUser(data.user)
        const u = data.user
        const isAdmin = u.role === 'superadmin' || u.role === 'support'
        if (!isAdmin && u.companyId && u.onboardingCompleto === false) {
          router.replace('/onboarding')
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [setUser, router])

  // Dispara processamento de fila lazy (1x/min)
  useEffect(() => {
    try {
      const key = 'soma-last-publish-trigger'
      const last = Number(localStorage.getItem(key) || '0')
      const now = Date.now()
      if (now - last < 60_000) return
      localStorage.setItem(key, String(now))
      api.post('/api/post-queue/process-due').catch(() => {})
    } catch {
      /* storage indisponível */
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/40 via-white to-pink-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <TopNav />
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 md:py-6 lg:px-8">
        <AccessGate>{children}</AccessGate>
      </main>
    </div>
  )
}
