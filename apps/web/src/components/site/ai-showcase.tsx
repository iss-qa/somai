'use client'

import { motion } from 'framer-motion'
import { Sparkles, Wand2, Heart, MessageCircle, Bookmark } from 'lucide-react'
import { SectionHeader } from './features'

export function AIShowcase() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-10 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-primary-700/15 blur-[120px]" />
      </div>

      <div className="container">
        <SectionHeader
          eyebrow="IA em ação"
          title={
            <>
              Do briefing ao <span className="text-gradient-static">post perfeito</span> em segundos
            </>
          }
          subtitle="Veja como a Soma transforma uma ideia simples em um post pronto, alinhado ao tom da sua marca e ao seu público."
        />

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
          {/* Prompt / config card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="glass relative rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Wand2 className="h-4 w-4 text-primary-300" />
              Briefing automático
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Nicho" value="Pizzaria artesanal · São Paulo" />
              <Field label="Objetivo do post" value="Promover sabor novo da semana e gerar pedidos no WhatsApp" />
              <Field label="Tom de voz" value="Descontraído, caloroso, com pitada de humor" />
              <Field label="Público-alvo" value="Famílias 25–45, bairros Pinheiros e Vila Madalena" />
              <div className="flex flex-wrap gap-2">
                {['#pizza', '#saopaulo', '#delivery', '#pizzaartesanal'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-primary-500/20 bg-primary-500/10 px-2.5 py-1 text-[11px] text-primary-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-3 text-sm font-medium text-white shadow-glow"
            >
              <Sparkles className="h-4 w-4" />
              Gerando post com IA…
            </button>
          </motion.div>

          {/* Instagram mock */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mx-auto w-full max-w-[380px]"
          >
            <div className="conic-border rounded-3xl">
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0b0b14] shadow-card">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 via-accent-fuchsia to-accent-cyan p-[2px]">
                        <div className="h-full w-full rounded-full bg-[#0b0b14] grid place-items-center text-[10px] font-bold text-white">
                          PB
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white">pizzaria.bella</div>
                      <div className="text-[10px] text-zinc-500">Patrocinado · São Paulo</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <span className="h-1 w-1 rounded-full bg-zinc-500" />
                    <span className="h-1 w-1 rounded-full bg-zinc-500" />
                    <span className="h-1 w-1 rounded-full bg-zinc-500" />
                  </div>
                </div>

                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-rose-500 to-primary-600" />
                  <div className="absolute inset-0 noise" />
                  <motion.div
                    initial={{ scale: 1.2, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 grid place-items-center"
                  >
                    <div className="text-center text-white drop-shadow-lg">
                      <div className="font-display text-[11px] uppercase tracking-[0.3em] opacity-80">
                        Sabor da semana
                      </div>
                      <div className="mt-2 font-display text-4xl font-black leading-none">
                        Bella
                        <br />
                        Burrata
                      </div>
                      <div className="mt-3 inline-block rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-black">
                        De R$ 79 por R$ 59
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-4 text-white">
                    <Heart className="h-5 w-5" />
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <Bookmark className="h-5 w-5 text-white" />
                </div>

                {/* Caption */}
                <div className="px-4 pb-4 text-[13px] text-zinc-200">
                  <div>
                    <span className="font-semibold">pizzaria.bella</span>{' '}
                    Domingo pede burrata 🤌 A gente traz. Combo família com Coca 2L por{' '}
                    <span className="font-semibold">R$ 59</span>. Só hoje, chama no WhatsApp e peça
                    sem sair do sofá.
                  </div>
                  <div className="mt-1.5 text-primary-300 text-[12px]">
                    #pizza #saopaulo #delivery #pizzaartesanal
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500">há alguns instantes</div>
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="absolute -top-3 -right-3 inline-flex items-center gap-1.5 rounded-full border border-primary-500/30 bg-primary-500/15 backdrop-blur px-2.5 py-1 text-[10px] font-medium text-primary-200">
              <Sparkles className="h-3 w-3" />
              Gerado em 3.2s
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-zinc-200">
        {value}
      </div>
    </div>
  )
}
