'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { SectionHeader } from './features'
import { cn, SITE } from '@/lib/utils'

type Plan = {
  id: 'starter' | 'pro' | 'enterprise'
  name: string
  headline: string
  setup: number
  monthly: number
  features: string[]
  missing?: string[]
  highlight?: boolean
  cta: string
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    headline: 'Para começar a crescer no Instagram com IA.',
    setup: 50,
    monthly: 29.9,
    features: [
      'Posts ilimitados gerados pela IA',
      'Agendamento automático no Instagram',
      'Biblioteca de mídias',
      'Calendário de datas comemorativas',
      'Suporte por e-mail',
    ],
    missing: ['Vídeos com IA', 'WhatsApp', 'Campanhas Meta Ads'],
    cta: 'Assinar Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    headline: 'O combo que pequenas empresas mais adoram.',
    setup: 100,
    monthly: 50,
    features: [
      'Tudo do Starter',
      'Publicação também no Facebook',
      '2 vídeos com IA por dia',
      'WhatsApp com respostas automáticas',
      'Campanhas Meta Ads prontas',
      'Suporte prioritário em português',
    ],
    highlight: true,
    cta: 'Assinar Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    headline: 'Para escalar com tráfego pago e muita presença.',
    setup: 200,
    monthly: 69.9,
    features: [
      'Tudo do Pro',
      '5 vídeos com IA por dia',
      'Gestão de tráfego pago avançada',
      'Reconhecimento de marca / brand lift',
      'Gerente de conta dedicado',
      'Relatórios mensais executivos',
    ],
    cta: 'Assinar Enterprise',
  },
]

export function Plans() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="planos" className="relative py-20 md:py-32">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(139,92,246,0.16),transparent_70%)]" />
      <div className="container">
        <SectionHeader
          eyebrow="Planos"
          title={
            <>
              Preços diretos.{' '}
              <span className="text-gradient-static">Sem letras miúdas.</span>
            </>
          }
          subtitle="Comece pequeno e suba de plano quando quiser. Cancelamento a qualquer momento, sem multa."
        />

        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          <span className={cn(annual ? 'text-zinc-400' : 'text-white')}>Mensal</span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((v) => !v)}
            className="relative h-6 w-11 rounded-full border border-white/10 bg-white/5 transition-colors data-[on=true]:bg-primary-500/40"
            data-on={annual}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-glow transition-transform',
                annual ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </button>
          <span className={cn(annual ? 'text-white' : 'text-zinc-400')}>
            Anual{' '}
            <span className="ml-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              -20%
            </span>
          </span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {PLANS.map((p, i) => {
            const monthly = annual ? +(p.monthly * 0.8).toFixed(2) : p.monthly
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={cn(
                  'relative rounded-3xl p-6 md:p-7',
                  p.highlight
                    ? 'conic-border bg-gradient-to-b from-primary-950/60 to-[#0c0c18] shadow-glow-lg md:scale-[1.02]'
                    : 'glass',
                )}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-fuchsia px-3 py-1 text-[11px] font-semibold text-white shadow-glow">
                    <Sparkles className="h-3 w-3" /> Mais escolhido
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-xl text-white">{p.name}</div>
                    <div className="mt-1 text-xs text-zinc-400">{p.headline}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-end gap-1">
                    <span className="text-zinc-400 text-sm">R$</span>
                    <span className="font-display text-5xl font-bold text-white leading-none">
                      {monthly.toFixed(2).replace('.', ',').replace(',00', '')}
                    </span>
                    <span className="ml-1 text-sm text-zinc-400">/mês</span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Setup único de{' '}
                    <span className="text-zinc-300">
                      R$ {p.setup.toFixed(2).replace('.', ',').replace(',00', '')}
                    </span>{' '}
                    · Instagram, Facebook e WhatsApp inclusos conforme plano
                  </div>
                </div>

                <motion.a
                  href={`${SITE.appUrl}?signup=1&plan=${p.id}${annual ? '&cycle=annual' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  aria-label={`${p.cta} — ir para cadastro`}
                  className={cn(
                    'group/btn relative mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-3 text-sm font-semibold transition-all',
                    p.highlight
                      ? 'bg-gradient-to-br from-primary-400 via-primary-600 to-accent-fuchsia text-white shadow-glow-lg hover:shadow-[0_0_80px_-10px_rgba(232,121,249,0.7)]'
                      : 'border border-white/10 bg-white/5 text-white hover:border-primary-500/30 hover:bg-primary-500/10',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/25 opacity-0 transition-all duration-500',
                      'group-hover/btn:left-[110%] group-hover/btn:opacity-100',
                    )}
                  />
                  <span className="relative z-10">{p.cta}</span>
                  <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </motion.a>

                <ul className="mt-7 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-zinc-200">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-500/15 border border-primary-500/30">
                        <Check className="h-3 w-3 text-primary-300" />
                      </span>
                      {f}
                    </li>
                  ))}
                  {p.missing?.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm text-zinc-500 line-through"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-600">
                        ×
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-10 text-center text-xs text-zinc-500">
          Todos os planos têm 7 dias de garantia incondicional. Cancelamento em 1 clique.
        </div>
      </div>
    </section>
  )
}
