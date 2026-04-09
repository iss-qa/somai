'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
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
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  Activity,
  FileSearch,
  CreditCard,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Sparkles,
  Plug,
  ScrollText,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Parceiros', icon: Building2 },
  { href: '/admin/financial', label: 'Financeiro', icon: DollarSign },
  { href: '/admin/health', label: 'Saude do Sistema', icon: Activity },
  { href: '/admin/integrations', label: 'Integracoes', icon: Plug },
  { href: '/admin/logs', label: 'Logs', icon: ScrollText },
  { href: '/admin/settings', label: 'Configuracoes', icon: Settings },
]

function getPageTitle(pathname: string): string {
  const item = navItems.find((i) => pathname.startsWith(i.href))
  return item?.label || 'Admin'
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    clearUser()
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {}
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
    : 'A'

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
          'fixed top-0 left-0 z-50 h-full w-64 bg-[#0d0d16] border-r border-brand-border flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-brand-border">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Soma.ai
            </span>
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Admin
            </Badge>
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
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-brand-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs bg-red-500/20 text-red-300">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
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
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">
                  {getPageTitle(pathname)}
                </h1>
                <Badge variant="destructive" className="text-[10px]">Admin</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-brand-surface transition-colors">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs bg-red-500/20 text-red-300">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-300 hidden sm:inline">
                      {user?.name || 'Admin'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push('/app/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Painel Empresa
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
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
