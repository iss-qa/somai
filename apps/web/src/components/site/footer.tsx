import { Logo } from './logo'
import { SITE } from '@/lib/utils'
import { Instagram, Facebook, MessageCircle } from 'lucide-react'

const year = new Date().getFullYear()

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Produto',
    links: [
      { label: 'Recursos', href: '#recursos' },
      { label: 'Como funciona', href: '#como-funciona' },
      { label: 'Planos', href: '#planos' },
      { label: 'Perguntas', href: '#faq' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre a Soma', href: '#' },
      { label: 'Clientes', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Contato', href: SITE.whatsapp },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Termos de uso', href: '#' },
      { label: 'Política de privacidade', href: '#' },
      { label: 'LGPD', href: '#' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 pt-16 pb-10">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

      <div className="container">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
              A Soma.ai é o sistema operacional de marketing das pequenas empresas brasileiras.
              Automação, IA e resultado — em um só lugar.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { i: Instagram, l: 'Instagram' },
                { i: Facebook, l: 'Facebook' },
                { i: MessageCircle, l: 'WhatsApp' },
              ].map(({ i: Icon, l }) => (
                <a
                  key={l}
                  href="#"
                  aria-label={l}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <div className="text-xs uppercase tracking-wider text-zinc-500">{c.title}</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-zinc-300 hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-zinc-500 md:flex-row">
          <div>© {year} Soma.ai · ISSQA. Todos os direitos reservados.</div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Todos os serviços operacionais
          </div>
        </div>
      </div>
    </footer>
  )
}
