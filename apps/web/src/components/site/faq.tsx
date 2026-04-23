'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { SectionHeader } from './features'
import { cn } from '@/lib/utils'

const QUESTIONS = [
  {
    q: 'Preciso entender de marketing ou de tecnologia?',
    a: 'Não. A Soma.ai foi pensada para donos de pequenos negócios. Você conta sobre a sua empresa em 5 minutos, conecta o Instagram em 1 clique e a IA faz todo o resto. Se travar em algum passo, o time de suporte ajuda em português.',
  },
  {
    q: 'Os posts ficam parecidos com os de outros clientes?',
    a: 'Não. A IA aprende o seu tom de voz, o estilo visual da sua marca e os produtos que você mais vende. Cada conta tem um modelo único — os posts saem com a sua cara, com os seus termos e as suas cores.',
  },
  {
    q: 'E se eu não gostar de um post?',
    a: 'Você aprova tudo antes de publicar. Pode editar, pedir para a IA regerar com ajustes ou simplesmente descartar. Nada vai pro ar sem o seu OK — a menos que você prefira o modo automático, que também existe.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Cancelamento em 1 clique, sem multa, sem burocracia. Se cancelar nos primeiros 7 dias, devolvemos 100% do valor pago.',
  },
  {
    q: 'Vocês também fazem anúncios (tráfego pago)?',
    a: 'Este recurso está em desenvolvimento e será liberado em breve nos planos Pro e Enterprise. A IA irá criar, segmentar e otimizar campanhas no Instagram e Facebook automaticamente, sugerindo o orçamento ideal para o seu objetivo. Assinantes dos planos Pro e Enterprise terão acesso assim que lançarmos.',
    soon: true,
  },
  {
    q: 'Como funciona a integração com o WhatsApp?',
    a: 'A integração com o WhatsApp está em desenvolvimento e será disponibilizada em breve. Conectaremos o seu WhatsApp Business oficial via Meta, com respostas automáticas para perguntas frequentes, qualificação de leads, envio de catálogos e agendamento de horários — sempre com a possibilidade de supervisão humana.',
    soon: true,
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Sim. Dados criptografados em repouso e em trânsito, tokens rotacionados automaticamente, conformidade com LGPD. Nunca compartilhamos seus dados com terceiros — eles servem exclusivamente para treinar o modelo da sua própria marca.',
  },
  {
    q: 'Tem contrato de fidelidade?',
    a: 'Não. A Soma é mês a mês. Você paga só o que usar. No plano anual, damos 20% de desconto — mas sem fidelidade obrigatória.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-20 md:py-32">
      <div className="container">
        <SectionHeader
          eyebrow="Dúvidas frequentes"
          title="Tudo o que você precisa saber antes de começar"
          subtitle="Se a sua dúvida não está aqui, fale com a gente no WhatsApp — respondemos rapidinho."
        />

        <div
          className="mx-auto mt-14 max-w-3xl divide-y divide-white/5 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur"
          itemScope
          itemType="https://schema.org/FAQPage"
        >
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={item.q}
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 md:px-7 py-5 text-left text-white transition-colors hover:bg-white/[0.02]"
                >
                  <span
                    itemProp="name"
                    className="flex flex-wrap items-center gap-2 font-display text-base md:text-lg"
                  >
                    {item.q}
                    {item.soon && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
                        Em breve
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 transition-transform',
                      isOpen && 'rotate-45 border-primary-500/40 bg-primary-500/10 text-primary-300',
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <div
                        itemProp="text"
                        className="px-5 md:px-7 pb-6 text-sm leading-relaxed text-zinc-300"
                      >
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
