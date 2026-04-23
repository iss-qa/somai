'use client'

import { motion } from 'framer-motion'
import { UserPlus, Sparkles, Rocket } from 'lucide-react'
import { SectionHeader } from './features'

const STEPS = [
  {
    icon: UserPlus,
    title: 'Conte sobre o seu negócio',
    desc: 'Em 5 minutos você configura seu nicho, tom de voz, público e objetivo. Conecta Instagram, Facebook e WhatsApp em 1 clique.',
    bullet: '5 minutos',
  },
  {
    icon: Sparkles,
    title: 'A IA aprende e começa a criar',
    desc: 'Nossa IA estuda sua marca, suas melhores postagens e gera o primeiro plano editorial do mês com posts, vídeos e campanhas.',
    bullet: 'IA treinada no seu nicho',
  },
  {
    icon: Rocket,
    title: 'Aprova, publica, vende mais',
    desc: 'Você recebe tudo pronto para aprovar. A Soma publica no horário ideal, responde no WhatsApp e otimiza os anúncios pra você.',
    bullet: 'Piloto automático',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-20 md:py-32">
      <div className="container">
        <SectionHeader
          eyebrow="Como funciona"
          title={
            <>
              Do briefing ao primeiro post em{' '}
              <span className="text-gradient-static">menos de 24h</span>
            </>
          }
          subtitle="Sem curva de aprendizado, sem travas técnicas. Você conecta suas redes uma única vez — depois é só aprovar o que a IA cria."
        />

        <div className="relative mt-16">
          {/* connector line */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-10 hidden h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-gradient-to-b from-primary-500/0 via-primary-500/40 to-primary-500/0 md:block"
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative"
              >
                <div className="glass relative h-full overflow-hidden rounded-3xl p-6 md:p-7">
                  <div className="flex items-center justify-between">
                    <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/20">
                      <s.icon className="h-5 w-5 text-primary-200" />
                    </div>
                    <div className="font-display text-5xl font-bold text-white/5">
                      0{i + 1}
                    </div>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.desc}</p>
                  <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {s.bullet}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
