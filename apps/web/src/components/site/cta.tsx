'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { SITE } from '@/lib/utils'

// CTA component

export function Cta() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[28px] md:rounded-[40px] border border-white/10 bg-gradient-to-br from-primary-800/40 via-[#1a0e2e] to-[#07070c] px-6 py-14 md:px-16 md:py-20 text-center shadow-glow-lg"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-primary-500/30 blur-[120px]" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-3 py-1 text-xs text-primary-200">
              <Sparkles className="h-3.5 w-3.5" />
              Ativação em menos de 24h
            </div>
            <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Pare de postar sozinho.
              <br />
              <span className="text-gradient">Deixe a IA fazer por você.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm md:text-base text-zinc-300">
              Seu marketing rodando em piloto automático, com a cara da sua marca.
              Cancelamento em 1 clique. Garantia de 7 dias.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.a
                href={`${SITE.appUrl}?signup=1`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="group/c1 relative inline-flex w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#1a0e2e] transition-all hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-primary-500/20 opacity-0 transition-all duration-500 group-hover/c1:left-[110%] group-hover/c1:opacity-100"
                />
                <span className="relative z-10">Começar agora</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover/c1:translate-x-1" />
              </motion.a>
              <motion.a
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-white backdrop-blur hover:bg-white/10 transition"
              >
                Falar no WhatsApp
              </motion.a>
            </div>

            <div className="mt-5 text-xs text-zinc-400">
              Sem cartão para o teste · Suporte em português · Empresas em todo o Brasil
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
