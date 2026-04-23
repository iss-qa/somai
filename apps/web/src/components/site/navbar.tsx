'use client'

import { useEffect, useState } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Logo } from './logo'
import { cn, SITE } from '@/lib/utils'

const links = [
  { href: '#recursos', label: 'Recursos' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#planos', label: 'Planos' },
  { href: '#faq', label: 'Perguntas' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'py-2' : 'py-3 md:py-4',
      )}
    >
      <div className="container">
        <nav
          className={cn(
            'flex items-center justify-between gap-4 rounded-full border px-3 py-2 transition-all md:pl-5 md:pr-2',
            scrolled
              ? 'glass-strong border-white/10 shadow-card'
              : 'glass border-white/5',
          )}
          aria-label="Navegação principal"
        >
          <a href="#top" className="flex items-center" aria-label="Soma.AI — ir para o topo">
            <Logo />
          </a>

          <ul className="hidden lg:flex items-center gap-1 text-[15px] font-medium text-zinc-300">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-4 py-2.5 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={SITE.appUrl}
              className="hidden md:inline-flex text-[15px] font-medium text-zinc-300 hover:text-white rounded-full px-4 py-2.5 transition"
            >
              Entrar
            </a>
            <a
              href={`${SITE.appUrl}?signup=1`}
              className="group/nav hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-2.5 text-[15px] font-semibold text-white shadow-glow hover:brightness-110 hover:shadow-glow-lg transition-all active:scale-95"
            >
              Começar agora
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/nav:translate-x-0.5" />
            </a>
            <button
              type="button"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
            >
              {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-x-0 top-[76px] bottom-0 z-40 transition-opacity duration-300',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={() => setOpen(false)} />
        <div
          className={cn(
            'relative mx-4 mt-2 rounded-3xl glass-strong p-5 shadow-card transition-transform duration-300',
            open ? 'translate-y-0' : '-translate-y-4',
          )}
        >
          <ul className="flex flex-col divide-y divide-white/5">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  onClick={() => setOpen(false)}
                  href={l.href}
                  className="flex items-center justify-between py-3.5 text-base text-zinc-200 hover:text-white"
                >
                  <span>{l.label}</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={SITE.appUrl}
              className="w-full rounded-full border border-white/10 bg-white/5 py-3 text-center text-sm text-white hover:bg-white/10"
            >
              Entrar na minha conta
            </a>
            <a
              href={`${SITE.appUrl}?signup=1`}
              onClick={() => setOpen(false)}
              className="w-full rounded-full bg-gradient-to-br from-primary-500 to-primary-700 py-3 text-center text-sm font-medium text-white shadow-glow active:scale-95 transition-transform"
            >
              Quero começar
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
