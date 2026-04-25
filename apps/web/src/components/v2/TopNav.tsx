'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Plus,
  Lightbulb,
  BookOpen,
  Calendar,
  Users,
  Trophy,
  Bell,
  LogOut,
  Settings,
  Menu,
  X,
  UserCircle,
  CreditCard,
  Gift,
  LifeBuoy,
  Moon,
  Sun,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { BrandSwitcher } from './BrandSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { CreditBalance } from './CreditBalance'
import { CriarChoiceModal } from './CriarChoiceModal'

interface GamState {
  creditos: number
  nivel: string
  xp: number
}

const NAV = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/criar', label: 'Criar', icon: Plus, cta: true },
  { href: '/app/inspiracao', label: 'Inspiracao', icon: Lightbulb },
  { href: '/app/biblioteca', label: 'Biblioteca', icon: BookOpen },
  { href: '/app/calendar', label: 'Calendario', icon: Calendar },
  { href: '/app/comunidade', label: 'Comunidade', icon: Users },
  { href: '/app/jornada', label: 'Jornada', icon: Trophy, accent: true },
]

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const [gam, setGam] = useState<GamState | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showCriarModal, setShowCriarModal] = useState(false)

  useEffect(() => {
    if (!user?.companyId) return
    api
      .get<GamState>('/api/gamificacao/state')
      .then(setGam)
      .catch(() => {})
  }, [user?.companyId, pathname])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  const handleLogout = async () => {
    clearUser()
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/logout`,
        { method: 'POST', credentials: 'include' },
      )
    } catch {}
    document.cookie = 'soma-token=; path=/; max-age=0'
    window.location.href = '/login'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 md:gap-4 md:px-4">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo + seletor de marca */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400">
              <span className="text-[13px] font-bold text-white">S</span>
            </div>
            <span className="hidden text-base font-semibold text-gray-900 dark:text-white sm:inline">
              soma<span className="text-purple-600 dark:text-purple-400">.ai</span>
            </span>
          </Link>
          <div className="hidden md:block">
            <BrandSwitcher />
          </div>
        </div>

        {/* Nav central desktop */}
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            if (item.cta) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setShowCriarModal(true)}
                  className="mx-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:from-purple-700 hover:to-pink-700"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  active
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
                  item.accent &&
                    !active &&
                    'text-amber-700 hover:text-amber-800 dark:text-amber-400',
                  active && 'border-b-2 border-purple-600',
                )}
              >
                {item.accent ? <Icon className="h-4 w-4 text-amber-500" /> : null}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: créditos, notif, avatar */}
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <div className="hidden md:block">
            <CreditBalance variant="compact" />
          </div>

          <button
            type="button"
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Notificacoes"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Avatar className="h-8 w-8">
                  {user?.logo_url ? (
                    <AvatarImage src={user.logo_url} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-xs text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-60 !border-gray-200 !bg-white !text-gray-900 dark:!border-gray-800 dark:!bg-gray-900 dark:!text-gray-100"
            >
              <div className="border-b border-gray-100 px-3 py-3 dark:border-gray-800">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
              <MenuRow
                icon={<UserCircle className="h-4 w-4 text-gray-500" />}
                label="Meu Perfil"
                onClick={() => router.push('/app/perfil')}
              />
              <MenuRow
                icon={<CreditCard className="h-4 w-4 text-gray-500" />}
                label="Minha Assinatura"
                onClick={() => router.push('/app/assinatura')}
              />
              <MenuRow
                icon={<Gift className="h-4 w-4 text-gray-500" />}
                label="Indique e Ganhe"
                onClick={() => router.push('/app/indique')}
              />
              <MenuRow
                icon={<LifeBuoy className="h-4 w-4 text-gray-500" />}
                label="Suporte"
                onClick={() => router.push('/app/suporte')}
              />
              <DropdownMenuSeparator className="!bg-gray-100 dark:!bg-gray-800" />
              <MenuRow
                icon={<Settings className="h-4 w-4 text-gray-500" />}
                label="Configurações"
                onClick={() => router.push('/app/settings/integrations')}
              />
              <ThemeMenuItem />
              <DropdownMenuSeparator className="!bg-gray-100 dark:!bg-gray-800" />
              <MenuRow
                icon={<LogOut className="h-4 w-4 text-red-600" />}
                label="Sair"
                onClick={handleLogout}
                danger
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl dark:bg-gray-950">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400">
                  <span className="text-[13px] font-bold text-white">S</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  soma
                  <span className="text-purple-600 dark:text-purple-400">.ai</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-gray-100 p-3 dark:border-gray-800">
              <BrandSwitcher />
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.href)
                const Icon = item.icon
                const commonClass = cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800',
                  item.accent && 'text-amber-700 dark:text-amber-400',
                )
                if (item.cta) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setMobileOpen(false)
                        setShowCriarModal(true)
                      }}
                      className={commonClass}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={commonClass}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-gray-100 p-3 text-xs text-gray-500 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span>🪙 {gam?.creditos ?? '—'} créditos</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      <CriarChoiceModal
        open={showCriarModal}
        onClose={() => setShowCriarModal(false)}
      />
    </header>
  )
}

function MenuRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        danger
          ? 'text-red-600 hover:text-red-700 dark:text-red-400'
          : 'text-gray-800 dark:text-gray-100',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function ThemeMenuItem() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('soma-theme')
      setDark(saved === 'dark')
    } catch {}
  }, [])

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = !dark
    setDark(next)
    const root = document.documentElement
    if (next) root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem('soma-theme', next ? 'dark' : 'light')
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-800 outline-none transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
    >
      {dark ? (
        <Sun className="h-4 w-4 text-gray-500" />
      ) : (
        <Moon className="h-4 w-4 text-gray-500" />
      )}
      <span className="flex-1">{dark ? 'Modo claro' : 'Modo escuro'}</span>
      <span
        className={cn(
          'relative inline-flex h-4 w-7 items-center rounded-full transition',
          dark ? 'bg-purple-600' : 'bg-gray-300',
        )}
      >
        <span
          className={cn(
            'absolute h-3 w-3 rounded-full bg-white shadow transition-transform',
            dark ? 'translate-x-3.5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}
