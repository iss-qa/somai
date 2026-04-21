'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccessGate } from '@/components/company/AccessGate'
import { NotificationBell } from '@/components/NotificationBell'
import {
  LayoutDashboard,
  Sparkles,
  Image,
  Calendar,
  Send,
  Video,
  FileText,
  Target,
  MessageCircle,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  ChevronLeft,
  FolderOpen,
} from 'lucide-react'

// Itens liberados mesmo com trial encerrado (alem de admin)
const TRIAL_FREE_HREFS = new Set(['/app/dashboard', '/app/settings/integrations'])

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/cards/generate', label: 'Gerar Card', icon: Sparkles },
  { href: '/app/cards/library', label: 'Biblioteca de Cards', icon: Image },
  { href: '/app/cards/media', label: 'Midias', icon: FolderOpen },
  { href: '/app/calendar', label: 'Calendario', icon: Calendar },
  { href: '/app/posts', label: 'Postagens', icon: Send },
  { href: '/app/videos/generate', label: 'Gerar Video', icon: Video, pro: true },
  { href: '/app/scripts', label: 'Roteiros', icon: FileText, pro: true },
  { href: '/app/campaigns', label: 'Campanhas', icon: Target, pro: true },
  { href: '/app/whatsapp', label: 'WhatsApp', icon: MessageCircle, pro: true },
  { href: '/app/settings/integrations', label: 'Integracoes', icon: Settings },
]

const mobileNavItems = [
  { href: '/app/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/app/cards/generate', label: 'Gerar', icon: Sparkles },
  { href: '/app/cards/library', label: 'Biblioteca de Cards', icon: Image },
  { href: '/app/calendar', label: 'Calendario', icon: Calendar },
  { href: '/app/posts', label: 'Posts', icon: Send },
]

function getPageTitle(pathname: string): string {
  const item = navItems.find((i) => pathname.startsWith(i.href))
  return item?.label || 'Soma.ai'
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const isTrialExpired = useAuthStore((s) => s.isTrialExpired)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const trialExpired = isTrialExpired() && !isAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    clearUser()
    // Call API to clear httpOnly cookie, then hard redirect
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {}
    // Also try clearing from client side (non-httpOnly fallback)
    document.cookie = 'soma-token=; path=/; max-age=0'
    window.location.href = '/login'
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-brand-card border-r border-brand-border flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-brand-border">
          <Link href="/app/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Soma.ai
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            const isProLocked = item.pro && user?.plan !== 'pro' && user?.plan !== 'enterprise' && user?.role !== 'superadmin' && user?.role !== 'support'
            const isTrialLocked = trialExpired && !TRIAL_FREE_HREFS.has(item.href)

            if (isProLocked || isTrialLocked) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 cursor-not-allowed opacity-60"
                  title={isTrialLocked ? 'Periodo de teste encerrado - ative seu plano' : 'Disponivel no plano Pro'}
                >
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isTrialLocked ? (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-300">
                      Bloqueado
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 opacity-70">
                      Pro
                    </Badge>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-500/15 text-primary-300'
                    : 'text-gray-400 hover:bg-brand-surface hover:text-gray-200'
                )}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.pro && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    Pro
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 border-b border-brand-border bg-brand-dark/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white p-1"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-white">
                {getPageTitle(pathname)}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationBell />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-brand-surface transition-colors">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-300 hidden sm:inline">
                      {user?.name || user?.email || 'Meu perfil'}
                    </span>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
                      {user?.plan === 'pro' ? 'Pro' : 'Starter'}
                    </Badge>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 border-b border-brand-border mb-1">
                    <p className="text-sm font-medium text-gray-200">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/app/settings/integrations')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuracoes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          <AccessGate>
            {children}
          </AccessGate>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-brand-card/95 backdrop-blur-xl border-t border-brand-border">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            const isTrialLocked = trialExpired && !TRIAL_FREE_HREFS.has(item.href)

            if (isTrialLocked) {
              return (
                <div
                  key={item.href}
                  title="Periodo de teste encerrado"
                  className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg min-w-0 text-gray-700 opacity-60"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium truncate">{item.label}</span>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0',
                  isActive
                    ? 'text-primary-400'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
