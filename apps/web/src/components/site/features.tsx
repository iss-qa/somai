'use client'

import { motion } from 'framer-motion'
import {
  Sparkles,
  Instagram,
  Video,
  MessageCircle,
  Megaphone,
  Calendar,
  Images,
  Target,
  ShieldCheck,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Criação de posts com IA',
    desc: 'A IA entende seu nicho, aprende seu estilo e gera cards prontos — com copy, hashtags e chamadas para ação. Você só revisa e aprova.',
    color: 'from-primary-400 to-accent-fuchsia',
  },
  {
    icon: Video,
    title: 'Vídeos gerados automaticamente',
    desc: 'Até 5 vídeos curtos por dia com voz, legendas sincronizadas e cortes dinâmicos. Formatos 9:16, 1:1 e 16:9 prontos para publicar.',
    color: 'from-accent-fuchsia to-accent-cyan',
  },
  {
    icon: Calendar,
    title: 'Agendamento inteligente',
    desc: 'Publicamos no melhor horário do seu público no Instagram e Facebook. Calendário com datas comemorativas do seu segmento.',
    color: 'from-accent-cyan to-primary-500',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp que vende sozinho',
    desc: 'Respostas automáticas, agendamentos e funis de venda. Todo lead vindo do Instagram entra direto no seu WhatsApp qualificado.',
    color: 'from-emerald-400 to-accent-cyan',
  },
  {
    icon: Megaphone,
    title: 'Campanhas Meta Ads prontas',
    desc: 'Criação, segmentação e otimização automáticas de anúncios no Facebook e Instagram — com orçamento sugerido pela IA.',
    color: 'from-primary-500 to-accent-fuchsia',
  },
  {
    icon: Images,
    title: 'Biblioteca de mídias',
    desc: 'Seu acervo de fotos, vídeos e artes organizados por categoria. A IA usa esse banco para manter a identidade visual consistente.',
    color: 'from-primary-400 to-primary-700',
  },
  {
    icon: Target,
    title: 'Roteiros e scripts sob medida',
    desc: 'Roteiros de reels, gancho, carrossel e storytelling que convertem. Pensados especificamente para o que o seu público responde.',
    color: 'from-yellow-300 to-primary-500',
  },
  {
    icon: Instagram,
    title: 'Integrações oficiais',
    desc: 'Instagram Graph API, Facebook Pages, WhatsApp Cloud e Meta Ads. Tudo conectado em poucos cliques, sem técnico na sua empresa.',
    color: 'from-accent-cyan to-primary-400',
  },
  {
    icon: ShieldCheck,
    title: 'LGPD e segurança por padrão',
    desc: 'Seus dados criptografados, tokens rotativos e conformidade com LGPD. Tranquilidade para focar no que importa: vender mais.',
    color: 'from-emerald-400 to-primary-500',
  },
]

export function Features() {
  return (
    <section id="recursos" className="relative py-20 md:py-32">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(139,92,246,0.12),transparent_70%)]" />
      <div className="container">
        <SectionHeader
          eyebrow="Recursos"
          title={
            <>
              Tudo o que uma agência entrega,
              <br className="hidden md:block" />
              <span className="text-gradient-static"> sem o preço de uma agência.</span>
            </>
          }
          subtitle="Substituímos o pacote de social media, o videomaker, o copywriter e o gestor de tráfego por uma IA que trabalha 24/7 no tom da sua marca."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div
                className={`mb-5 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${f.color} shadow-glow`}
              >
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.desc}</p>
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-primary-600/0 blur-3xl transition-all group-hover:bg-primary-600/20"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  center?: boolean
}) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-200">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
          {eyebrow}
        </div>
      )}
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
          {subtitle}
        </p>
      )}
    </div>
  )
}
