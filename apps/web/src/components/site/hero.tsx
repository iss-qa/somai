'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, PlayCircle, Instagram, Facebook, MessageCircle, Video, Megaphone, Calendar } from 'lucide-react'
import { SITE } from '@/lib/utils'

const METRICS = [
  { k: '+842%', v: 'engajamento médio em 60 dias' },
  { k: '5x', v: 'mais publicações por semana' },
  { k: '3h/dia', v: 'de tempo que você recupera' },
]

export function Hero() {
  return (
    <section id="top" className="relative pt-28 md:pt-36 pb-16 md:pb-28 overflow-hidden">
      {/* Backdrop */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(139,92,246,0.28)_0%,rgba(139,92,246,0)_70%)]" />
        <div className="absolute inset-0 bg-grid-dark [background-size:48px_48px] mask-fade-b opacity-70" />
        <div className="absolute left-1/2 top-[40%] -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-primary-600/20 blur-[120px]" />
        <div className="absolute right-[-10%] top-[10%] h-[340px] w-[340px] rounded-full bg-accent-cyan/20 blur-[120px]" />
        <div className="absolute left-[-10%] top-[25%] h-[320px] w-[320px] rounded-full bg-accent-fuchsia/20 blur-[120px]" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-primary-300" />
            <span>
              Novo · IA que cria, agenda e publica por você
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 font-display text-[40px] leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[76px] lg:leading-[1.02]"
          >
            Você atende.
            <br className="hidden sm:block" />
            <span className="text-gradient">A Soma.ai cuida das suas redes.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg"
          >
            Sistema operacional de marketing com IA para pequenas empresas.
            Geramos posts, vídeos, roteiros, campanhas e mensagens no WhatsApp —
            automaticamente, no seu estilo, todos os dias.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <motion.a
              href={`${SITE.appUrl}?signup=1`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="group/hero relative inline-flex w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-primary-400 via-primary-600 to-accent-fuchsia px-6 py-3.5 text-sm font-semibold text-white shadow-glow-lg transition-shadow hover:shadow-[0_0_80px_-10px_rgba(232,121,249,0.7)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/25 opacity-0 transition-all duration-500 group-hover/hero:left-[110%] group-hover/hero:opacity-100"
              />
              <span className="relative z-10">Começar agora</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover/hero:translate-x-1" />
            </motion.a>
            <a
              href="#como-funciona"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-zinc-200 backdrop-blur hover:bg-white/10 transition"
            >
              <PlayCircle className="h-4 w-4 text-primary-300" />
              Ver como funciona
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-6 text-xs text-zinc-400"
          >
            Sem cartão para testar · Cancelamento em 1 clique · Suporte em português
          </motion.div>
        </div>

        {/* Product visual */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-14 max-w-5xl"
        >
          <DashboardMock />
          <FloatingCards />
        </motion.div>

        {/* Metrics */}
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {METRICS.map((m) => (
            <div
              key={m.k}
              className="glass rounded-2xl p-4 text-center"
            >
              <div className="font-display text-2xl font-bold text-gradient-static">{m.k}</div>
              <div className="mt-1 text-xs text-zinc-400">{m.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DashboardMock() {
  return (
    <div className="conic-border relative overflow-hidden rounded-3xl">
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0c18] to-[#07070c] shadow-card">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="rounded-full bg-white/5 px-2 py-0.5">app.soma.ai/dashboard</span>
          </div>
          <div className="text-[11px] text-zinc-500">Hoje, 08:42</div>
        </div>

        <div className="grid grid-cols-12 gap-0">
          {/* Sidebar */}
          <aside className="hidden md:flex col-span-3 border-r border-white/5 flex-col gap-1 p-4">
            {[
              { i: Sparkles, t: 'Visão geral' },
              { i: Instagram, t: 'Feed' },
              { i: Video, t: 'Vídeos' },
              { i: Calendar, t: 'Agenda' },
              { i: Megaphone, t: 'Campanhas' },
              { i: MessageCircle, t: 'WhatsApp' },
            ].map(({ i: Icon, t }, idx) => (
              <div
                key={t}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs ${
                  idx === 0
                    ? 'bg-primary-500/10 text-primary-200 border border-primary-500/20'
                    : 'text-zinc-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t}
              </div>
            ))}
          </aside>

          {/* Main */}
          <div className="col-span-12 md:col-span-9 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500">Painel da empresa</div>
                <div className="font-display text-lg md:text-xl text-white">Boa segunda, Ana 👋</div>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-[11px] text-primary-200">
                <Sparkles className="h-3 w-3" /> IA ativa · 12 posts na fila
              </div>
            </div>

            {/* KPIs */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { l: 'Alcance (30d)', v: '184.2K', d: '+38%' },
                { l: 'Engajamento', v: '12.7%', d: '+4.1pp' },
                { l: 'Leads no WhatsApp', v: '246', d: '+52%' },
              ].map((k) => (
                <div key={k.l} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">{k.l}</div>
                  <div className="mt-1 font-display text-base md:text-lg text-white">{k.v}</div>
                  <div className="text-[10px] text-emerald-400">{k.d}</div>
                </div>
              ))}
            </div>

            {/* Post preview + Chart */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Instagram className="h-3.5 w-3.5 text-primary-300" />
                    Post agendado · Terça, 18h
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                    Pronto
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-3">
                  <div className="col-span-2 aspect-[4/5] rounded-lg bg-gradient-to-br from-primary-500/30 via-accent-fuchsia/30 to-accent-cyan/30 relative overflow-hidden">
                    <div className="absolute inset-0 noise" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="h-2 w-10 rounded bg-white/80" />
                      <div className="mt-1 h-1.5 w-16 rounded bg-white/50" />
                    </div>
                  </div>
                  <div className="col-span-3 space-y-2">
                    <div className="h-2 w-4/5 rounded bg-white/15" />
                    <div className="h-2 w-3/5 rounded bg-white/10" />
                    <div className="h-2 w-2/3 rounded bg-white/10" />
                    <div className="mt-2 flex gap-1.5">
                      <span className="rounded-full bg-primary-500/15 px-1.5 py-0.5 text-[9px] text-primary-200">#pizzaria</span>
                      <span className="rounded-full bg-primary-500/15 px-1.5 py-0.5 text-[9px] text-primary-200">#saopaulo</span>
                      <span className="rounded-full bg-primary-500/15 px-1.5 py-0.5 text-[9px] text-primary-200">#promo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="text-xs text-zinc-400">Crescimento · últimos 30 dias</div>
                <MiniChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniChart() {
  const points = [6, 8, 7, 11, 10, 14, 13, 17, 20, 19, 24, 28, 32]
  const max = Math.max(...points)
  const w = 220
  const h = 80
  const step = w / (points.length - 1)
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p / max) * h}`)
    .join(' ')
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full">
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#chartFill)" />
        <path d={d} fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
        <span>semana 1</span>
        <span>agora</span>
      </div>
    </div>
  )
}

function FloatingCards() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -30, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="hidden lg:flex absolute -left-8 top-14 items-center gap-2 rounded-2xl glass-strong px-3.5 py-2.5 text-xs shadow-card animate-float"
      >
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary-400 to-accent-fuchsia">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-medium text-white">Post gerado</div>
          <div className="text-zinc-400">3.2s · estilo da sua marca</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="hidden lg:flex absolute -right-6 bottom-20 items-center gap-3 rounded-2xl glass-strong px-3.5 py-2.5 text-xs shadow-card animate-float [animation-delay:1.5s]"
      >
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-accent-cyan">
          <MessageCircle className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="font-medium text-white">+12 leads no WhatsApp</div>
          <div className="text-zinc-400">vindos do post de ontem</div>
        </div>
      </motion.div>
    </>
  )
}
