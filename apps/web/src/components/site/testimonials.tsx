'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { SectionHeader } from './features'

const ITEMS = [
  {
    quote:
      'Saí de 3 posts por mês para 5 por semana. O Instagram da pizzaria virou a principal fonte de pedidos — e eu nem mexo no app mais. A Soma cuida de tudo.',
    name: 'Rafael Bellini',
    role: 'Dono · Pizzaria Bella',
    initials: 'RB',
    color: 'from-amber-400 to-rose-500',
  },
  {
    quote:
      'O que me ganhou foi o WhatsApp. Os leads chegam qualificados, sem eu precisar ficar trocando mensagem. Em 45 dias triplicamos as consultas agendadas.',
    name: 'Dra. Camila Tavares',
    role: 'Fundadora · Clínica Mais',
    initials: 'CT',
    color: 'from-emerald-400 to-accent-cyan',
  },
  {
    quote:
      'Eu gastava R$ 2.500 com agência e entregavam 12 posts por mês. Hoje pago R$ 69 e tenho o dobro, com vídeos e campanhas no tráfego pago.',
    name: 'João Ribeiro',
    role: 'Barbearia Norte',
    initials: 'JR',
    color: 'from-primary-400 to-accent-fuchsia',
  },
  {
    quote:
      'A IA entendeu o tom da minha marca melhor do que muito copywriter humano que já contratei. Os posts têm a minha cara.',
    name: 'Aline Souza',
    role: 'Studio Atena · Decoração',
    initials: 'AS',
    color: 'from-accent-fuchsia to-primary-500',
  },
  {
    quote:
      'Rodei a Soma por 1 mês e cancelei a minha social media. A diferença de consistência nas postagens é absurda.',
    name: 'Pedro Lins',
    role: 'Pet Amigo',
    initials: 'PL',
    color: 'from-sky-400 to-primary-500',
  },
  {
    quote:
      'O relatório mensal é o que mais uso. Consigo ver o que vendeu, o que deu engajamento e já ajustar o próximo mês com a IA.',
    name: 'Mariana Okuda',
    role: 'Sushi do Kenji',
    initials: 'MO',
    color: 'from-primary-500 to-accent-cyan',
  },
]

export function Testimonials() {
  return (
    <section className="relative py-20 md:py-32">
      <div className="container">
        <SectionHeader
          eyebrow="Prova social"
          title={
            <>
              Empresários que voltaram a dormir tranquilos —{' '}
              <span className="text-gradient-static">e a vender mais.</span>
            </>
          }
          subtitle="Mais de 1.200 negócios já confiam na Soma.ai para cuidar do marketing todos os dias."
        />

        <div className="mt-14 columns-1 gap-5 md:columns-2 lg:columns-3 space-y-5">
          {ITEMS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="break-inside-avoid glass rounded-2xl p-5 md:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${t.color} text-[11px] font-bold text-white`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-[11px] text-zinc-500">{t.role}</div>
                  </div>
                </div>
                <Quote className="h-5 w-5 text-primary-300/70" />
              </div>
              <div className="mt-4 flex items-center gap-0.5">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-zinc-300">
                “{t.quote}”
              </blockquote>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
